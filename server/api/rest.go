package api

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"encoding/json"
	"net"
	"net/http"
	"net/netip"
	"snakesss/db"
	"snakesss/sqlc"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

const postsPerLoad = 15
const commentsPerLoad = 15

var jwtKey, err = ecdsa.GenerateKey(elliptic.P256(), rand.Reader)

type Reply struct {
	Id     int32
	Author uuid.UUID
}

func sendError(w http.ResponseWriter, code int, message string) {
	w.WriteHeader(code)
	w.Write([]byte(`{"error":"` + message + `"}`))
	return
}

type AuthResponse struct {
	Token string `json:"token"`
	Uuid  string `json:"uuid"`
}

func Auth(w http.ResponseWriter, r *http.Request) {
	ip, _, err := net.SplitHostPort(r.RemoteAddr)

	if err != nil {
		return
	}

	ipnet, err := netip.ParseAddr(ip)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	author, err := db.Query.Auth(r.Context(), ipnet)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodES256, jwt.MapClaims{
		"exp":  time.Now().Add(time.Hour * 48).Unix(),
		"uuid": author.ID,
		"ip":   author.Ip,
	})

	sign, err := token.SignedString(jwtKey)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	resp := AuthResponse{
		Token: sign,
		Uuid:  author.ID.String(),
	}

	rawResp, err := json.Marshal(resp)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	w.Write(rawResp)
}

func GetPosts(w http.ResponseWriter, r *http.Request) {
	type Resp struct {
		NextOffset *int               `json:"nextOffset"`
		Posts      []sqlc.GetPostsRow `json:"posts"`
	}

	author := r.Context().Value("author").(uuid.UUID)

	offsetStr := r.URL.Query().Get("offset")
	search := r.URL.Query().Get("search")

	var offset int32

	if offsetStr != "" {
		offset64, err := strconv.Atoi(offsetStr)

		offset = int32(offset64)

		if err != nil {
			sendError(w, 400, "Offset is not a number")
			return
		}
	}

	sortByStr := r.URL.Query().Get("sortBy")

	var dateAsc, dateDesc, topAsc bool

	switch sortByStr {
	case "dateasc":
		dateAsc = true
	case "datedesc":
		dateDesc = true
	case "topasc":
		topAsc = true
	default:
		dateAsc = true
	}

	posts, err := db.Query.GetPosts(r.Context(), sqlc.GetPostsParams{
		Author:   author,
		Offset:   offset,
		Limit:    postsPerLoad,
        Search:   search,
		DateAsc:  dateAsc,
		DateDesc: dateDesc,
		TopAsc:   topAsc,
	})

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	var nextOffset *int

	if len(posts) >= postsPerLoad {
		temp := int(offset) + postsPerLoad
		nextOffset = &temp
	}

	resp := Resp{
		NextOffset: nextOffset,
		Posts:      posts,
	}

	if resp.Posts == nil {
		resp.Posts = make([]sqlc.GetPostsRow, 0)
	}

	marsh, err := json.Marshal(resp)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	w.Write(marsh)
}

type CreatePostRequest struct {
	Content string `json:"content"`
}

func CreatePost(w http.ResponseWriter, r *http.Request) {
	var post CreatePostRequest

	err := json.NewDecoder(r.Body).Decode(&post)

	if err != nil {
		sendError(w, 404, err.Error())
		return
	}

	if post.Content == "" {
		sendError(w, 404, "Content cannot be empty")
		return
	}

	author := r.Context().Value("author").(uuid.UUID)

	params := sqlc.CreatePostParams{
		Author:  author,
		Content: post.Content,
	}

	createdPost, err := db.Query.CreatePost(r.Context(), params)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	marh, err := json.Marshal(createdPost)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	w.Write(marh)
}

func DeletePost(w http.ResponseWriter, r *http.Request) {
	postIdStr := chi.URLParam(r, "postId")

	postId, err := strconv.Atoi(postIdStr)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	author := r.Context().Value("author").(uuid.UUID)

	postAuthor, err := db.Query.GetPostAuthor(r.Context(), int32(postId))

	if postAuthor != author {
		sendError(w, 403, "Forbidden")
		return
	}

	err = db.Query.DeletePost(r.Context(), int32(postId))

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	w.WriteHeader(204)
}

func LikePost(w http.ResponseWriter, r *http.Request) {
	postIdStr := chi.URLParam(r, "postId")

	postId, err := strconv.Atoi(postIdStr)

	if err != nil {
		sendError(w, 500, err.Error())
		w.WriteHeader(500)
		return
	}

	author := r.Context().Value("author").(uuid.UUID)

	params := sqlc.LikePostParams{
		Author: author,
		Post:   int32(postId),
	}

	_, err = db.Query.LikePost(r.Context(), params)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	w.WriteHeader(204)
}

func UnlikePost(w http.ResponseWriter, r *http.Request) {
	postIdStr := chi.URLParam(r, "postId")

	postId, err := strconv.Atoi(postIdStr)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	author := r.Context().Value("author").(uuid.UUID)

	params := sqlc.UnlikePostParams{
		Post:   int32(postId),
		Author: author,
	}

	err = db.Query.UnlikePost(r.Context(), params)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	w.WriteHeader(204)
}

