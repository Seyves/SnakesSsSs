-- name: Auth :one 
INSERT INTO author (ip)
VALUES ($1)
ON CONFLICT (ip)
DO UPDATE SET 
    ip = $1
RETURNING *;

-- name: GetComments :many
SELECT 
    comment.id,
    comment.author,
    comment.content,
    reply_comment.id as "reply_comment_id",
    reply_comment.author as "reply_comment_author",
    comment.created_at,
    coalesce(likes.count, 0) as "likes_count",
    CASE WHEN mine_like.id IS NOT NULL THEN true ELSE false END as "is_liked"
FROM comment
LEFT JOIN (
    SELECT count(comment_like.comment) as "count", comment_like.comment as "comment_id" FROM comment_like
    GROUP BY comment_like.comment
) as likes
ON likes.comment_id = comment.id
LEFT JOIN (
    SELECT comment_like.comment as "id" FROM comment_like 
    WHERE comment_like.author = $2
) as mine_like 
ON mine_like.id = comment.id
LEFT JOIN comment as reply_comment 
ON reply_comment.id = comment.reply
WHERE comment.post = $1 AND CASE WHEN @search::text != '' THEN 
    CASE WHEN LEFT(@search::text, 1) = '@' THEN
        comment.author::text ILIKE concat('%', SUBSTRING(@search::text, 2), '%') 
    ELSE 
        comment.content ILIKE concat('%', @search::text, '%') 
    END
ELSE true END
ORDER BY 
      CASE WHEN @date_asc::bool THEN comment.created_at END ASC,
      CASE WHEN @date_desc::bool THEN comment.created_at END DESC,
      CASE WHEN @top_asc::bool THEN likes.count END ASC
LIMIT $3 OFFSET $4;

-- name: GetComment :one
SELECT 
    comment.id,
    comment.author,
    comment.content,
    reply_comment.id as "reply_comment_id",
    reply_comment.author as "reply_comment_author",
    comment.created_at,
    coalesce(likes.count, 0) as "likes_count",
    CASE WHEN mine_like.id IS NOT NULL THEN true ELSE false END as "is_liked"
FROM comment
LEFT JOIN (
    SELECT count(comment_like.comment) as "count", comment_like.comment as "comment_id" FROM comment_like
    GROUP BY comment_like.comment
) as likes
ON likes.comment_id = comment.id
LEFT JOIN (
    SELECT comment_like.comment as "id" FROM comment_like 
    WHERE comment_like.author = $2
) as mine_like 
ON mine_like.id = comment.id
LEFT JOIN comment as reply_comment 
ON reply_comment.id = comment.reply
WHERE comment.id = $1;

-- name: GetPosts :many
SELECT 
    post.id, 
    post.author, 
    post.created_at, 
    post.content, 
    coalesce(likes.count, 0) as "likes_count",
    coalesce(comments.count, 0) as "comments_count",
    CASE WHEN mine_like.id IS NOT NULL THEN true ELSE false END as "is_liked"
FROM post  
LEFT JOIN (
    SELECT count(post_like.post) as "count", post_like.post as "post_id" FROM post_like
    GROUP BY post_like.post
) as likes
ON likes.post_id = post.id
LEFT JOIN (
    SELECT count(comment.id) as "count", comment.post as "post_id" FROM comment 
    GROUP BY comment.post
) as comments
ON comments.post_id = post.id
LEFT JOIN (
    SELECT post_like.post as "id" FROM post_like 
    WHERE post_like.author = $1
) as mine_like 
ON mine_like.id = post.id
WHERE CASE WHEN @search::text != '' THEN 
    CASE WHEN LEFT(@search::text, 1) = '@' THEN
        post.author::text ILIKE concat('%', SUBSTRING(@search::text, 2), '%') 
    ELSE 
        post.content ILIKE concat('%', @search::text, '%') 
    END
ELSE true END
ORDER BY 
      CASE WHEN @date_asc::bool THEN post.created_at END ASC,
      CASE WHEN @date_desc::bool THEN post.created_at END DESC,
      CASE WHEN @top_asc::bool THEN likes.count END ASC
LIMIT $2 OFFSET $3;

-- name: GetPostAuthor :one
SELECT author from post
WHERE id = $1;

-- name: CreatePost :one
INSERT INTO post (author, content)
VALUES ($1, $2)
RETURNING *;

-- name: DeletePost :exec
DELETE FROM post
WHERE id = $1;

-- name: CreateComment :one
INSERT INTO comment (author, post, content)
VALUES ($1, $2, $3)
RETURNING *;

-- name: CreateCommentWithReply :one
INSERT INTO comment (author, post, content, reply)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetCommentAuthor :one
SELECT author from comment 
WHERE id = $1;

-- name: LikePost :one
INSERT INTO post_like (author, post)
VALUES ($1, $2)
RETURNING *;

-- name: UnlikePost :exec
DELETE FROM post_like
WHERE post = $1 AND author = $2;

-- name: LikeComment :one
INSERT INTO comment_like (author, comment)
VALUES ($1, $2)
RETURNING *;

-- name: UnlikeComment :exec
DELETE FROM comment_like
WHERE comment = $1 AND author = $2;

-- name: DeleteComment :exec
DELETE FROM comment
WHERE id = $1;
