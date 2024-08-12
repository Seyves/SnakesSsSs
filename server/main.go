package main

import (
	"log"
	"net/http"
	"snakesss/api"
	"snakesss/db"

	"github.com/go-chi/chi/v5"
	"gopkg.in/natefinch/lumberjack.v2"
)

func main() {
	r := chi.NewRouter()

    log.SetOutput(&lumberjack.Logger{
        Filename:   "./log/log.log",
        MaxSize:    500, // megabytes
        MaxBackups: 3,
        MaxAge:     28, //days
        Compress:   true, // disabled by default
    })

	db.ConnectDB()

	r.Use(api.MainMiddleware)

    r.Post("/auth", api.Auth)

	r.Route("/", func(r chi.Router) {
		r.Use(api.AuthMiddleware)
		r.Route("/posts", func(r chi.Router) {
			r.Get("/", api.GetPosts)
			r.Post("/", api.CreatePost)
			r.Route("/{postId}", func(r chi.Router) {
				r.Delete("/", api.DeletePost)
				r.Post("/like", api.LikePost)
				r.Delete("/like", api.UnlikePost)
				r.Get("/comments", api.GetComments)
				r.Post("/comments", api.CreateComment)
			})
		})
		r.Route("/comments/{commentId}", func(r chi.Router) {
            r.Get("/", api.GetComment)
			r.Delete("/", api.DeleteComment)
			r.Post("/like", api.LikeComment)
			r.Delete("/like", api.UnlikeComment)
		})
	})

    r.NotFound(api.NotFound)

	http.ListenAndServe(":3000", r)
}
