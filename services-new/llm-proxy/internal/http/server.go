package httpserver

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/rs/zerolog/log"

	"github.com/shopmindai/llm-proxy/internal/config"
	"github.com/shopmindai/llm-proxy/internal/llm"
)

type Server struct {
	Router *chi.Mux
	cfg    config.Config
	llm    *llm.Client
}

func New(cfg config.Config) *Server {
	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.AllowedOrigins},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Requested-With"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	s := &Server{
		Router: r,
		cfg:    cfg,
		llm:    llm.New(cfg),
	}
	s.routes()
	return s
}

func (s *Server) routes() {
	s.Router.Get("/v1/healthz", s.handleHealthz)
	s.Router.Post("/v1/chat/stream", s.handleChatStream)
}

func (s *Server) handleHealthz(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"ok"}`))
}

type chatRequest struct {
	Messages []llm.ChatMessage `json:"messages"`
}

func (s *Server) handleChatStream(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	var req chatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.Messages) == 0 {
		http.Error(w, "no messages provided", http.StatusBadRequest)
		return
	}

	log.Info().Int("message_count", len(req.Messages)).Msg("starting LLM stream")

	if s.cfg.LLMAPIKey == "" {
		log.Warn().Msg("LLM API key not configured, using dummy response")
		// Fallback to dummy response
		s.handleDummyStream(w, flusher)
		return
	}

	// Use real LLM API
	adapter := newSSEWriter(w, flusher)
	if err := s.llm.StreamChat(req.Messages, adapter); err != nil {
		log.Error().Err(err).Msg("LLM stream failed")
		http.Error(w, "LLM request failed", http.StatusInternalServerError)
		return
	}
	if err := adapter.Done(); err != nil {
		log.Warn().Err(err).Msg("failed to send completion signal")
	}
}

func (s *Server) handleDummyStream(w http.ResponseWriter, flusher http.Flusher) {
	tokens := []string{"Hello", ",", " I", " am", " your", " LLM", ".", " [DONE]"}
	for _, t := range tokens {
		fmt.Fprintf(w, "data: %s\n\n", t)
		flusher.Flush()
	}
}

type sseWriter struct {
	w       http.ResponseWriter
	flusher http.Flusher
}

func newSSEWriter(w http.ResponseWriter, flusher http.Flusher) *sseWriter {
	return &sseWriter{w: w, flusher: flusher}
}

func (sw *sseWriter) Write(p []byte) (int, error) {
	chunk := string(p)
	if chunk == "" {
		return len(p), nil
	}
	if err := sw.send(chunk); err != nil {
		return 0, err
	}
	return len(p), nil
}

func (sw *sseWriter) Done() error {
	return sw.send("[DONE]")
}

func (sw *sseWriter) send(message string) error {
	lines := strings.Split(message, "\n")
	for _, line := range lines {
		trimmed := line
		if trimmed == "" {
			continue
		}
		if _, err := fmt.Fprintf(sw.w, "data: %s\n\n", trimmed); err != nil {
			return err
		}
	}
	sw.flusher.Flush()
	return nil
}
