package main

import (
	"net/http"
	"snakesss/api"
	"snakesss/db"

	"github.com/go-chi/chi/v5"
)

func main() {
	r := chi.NewRouter()

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

	http.ListenAndServe(":3000", r)
}
