package api

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"log"
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

type RequestError struct {
	RequestId string
	error     error // Error that client see
	cause     error // What caused error, invalid DB request for example
	Code      int
}

func (e *RequestError) Error() string {
	return e.error.Error()
}

func (e *RequestError) Unwrap() error {
	return e.cause
}

func requestLog(requestId string, str string) {
	log.Println(fmt.Sprintf("[%s] %s", requestId, str))
}

func fail(w http.ResponseWriter, err RequestError) {
	requestLog(err.RequestId, fmt.Sprintf(
		"Request failed, status: %d, message: %s, cause: %s",
		err.Code,
		err.Error(),
		err.Unwrap().Error(),
	))
	w.WriteHeader(err.Code)
	w.Write([]byte(`{"error":"` + err.Error() + `"}`))
	return
}

func Auth(w http.ResponseWriter, r *http.Request) {
	type AuthResp struct {
		Token string `json:"token"`
		Uuid  string `json:"uuid"`
	}

	requestId := r.Context().Value("requestId").(string)
	requestLog(requestId, fmt.Sprintf("Request matched Auth route"))

    ip := r.Header.Get("X-Real-Ip") // Client ip from proxy

	if ip == "" {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("No remove ip found"),
			cause:     errors.New("Proxy did not provided 'X-Real-Ip header'"),
			Code:      500,
		}
        fail(w, errReq)
		return
	}

	ipnet, err := netip.ParseAddr(ip)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Parsing ip address failed"),
			cause:     err,
			Code:      500,
		}
		fail(w, errReq)
		return
	}

	author, err := db.Query.Auth(r.Context(), ipnet)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server error"),
			cause:     err,
			Code:      500,
		}
		fail(w, errReq)
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodES256, jwt.MapClaims{
		"exp":  time.Now().Add(time.Hour * 48).Unix(),
		"uuid": author.ID,
		"ip":   author.Ip,
	})

	sign, err := token.SignedString(jwtKey)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Parsing ip address failed"),
			cause:     err,
			Code:      500,
		}
		fail(w, errReq)
		return
	}

	resp := AuthResp{
		Token: sign,
		Uuid:  author.ID.String(),
	}

	marshResp, err := json.Marshal(resp)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server error"),
			cause:     err,
			Code:      500,
		}
		fail(w, errReq)
		return
	}

	w.Write(marshResp)
	requestLog(requestId, fmt.Sprintf("Request successful, code: %d, response: %s", 200, marshResp))
}

func GetPosts(w http.ResponseWriter, r *http.Request) {
	type GetPostsResp struct {
		NextOffset *int               `json:"nextOffset"`
		Posts      []sqlc.GetPostsRow `json:"posts"`
	}

	requestId := r.Context().Value("requestId").(string)
	requestLog(requestId, fmt.Sprintf("Request matched GetPosts route"))

	author := r.Context().Value("author").(uuid.UUID)

	offsetStr := r.URL.Query().Get("offset")
	search := r.URL.Query().Get("search")

	var offset int32

	if offsetStr != "" {
		offset64, err := strconv.Atoi(offsetStr)

		offset = int32(offset64)

		if err != nil {
			errReq := RequestError{
				RequestId: requestId,
				error:     errors.New("'offset' is not a number"),
				cause:     errors.New("Bad request"),
				Code:      400,
			}
			fail(w, errReq)
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
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server error"),
			cause:     err,
			Code:      400,
		}
		fail(w, errReq)
		return
	}

	var nextOffset *int

	if len(posts) >= postsPerLoad {
		temp := int(offset) + postsPerLoad
		nextOffset = &temp
	}

	resp := GetPostsResp{
		NextOffset: nextOffset,
		Posts:      posts,
	}

	if resp.Posts == nil {
		resp.Posts = make([]sqlc.GetPostsRow, 0)
	}

	marshResp, err := json.Marshal(resp)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server error"),
			cause:     err,
			Code:      400,
		}
		fail(w, errReq)
		return
	}

	w.Write(marshResp)
	requestLog(requestId, fmt.Sprintf("Request successful, code: %d, response: %s", 200, marshResp))
}

