package api

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gofrs/uuid"
	"github.com/golang-jwt/jwt/v5"
)

func MainMiddleware(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestUUID, err := uuid.NewV4()

		if err != nil {
            errReq := RequestError{
                RequestId: "ungenerated",
                error:     errors.New("Internal server error"),
                cause:     err,
                Code:      500,
            }
			requestLog("ungenerated", fmt.Sprintf("Request id generation failed for request, path: %s, body: %s", r.URL, r.Body))
            fail(w, errReq)
		}

        requestLog(requestUUID.String(), fmt.Sprintf("Incoming request, method: %s, path: %s, headers: %s, body: %s", r.Method, r.URL, r.Header, r.Body))

		w.Header().Add("X-Request-ID", requestUUID.String())
		w.Header().Add("Content-Type", "application/json")
		w.Header().Add("Access-Control-Allow-Origin", os.Getenv("HOST"))
		w.Header().Set("Access-Control-Allow-Methods", "*")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(200)
			return
		}

		ctx, cancel := context.WithTimeout(context.WithValue(r.Context(), "requestId", requestUUID.String()), time.Duration(8*time.Second))

		defer cancel()

		h.ServeHTTP(w, r.WithContext(ctx))
	})
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestId := r.Context().Value("requestId").(string)

		tokenStr := r.Header.Get("Authorization")

		if tokenStr == "" {
            errReq := RequestError{
                RequestId: requestId,
                error:     errors.New("No token provided"),
                cause:     errors.New("Unauthorized"),
                Code:      401,
            }
			fail(w, errReq)
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
            errReq := RequestError{
                RequestId: requestId,
                error:     errors.New("Invalid token"),
                cause:     err,
                Code:      401,
            }
			fail(w, errReq)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)

		if !ok {
            errReq := RequestError{
                RequestId: "ungenerated",
                error:     errors.New("Invalid token"),
                cause:     errors.New("Unauthorized"),
                Code:      401,
            }
			fail(w, errReq)
			return
		}

		author, err := uuid.FromString(claims["uuid"].(string))

		if err != nil {
            errReq := RequestError{
                RequestId: requestId,
                error:     errors.New("Invalid token"),
                cause:     errors.New("Unauthorized"),
                Code:      401,
            }
			fail(w, errReq)
			return
		}

		ctx := context.WithValue(r.Context(), "author", author)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
