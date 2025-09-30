package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/shopmindai/chat-service/internal/config"
	httpserver "github.com/shopmindai/chat-service/internal/http"
)

func main() {
	zerolog.TimeFieldFormat = time.RFC3339Nano
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout})

	cfg := config.Load()
	log.Info().Str("port", cfg.Port).Str("env", cfg.Env).Msg("starting chat-service")

	srv := httpserver.New(cfg.AllowedOrigins)

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           srv.Router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("http server failed")
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Error().Err(err).Msg("graceful shutdown failed")
	} else {
		log.Info().Msg("server stopped")
	}
}