func GetComments(w http.ResponseWriter, r *http.Request) {
    // sendError(w, 500, "no :)")
    // return
	type Resp struct {
		NextOffset *int                  `json:"nextOffset"`
		Comments   []sqlc.GetCommentsRow `json:"comments"`
	}

	postIdStr := chi.URLParam(r, "postId")

	postId, err := strconv.Atoi(postIdStr)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	author := r.Context().Value("author").(uuid.UUID)

	offsetStr := r.URL.Query().Get("offset")
	search := r.URL.Query().Get("search")

	var offset int32

	if offsetStr != "" {
		offset64, err := strconv.Atoi(offsetStr)

		offset = int32(offset64)

		if err != nil {
			sendError(w, 400, "Offset is not a number")
			return
		}
	}

	sortByStr := r.URL.Query().Get("sortBy")

	var dateAsc, dateDesc, topAsc bool

	switch sortByStr {
	case "dateasc":
		dateAsc = true
	case "datedesc":
		dateDesc = true
	case "topasc":
		topAsc = true
	default:
		dateAsc = true
	}

	params := sqlc.GetCommentsParams{
		Post:     int32(postId),
		Author:   author,
		Offset:   offset,
		Limit:    commentsPerLoad,
        Search:   search,
		DateAsc:  dateAsc,
		DateDesc: dateDesc,
		TopAsc:   topAsc,
	}

	comments, err := db.Query.GetComments(r.Context(), params)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	var nextOffset *int

	if len(comments) >= commentsPerLoad {
		temp := int(offset) + commentsPerLoad
		nextOffset = &temp
	}

	resp := Resp{
		NextOffset: nextOffset,
		Comments:   comments,
	}

	if resp.Comments == nil {
		resp.Comments = make([]sqlc.GetCommentsRow, 0)
	}

	marsh, err := json.Marshal(resp)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	w.Write(marsh)
}

func GetComment(w http.ResponseWriter, r *http.Request) {
	author := r.Context().Value("author").(uuid.UUID)
	commentIdStr := chi.URLParam(r, "commentId")

	commentId, err := strconv.Atoi(commentIdStr)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	comment, err := db.Query.GetComment(r.Context(), sqlc.GetCommentParams{
		ID:     int32(commentId),
		Author: author,
	})

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	marsh, err := json.Marshal(comment)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	w.Write(marsh)
}

type CreateCommentRequest struct {
	Content string `json:"content"`
	Reply   int32
}

func CreateComment(w http.ResponseWriter, r *http.Request) {
	postIdStr := chi.URLParam(r, "postId")

	postId, err := strconv.Atoi(postIdStr)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	var comment CreateCommentRequest

	err = json.NewDecoder(r.Body).Decode(&comment)

	if err != nil {
		sendError(w, 404, err.Error())
		return
	}

	if comment.Content == "" {
		sendError(w, 404, "Content cannot be empty")
		return
	}

	uuid := r.Context().Value("author").(uuid.UUID)

	var created sqlc.Comment

	if comment.Reply == 0 {
		params := sqlc.CreateCommentParams{
			Post:    int32(postId),
			Author:  uuid,
			Content: comment.Content,
		}

		created, err = db.Query.CreateComment(r.Context(), params)
	} else {
		params := sqlc.CreateCommentWithReplyParams{
			Post:    int32(postId),
			Author:  uuid,
			Content: comment.Content,
			Reply: pgtype.Int4{
				Int32: comment.Reply,
				Valid: true,
			},
		}

		created, err = db.Query.CreateCommentWithReply(r.Context(), params)
	}

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	marh, err := json.Marshal(created)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	w.Write(marh)
}

func LikeComment(w http.ResponseWriter, r *http.Request) {
	commentIdStr := chi.URLParam(r, "commentId")

	commentId, err := strconv.Atoi(commentIdStr)

	if err != nil {
		sendError(w, 500, err.Error())
		w.WriteHeader(500)
		return
	}

	author := r.Context().Value("author").(uuid.UUID)

	params := sqlc.LikeCommentParams{
		Author:  author,
		Comment: int32(commentId),
	}

	_, err = db.Query.LikeComment(r.Context(), params)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	w.WriteHeader(204)
}

func UnlikeComment(w http.ResponseWriter, r *http.Request) {
	commentIdStr := chi.URLParam(r, "commentId")

	commentId, err := strconv.Atoi(commentIdStr)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	author := r.Context().Value("author").(uuid.UUID)

	params := sqlc.UnlikeCommentParams{
		Comment: int32(commentId),
		Author:  author,
	}

	err = db.Query.UnlikeComment(r.Context(), params)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	w.WriteHeader(204)
}

func DeleteComment(w http.ResponseWriter, r *http.Request) {
	commentIdStr := chi.URLParam(r, "commentId")

	commentId, err := strconv.Atoi(commentIdStr)

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	author := r.Context().Value("author").(uuid.UUID)

	commentAuthor, err := db.Query.GetCommentAuthor(r.Context(), int32(commentId))

	if commentAuthor != author {
		sendError(w, 403, "Forbidden")
		return
	}

	err = db.Query.DeleteComment(r.Context(), int32(commentId))

	if err != nil {
		sendError(w, 500, err.Error())
		return
	}

	w.WriteHeader(204)
}
