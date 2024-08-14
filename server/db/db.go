package db

import (
	"context"
	"os"
	"snakesss/sqlc"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Query *sqlc.Queries

func ConnectDB() {
    ctx := context.Background()

    dbpool, err := pgxpool.New(ctx, os.Getenv("POSTGRES_URL"))

    if err != nil {
        panic(err)
    }   

    Query = sqlc.New(dbpool)
}
