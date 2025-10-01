package httpserver

import (
	"bufio"
	"bytes"
	"context"
	"crypto/rand"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/rs/zerolog/log"

	"github.com/shopmindai/orchestrator/internal/auth"
	"github.com/shopmindai/orchestrator/internal/config"
)

type Server struct {
	Router        *chi.Mux
	cfg           config.Config
	authValidator *auth.Validator
}

type claimsContextKey struct{}

func New(cfg config.Config) (*Server, error) {
	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.AllowedOrigins},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Requested-With"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	validator, err := auth.NewValidator(context.Background(), cfg.AuthService)
	if err != nil {
		return nil, err
	}

	s := &Server{Router: r, cfg: cfg, authValidator: validator}
	s.routes()
	return s, nil
}

func (s *Server) Close() {
	if s.authValidator != nil {
		s.authValidator.Close()
	}
}

func (s *Server) routes() {
	s.Router.Get("/orchestrator/v1/healthz", s.handleHealthz)

	s.Router.Group(func(r chi.Router) {
		if s.authValidator != nil {
			r.Use(s.requireAuth)
		}
		r.Post("/orchestrator/v1/sessions/{sessionId}/messages/stream", s.handleChatStream)
		r.Post("/api/agents/chat/{endpoint}", s.handleAgentChat)
	})
}

