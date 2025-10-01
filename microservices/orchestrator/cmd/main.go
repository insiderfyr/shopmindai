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

	"github.com/shopmindai/orchestrator/internal/config"
	httpserver "github.com/shopmindai/orchestrator/internal/http"
	"github.com/shopmindai/orchestrator/internal/version"
)

func main() {
	zerolog.TimeFieldFormat = time.RFC3339Nano
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout})

	cfg := config.Load()

	log.Info().
		Str("version", version.Version()).
		Str("port", cfg.Port).
		Str("env", cfg.Env).
		Msg("starting orchestrator")

	srv, err := httpserver.New(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to initialise http server")
	}
	defer srv.Close()

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