func CreatePost(w http.ResponseWriter, r *http.Request) {
	type CreatePostReq struct {
		Content string `json:"content"`
	}
	//Copied some of the sqlc fields, because embedded struct will not be flattened in json
	type CreatePostResp struct {
		ID            int32              `json:"id"`
		Author        uuid.UUID          `json:"author"`
		CreatedAt     pgtype.Timestamptz `json:"createdAt"`
		Content       string             `json:"content"`
		LikesCount    int                `json:"likesCount"`
		CommentsCount int                `json:"commentsCount"`
		IsLiked       bool               `json:"isLiked"`
	}

	requestId := r.Context().Value("requestId").(string)
	requestLog(requestId, fmt.Sprintf("Request matched CreatePost route"))

	var post CreatePostReq

	err := json.NewDecoder(r.Body).Decode(&post)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Body is invalid"),
			cause:     err,
			Code:      400,
		}
		fail(w, errReq)
		return
	}

	if post.Content == "" {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("'content' is empty"),
			cause:     errors.New("Bad request"),
			Code:      400,
		}
		fail(w, errReq)
		return
	}

	author := r.Context().Value("author").(uuid.UUID)

	params := sqlc.CreatePostParams{
		Author:  author,
		Content: post.Content,
	}

	createdPost, err := db.Query.CreatePost(r.Context(), params)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server error"),
			cause:     err,
			Code:      500,
		}
		fail(w, errReq)
		return
	}

	filled := CreatePostResp{
		ID:            createdPost.ID,
		Author:        createdPost.Author,
		CreatedAt:     createdPost.CreatedAt,
		Content:       createdPost.Content,
		LikesCount:    0,
		CommentsCount: 0,
		IsLiked:       false,
	}

	marshResp, err := json.Marshal(filled)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server error"),
			cause:     err,
			Code:      500,
		}
		fail(w, errReq)
		return
	}

	w.Write(marshResp)
	requestLog(requestId, fmt.Sprintf("Request successful, code: %d, response: %s", 200, marshResp))
}

func DeletePost(w http.ResponseWriter, r *http.Request) {
	requestId := r.Context().Value("requestId").(string)
	requestLog(requestId, fmt.Sprintf("Request matched DeletePost route"))

	postIdStr := chi.URLParam(r, "postId")

	postId, err := strconv.Atoi(postIdStr)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("'postId' is not a number"),
			cause:     errors.New("Bad request"),
			Code:      400,
		}
		fail(w, errReq)
		return
	}

	author := r.Context().Value("author").(uuid.UUID)

	postAuthor, err := db.Query.GetPostAuthor(r.Context(), int32(postId))

	if postAuthor != author {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Forbidden"),
			cause:     errors.New("Forbidden"),
			Code:      403,
		}
		fail(w, errReq)
		return
	}

	err = db.Query.DeletePost(r.Context(), int32(postId))

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server error"),
			cause:     err,
			Code:      500,
		}
		fail(w, errReq)
		return
	}

	requestLog(requestId, "Request succesful")

	code := 204
	w.WriteHeader(code)
	requestLog(requestId, fmt.Sprintf("Request successful, code: %d", code))
}

func LikePost(w http.ResponseWriter, r *http.Request) {
	requestId := r.Context().Value("requestId").(string)
	requestLog(requestId, fmt.Sprintf("Request matched LikePost route"))

	postIdStr := chi.URLParam(r, "postId")

	postId, err := strconv.Atoi(postIdStr)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("'postId' is not a number"),
			cause:     errors.New("Bad request"),
			Code:      400,
		}
		fail(w, errReq)
		return
	}

	author := r.Context().Value("author").(uuid.UUID)

	params := sqlc.LikePostParams{
		Author: author,
		Post:   int32(postId),
	}

	_, err = db.Query.LikePost(r.Context(), params)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server error"),
			cause:     err,
			Code:      500,
		}
		fail(w, errReq)
		return
	}

	code := 204
	w.WriteHeader(code)
	requestLog(requestId, fmt.Sprintf("Request successful, code: %d", code))
}

func UnlikePost(w http.ResponseWriter, r *http.Request) {
	requestId := r.Context().Value("requestId").(string)
	requestLog(requestId, fmt.Sprintf("Request matched UnlikePost route"))

	postIdStr := chi.URLParam(r, "postId")

	postId, err := strconv.Atoi(postIdStr)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("'postId' is not a number"),
			cause:     errors.New("Bad request"),
			Code:      400,
		}
		fail(w, errReq)
		return
	}

	author := r.Context().Value("author").(uuid.UUID)

	params := sqlc.UnlikePostParams{
		Post:   int32(postId),
		Author: author,
	}

	err = db.Query.UnlikePost(r.Context(), params)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server error"),
			cause:     err,
			Code:      500,
		}
		fail(w, errReq)
		return
	}

	code := 204
	w.WriteHeader(code)
	requestLog(requestId, fmt.Sprintf("Request successful, code: %d", code))
}

