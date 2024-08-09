package api

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gofrs/uuid"
	"github.com/golang-jwt/jwt/v5"
)

func MainMiddleware(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "application/json")
		w.Header().Add("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "*")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "*")

		if r.Method == "OPTIONS" {
			w.WriteHeader(200)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), time.Duration(8*time.Second))

		defer cancel()

		h.ServeHTTP(w, r.WithContext(ctx))
	})
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenStr := r.Header.Get("Authorization")

		if tokenStr == "" {
			sendError(w, 401, "No token provided")
			return
		}

		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			_, ok := token.Method.(*jwt.SigningMethodECDSA)

			if !ok {
				return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
			}

			return &jwtKey.PublicKey, nil
		})

		if err != nil {
            sendError(w, 401, err.Error())
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)

		if !ok {
            sendError(w, 401, "Invalid token")
			return
		}

		author, err := uuid.FromString(claims["uuid"].(string))

		if err != nil {
            sendError(w, 401, "Invalid token")
			return
		}

		ctx := context.WithValue(r.Context(), "author", author)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
