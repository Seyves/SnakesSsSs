package db

import (
	"context"
	"snakesss/sqlc"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Query *sqlc.Queries

func ConnectDB() {
    ctx := context.Background()

    dbpool, err := pgxpool.New(ctx, "postgresql://snakesssdb_owner:PzVg6JlM0NRf@ep-broad-surf-a2jwzea9.eu-central-1.aws.neon.tech/snakesssdb?sslmode=require")

    if err != nil {
        panic(err)
    }   

    Query = sqlc.New(dbpool)
}