func GetComments(w http.ResponseWriter, r *http.Request) {
	type GetCommentsResp struct {
		NextOffset *int                  `json:"nextOffset"`
		Comments   []sqlc.GetCommentsRow `json:"comments"`
	}

	requestId := r.Context().Value("requestId").(string)
	requestLog(requestId, fmt.Sprintf("Request matched GetComments route"))

	postIdStr := chi.URLParam(r, "postId")

	postId, err := strconv.Atoi(postIdStr)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("'postId' is not a number"),
			cause:     errors.New("Bad request"),
			Code:      400,
		}
		fail(w, errReq)
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
			errReq := RequestError{
				RequestId: requestId,
				error:     errors.New("'offset' is not a number"),
				cause:     errors.New("Bad request"),
				Code:      400,
			}
			fail(w, errReq)
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
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server errro"),
			cause:     err,
			Code:      500,
		}
		fail(w, errReq)
		return
	}

	var nextOffset *int

	if len(comments) >= commentsPerLoad {
		temp := int(offset) + commentsPerLoad
		nextOffset = &temp
	}

	resp := GetCommentsResp{
		NextOffset: nextOffset,
		Comments:   comments,
	}

	if resp.Comments == nil {
		resp.Comments = make([]sqlc.GetCommentsRow, 0)
	}

	marshResp, err := json.Marshal(resp)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server errro"),
			cause:     err,
			Code:      500,
		}
		fail(w, errReq)
		return
	}

	w.Write(marshResp)
	requestLog(requestId, fmt.Sprintf("Request successful, code: %d, response: %s", 200, marshResp))
}

func GetComment(w http.ResponseWriter, r *http.Request) {
	requestId := r.Context().Value("requestId").(string)
	requestLog(requestId, fmt.Sprintf("Request matched GetComment route"))

	author := r.Context().Value("author").(uuid.UUID)
	commentIdStr := chi.URLParam(r, "commentId")

	commentId, err := strconv.Atoi(commentIdStr)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("'commentId' is not a number"),
			cause:     errors.New("Bad request"),
			Code:      400,
		}
		fail(w, errReq)
		return
	}

	comment, err := db.Query.GetComment(r.Context(), sqlc.GetCommentParams{
		ID:     int32(commentId),
		Author: author,
	})

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server error"),
			cause:     err,
			Code:      500,
		}
		fail(w, errReq)
		return
	}

	marshResp, err := json.Marshal(comment)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server error"),
			cause:     err,
			Code:      500,
		}
		fail(w, errReq)
		return
	}

	w.Write(marshResp)
	requestLog(requestId, fmt.Sprintf("Request successful, code: %d, response: %s", 200, marshResp))
}

func CreateComment(w http.ResponseWriter, r *http.Request) {
	type CreateCommentReq struct {
		Content string `json:"content"`
		Reply   int32
	}
	// Same reason as in the CreatePostResp
	type CreateCommentResp struct {
		ID         int32              `json:"id"`
		Post       int32              `json:"post"`
		Author     uuid.UUID          `json:"author"`
		Reply      pgtype.Int4        `json:"reply"`
		Content    string             `json:"content"`
		CreatedAt  pgtype.Timestamptz `json:"createdAt"`
		LikesCount int                `json:"likesCount"`
		IsLiked    bool               `json:"isLiked"`
	}

	requestId := r.Context().Value("requestId").(string)
	requestLog(requestId, fmt.Sprintf("Request matched CreateComment route"))

	postIdStr := chi.URLParam(r, "postId")

	postId, err := strconv.Atoi(postIdStr)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("'postId' is not a number"),
			cause:     errors.New("Bad request"),
			Code:      400,
		}
		fail(w, errReq)
		return
	}

	var comment CreateCommentReq

	err = json.NewDecoder(r.Body).Decode(&comment)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Invalid body"),
			cause:     err,
			Code:      400,
		}
		fail(w, errReq)
		return
	}

	if comment.Content == "" {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("'content' is empty"),
			cause:     err,
			Code:      400,
		}
		fail(w, errReq)
		return
	}

	uuid := r.Context().Value("author").(uuid.UUID)

	var createdComment sqlc.Comment

	if comment.Reply == 0 {
		params := sqlc.CreateCommentParams{
			Post:    int32(postId),
			Author:  uuid,
			Content: comment.Content,
		}

		createdComment, err = db.Query.CreateComment(r.Context(), params)
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

		createdComment, err = db.Query.CreateCommentWithReply(r.Context(), params)
	}

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server error"),
			cause:     err,
			Code:      500,
		}
		fail(w, errReq)
		return
	}

	filled := CreateCommentResp{
		ID:         createdComment.ID,
		Post:       createdComment.Post,
		Author:     createdComment.Author,
		Reply:      createdComment.Reply,
		Content:    createdComment.Content,
		CreatedAt:  createdComment.CreatedAt,
		LikesCount: 0,
		IsLiked:    false,
	}

	marshResp, err := json.Marshal(filled)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server error"),
			cause:     err,
			Code:      500,
		}
		fail(w, errReq)
		return
	}

	w.Write(marshResp)
	requestLog(requestId, fmt.Sprintf("Request successful, code: %d, response: %s", 200, marshResp))
}