func (s *Server) handleHealthz(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"ok"}`))
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

	sessionID := chi.URLParam(r, "sessionId")
	logEvt := log.Info().Str("sessionId", sessionID).Str("llmProxyURL", s.cfg.LLMProxyURL)
	if claims, ok := r.Context().Value(claimsContextKey{}).(*auth.Claims); ok && claims != nil {
		logEvt = logEvt.Str("subject", claims.Subject).Str("username", claims.Username)
	}
	logEvt.Msg("starting SSE stream")

	if s.cfg.LLMProxyURL == "" {
		log.Warn().Msg("LLM proxy not configured")
		http.Error(w, "LLM proxy not configured", http.StatusServiceUnavailable)
		return
	}

	// Forward body to llm-proxy (expects POST streaming SSE)
	req, err := http.NewRequestWithContext(r.Context(), "POST", s.cfg.LLMProxyURL+"/v1/chat/stream", r.Body)
	if err != nil {
		http.Error(w, "failed to build upstream request", http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", r.Header.Get("Content-Type"))
	req.Header.Set("Accept", "text/event-stream")
	if s.cfg.LLMProxyToken != "" {
		req.Header.Set("Authorization", "Bearer "+s.cfg.LLMProxyToken)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		http.Error(w, "upstream unavailable", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		http.Error(w, fmt.Sprintf("upstream error: %s", resp.Status), http.StatusBadGateway)
		return
	}

	// Pipe SSE 1:1
	buf := make([]byte, 16*1024)
	for {
		n, readErr := resp.Body.Read(buf)
		if n > 0 {
			if _, writeErr := w.Write(buf[:n]); writeErr != nil {
				return
			}
			flusher.Flush()
		}
		if readErr != nil {
			break
		}
	}
}

const (
	noParentMessageID = "00000000-0000-0000-0000-000000000000"
)

type agentChatPayload struct {
	Endpoint          string                 `json:"endpoint"`
	EndpointType      string                 `json:"endpointType"`
	ConversationID    string                 `json:"conversationId"`
	MessageID         string                 `json:"messageId"`
	ParentMessageID   string                 `json:"parentMessageId"`
	Text              string                 `json:"text"`
	PromptPrefix      string                 `json:"promptPrefix"`
	Model             string                 `json:"model"`
	Messages          []agentMessage         `json:"messages"`
	AdditionalContext map[string]interface{} `json:"additionalContext"`
}

type agentMessage struct {
	MessageID       string                `json:"messageId"`
	ConversationID  string                `json:"conversationId"`
	ParentMessageID string                `json:"parentMessageId"`
	Sender          string                `json:"sender"`
	Role            string                `json:"role"`
	Text            string                `json:"text"`
	IsCreatedByUser bool                  `json:"isCreatedByUser"`
	Content         []agentMessageContent `json:"content"`
}

type agentMessageContent struct {
	Type string             `json:"type"`
	Text *agentContentValue `json:"text"`
	Data map[string]any     `json:"data"`
	Raw  map[string]any     `json:"-"`
}

type agentContentValue struct {
	Value string `json:"value"`
}

type upstreamChatRequest struct {
	Messages []upstreamChatMessage `json:"messages"`
}

type upstreamChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

func (s *Server) handleAgentChat(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	if s.cfg.LLMProxyURL == "" {
		http.Error(w, "LLM proxy not configured", http.StatusServiceUnavailable)
		return
	}

	var payload agentChatPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, fmt.Sprintf("invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	if payload.Endpoint == "" {
		payload.Endpoint = chi.URLParam(r, "endpoint")
	}

	conversationID := normalizeConversationID(payload.ConversationID)
	requestMessageID := ensureID(payload.MessageID)
	parentMessageID := payload.ParentMessageID
	if parentMessageID == "" {
		parentMessageID = noParentMessageID
	}

	userText := strings.TrimSpace(payload.Text)
	if userText == "" {
		userText = extractLatestUserText(payload.Messages)
	}
	if userText == "" {
		http.Error(w, "missing message text", http.StatusBadRequest)
		return
	}

	upstreamMessages := buildUpstreamMessages(payload.Messages, userText)
	if len(upstreamMessages) == 0 {
		http.Error(w, "no messages available for LLM request", http.StatusBadRequest)
		return
	}

	body, err := json.Marshal(upstreamChatRequest{Messages: upstreamMessages})
	if err != nil {
		http.Error(w, "failed to encode upstream request", http.StatusInternalServerError)
		return
	}

	req, err := http.NewRequestWithContext(r.Context(), http.MethodPost, strings.TrimRight(s.cfg.LLMProxyURL, "/")+"/v1/chat/stream", bytes.NewReader(body))
	if err != nil {
		http.Error(w, "failed to build upstream request", http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	if s.cfg.LLMProxyToken != "" {
		req.Header.Set("Authorization", "Bearer "+s.cfg.LLMProxyToken)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		sendErrorEvent(w, flusher, conversationID, requestMessageID, parentMessageID, userText, fmt.Errorf("upstream unavailable: %w", err))
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		sendErrorEvent(w, flusher, conversationID, requestMessageID, parentMessageID, userText, fmt.Errorf("llm proxy error: %s %s", resp.Status, strings.TrimSpace(string(bodyBytes))))
		return
	}

	responseMessageID := generateID()
	createdEvent := map[string]any{
		"created": true,
		"message": map[string]any{
			"messageId":       responseMessageID,
			"parentMessageId": requestMessageID,
			"conversationId":  conversationID,
		},
	}
	if err := writeSSEEvent(w, flusher, createdEvent); err != nil {
		log.Warn().Err(err).Msg("failed to dispatch created event")
		return
	}

	assistantText, err := s.pipeUpstreamStream(resp.Body, w, flusher, conversationID, requestMessageID, responseMessageID)
	if err != nil {
		if errors.Is(err, context.Canceled) {
			return
		}
		sendErrorEvent(w, flusher, conversationID, requestMessageID, parentMessageID, userText, err)
		return
	}

	finalEvent := buildFinalEvent(payload, conversationID, requestMessageID, parentMessageID, responseMessageID, userText, assistantText)
	if err := writeSSEEvent(w, flusher, finalEvent); err != nil {
		log.Warn().Err(err).Msg("failed to dispatch final event")
	}
}

func (s *Server) pipeUpstreamStream(body io.Reader, w http.ResponseWriter, flusher http.Flusher, conversationID, requestMessageID, responseMessageID string) (string, error) {
	reader := bufio.NewReader(body)
	var builder strings.Builder
	deadline := time.Now()

	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			return builder.String(), fmt.Errorf("llm stream error: %w", err)
		}

		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		chunk := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if chunk == "" {
			continue
		}
		if chunk == "[DONE]" {
			break
		}

		builder.WriteString(chunk)
		messageEvent := map[string]any{
			"messageId":       responseMessageID,
			"conversationId":  conversationID,
			"parentMessageId": requestMessageID,
			"text":            chunk,
			"message": map[string]any{
				"messageId":       responseMessageID,
				"conversationId":  conversationID,
				"parentMessageId": requestMessageID,
				"sender":          "Assistant",
				"text":            builder.String(),
			},
		}
		if err := writeSSEEvent(w, flusher, messageEvent); err != nil {
			return builder.String(), fmt.Errorf("failed to forward chunk: %w", err)
		}
		deadline = time.Now()
	}

	if builder.Len() == 0 && time.Since(deadline) > 0 {
		return "", errors.New("upstream produced no content")
	}

	return builder.String(), nil
}

func normalizeConversationID(input string) string {
	trimmed := strings.TrimSpace(input)
	if trimmed == "" || trimmed == "new" || trimmed == "null" {
		return generateID()
	}
	return trimmed
}

func ensureID(id string) string {
	trimmed := strings.TrimSpace(id)
	if trimmed == "" {
		return generateID()
	}
	return trimmed
}

func extractLatestUserText(messages []agentMessage) string {
	for i := len(messages) - 1; i >= 0; i-- {
		if resolveRole(messages[i]) == "user" {
			if text := strings.TrimSpace(messages[i].Text); text != "" {
				return text
			}
			joined := strings.TrimSpace(joinContent(messages[i].Content))
			if joined != "" {
				return joined
			}
		}
	}
	return ""
}

func buildUpstreamMessages(history []agentMessage, latestUser string) []upstreamChatMessage {
	var messages []upstreamChatMessage
	for _, msg := range history {
		role := resolveRole(msg)
		if role == "" {
			continue
		}
		text := strings.TrimSpace(msg.Text)
		if text == "" {
			text = strings.TrimSpace(joinContent(msg.Content))
		}
		if text == "" {
			continue
		}
		messages = append(messages, upstreamChatMessage{Role: role, Content: text})
	}
	messages = append(messages, upstreamChatMessage{Role: "user", Content: latestUser})
	return messages
}

func resolveRole(msg agentMessage) string {
	if msg.Role != "" {
		switch strings.ToLower(msg.Role) {
		case "assistant", "tool", "system", "user":
			return strings.ToLower(msg.Role)
		}
	}
	if msg.Sender != "" {
		switch strings.ToLower(msg.Sender) {
		case "assistant", "bot", "system":
			return "assistant"
		case "user":
			return "user"
		}
	}
	if msg.IsCreatedByUser {
		return "user"
	}
	return "assistant"
}

func joinContent(parts []agentMessageContent) string {
	var builder strings.Builder
	for _, part := range parts {
		if part.Type == "text" && part.Text != nil {
			builder.WriteString(part.Text.Value)
		}
	}
	return builder.String()
}

func writeSSEEvent(w http.ResponseWriter, flusher http.Flusher, payload any) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	if _, err = w.Write([]byte("data: ")); err != nil {
		return err
	}
	if _, err = w.Write(data); err != nil {
		return err
	}
	if _, err = w.Write([]byte("\n\n")); err != nil {
		return err
	}
	flusher.Flush()
	return nil
}

func sendErrorEvent(w http.ResponseWriter, flusher http.Flusher, conversationID, requestMessageID, parentMessageID, userText string, err error) {
	responseMessageID := generateID()
	requestMessage := map[string]any{
		"messageId":       requestMessageID,
		"conversationId":  conversationID,
		"parentMessageId": parentMessageID,
		"sender":          "User",
		"text":            userText,
		"isCreatedByUser": true,
	}
	responseMessage := map[string]any{
		"messageId":       responseMessageID,
		"conversationId":  conversationID,
		"parentMessageId": requestMessageID,
		"sender":          "Assistant",
		"error":           true,
		"text":            err.Error(),
	}
	finalEvent := map[string]any{
		"final":           true,
		"error":           err.Error(),
		"conversationId":  conversationID,
		"messageId":       responseMessageID,
		"parentMessageId": requestMessageID,
		"conversation": map[string]any{
			"conversationId": conversationID,
		},
		"requestMessage":  requestMessage,
		"responseMessage": responseMessage,
	}
	if writeErr := writeSSEEvent(w, flusher, finalEvent); writeErr != nil {
		log.Warn().Err(writeErr).Msg("failed to send error event")
	}
}

func buildFinalEvent(payload agentChatPayload, conversationID, requestMessageID, parentMessageID, responseMessageID, userText, assistantText string) map[string]any {
	requestMessage := map[string]any{
		"messageId":       requestMessageID,
		"conversationId":  conversationID,
		"parentMessageId": parentMessageID,
		"sender":          "User",
		"text":            userText,
		"isCreatedByUser": true,
	}
	responseMessage := map[string]any{
		"messageId":       responseMessageID,
		"conversationId":  conversationID,
		"parentMessageId": requestMessageID,
		"sender":          "Assistant",
		"text":            assistantText,
		"isCreatedByUser": false,
	}
	conversation := map[string]any{
		"conversationId": conversationID,
		"endpoint":       payload.Endpoint,
	}
	if payload.Model != "" {
		conversation["model"] = payload.Model
	}
	if payload.PromptPrefix != "" {
		conversation["promptPrefix"] = payload.PromptPrefix
	}

	return map[string]any{
		"final":           true,
		"conversation":    conversation,
		"requestMessage":  requestMessage,
		"responseMessage": responseMessage,
		"messages":        []any{requestMessage, responseMessage},
	}
}

func (s *Server) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		parts := strings.Fields(authHeader)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		claims, err := s.authValidator.Verify(parts[1])
		if err != nil {
			log.Warn().Err(err).Msg("token verification failed")
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), claimsContextKey{}, claims)))
	})
}

func generateID() string {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return fmt.Sprintf("id-%d", time.Now().UnixNano())
	}
	buf[6] = (buf[6] & 0x0f) | 0x40
	buf[8] = (buf[8] & 0x3f) | 0x80
	return fmt.Sprintf(
		"%08x-%04x-%04x-%04x-%04x%08x",
		binary.BigEndian.Uint32(buf[0:4]),
		binary.BigEndian.Uint16(buf[4:6]),
		binary.BigEndian.Uint16(buf[6:8]),
		binary.BigEndian.Uint16(buf[8:10]),
		binary.BigEndian.Uint16(buf[10:12]),
		binary.BigEndian.Uint32(buf[12:16]),
	)
}