func LikeComment(w http.ResponseWriter, r *http.Request) {
	requestId := r.Context().Value("requestId").(string)
	requestLog(requestId, fmt.Sprintf("Request matched LikeComment route"))

	commentIdStr := chi.URLParam(r, "commentId")

	commentId, err := strconv.Atoi(commentIdStr)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("'commentId' is not a number"),
			cause:     err,
			Code:      400,
		}
		fail(w, errReq)
		return
	}

	author := r.Context().Value("author").(uuid.UUID)

	params := sqlc.LikeCommentParams{
		Author:  author,
		Comment: int32(commentId),
	}

	_, err = db.Query.LikeComment(r.Context(), params)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server error"),
			cause:     err,
			Code:      400,
		}
		fail(w, errReq)
		return
	}

	code := 204
	w.WriteHeader(code)
	requestLog(requestId, fmt.Sprintf("Request successful, code: %d", 200))
}

func UnlikeComment(w http.ResponseWriter, r *http.Request) {
	requestId := r.Context().Value("requestId").(string)
	requestLog(requestId, fmt.Sprintf("Request matched UnlikeComment route"))

	commentIdStr := chi.URLParam(r, "commentId")

	commentId, err := strconv.Atoi(commentIdStr)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("'commentId' is not a number"),
			cause:     errors.New("Bad request"),
			Code:      400,
		}
		fail(w, errReq)
		return
	}

	author := r.Context().Value("author").(uuid.UUID)

	params := sqlc.UnlikeCommentParams{
		Comment: int32(commentId),
		Author:  author,
	}

	err = db.Query.UnlikeComment(r.Context(), params)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server error"),
			cause:     err,
			Code:      400,
		}
		fail(w, errReq)
		return
	}

	code := 204
	w.WriteHeader(code)
	requestLog(requestId, fmt.Sprintf("Request successful, code: %d", 200))
}

func DeleteComment(w http.ResponseWriter, r *http.Request) {
	requestId := r.Context().Value("requestId").(string)
	requestLog(requestId, fmt.Sprintf("Request matched DeleteComment route"))

	commentIdStr := chi.URLParam(r, "commentId")

	commentId, err := strconv.Atoi(commentIdStr)

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("'commentId' is not a number"),
			cause:     errors.New("Bad request"),
			Code:      400,
		}
		fail(w, errReq)
		return
	}

	author := r.Context().Value("author").(uuid.UUID)

	commentAuthor, err := db.Query.GetCommentAuthor(r.Context(), int32(commentId))

	if commentAuthor != author {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server error"),
			cause:     err,
			Code:      500,
		}
		fail(w, errReq)
		return
	}

	err = db.Query.DeleteComment(r.Context(), int32(commentId))

	if err != nil {
		errReq := RequestError{
			RequestId: requestId,
			error:     errors.New("Internal server error"),
			cause:     err,
			Code:      500,
		}
		fail(w, errReq)
		return
	}

	code := 204
	w.WriteHeader(code)
	requestLog(requestId, fmt.Sprintf("Request successful, code: %d", 200))
}

func NotFound(w http.ResponseWriter, r *http.Request) {
	requestId := r.Context().Value("requestId").(string)

	requestLog(requestId, "Request did not matched any route")

	errReq := RequestError{
		RequestId: requestId,
		error:     errors.New("Resource not found"),
		cause:     errors.New("Resource not found"),
		Code:      404,
	}

	fail(w, errReq)
}
