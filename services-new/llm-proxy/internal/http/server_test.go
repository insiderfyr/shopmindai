package httpserver

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/shopmindai/llm-proxy/internal/config"
	"github.com/shopmindai/llm-proxy/internal/llm"
	"github.com/stretchr/testify/assert"
)

func TestHandleChatStream_ProxyLogic(t *testing.T) {
	// 1. Create a mock OpenAI server
	mockAPIToken := "test-api-key"
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check if the proxy correctly added the auth header
		authHeader := r.Header.Get("Authorization")
		expectedHeader := "Bearer " + mockAPIToken
		if authHeader != expectedHeader {
			t.Errorf("handler returned wrong authorization header: got %v want %v", authHeader, expectedHeader)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		// Check the request body path
		if r.URL.Path != "/v1/chat/completions" {
			t.Errorf("handler received request for wrong path: got %v want %v", r.URL.Path, "/v1/chat/completions")
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// Send a dummy streaming response
		w.Header().Set("Content-Type", "text/event-stream")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("data: {\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}"))
		_, _ = w.Write([]byte("\n\n"))
		_, _ = w.Write([]byte("data: {\"choices\":[{\"delta\":{\"content\":\" World\"}}]}"))
		_, _ = w.Write([]byte("\n\n"))
	}))
	defer mockServer.Close()

	// 2. Configure the llm-proxy to use the mock server
	testConfig := config.Config{
		LLMAPIKey:    mockAPIToken,
		LLMBaseURL:   mockServer.URL + "/v1", // The client adds /chat/completions
		LLMModel:     "gpt-3.5-turbo",
	}

	// 3. Create an instance of our proxy server
	proxyServer := New(testConfig)

	// Define the request body for the test
	type testChatRequest struct {
		Messages []llm.ChatMessage `json:"messages"`
	}

	// 4. Simulate a client request to our proxy server
	requestBody := testChatRequest{
		Messages: []llm.ChatMessage{
			{Role: "user", Content: "Hello"},
		},
	}
	bodyBytes, _ := json.Marshal(requestBody)
	req, err := http.NewRequest("POST", "/v1/chat/stream", bytes.NewReader(bodyBytes))
	assert.NoError(t, err)

	rr := httptest.NewRecorder()

	// 5. Serve the request
	proxyServer.Router.ServeHTTP(rr, req)

	// 6. Assert the results
	assert.Equal(t, http.StatusOK, rr.Code, "handler returned wrong status code")

	// Check if the response from the proxy contains the data from the mock server
	expectedBodyPart1 := "Hello"
	expectedBodyPart2 := " World"
	assert.True(t, strings.Contains(rr.Body.String(), expectedBodyPart1), "handler response body does not contain expected part 1")
	assert.True(t, strings.Contains(rr.Body.String(), expectedBodyPart2), "handler response body does not contain expected part 2")
}

func TestHandleHealthz(t *testing.T) {
	// Configure a dummy server
	proxyServer := New(config.Config{})

	// Create request
	req, err := http.NewRequest("GET", "/v1/healthz", nil)
	assert.NoError(t, err)

	rr := httptest.NewRecorder()

	// Serve the request
	proxyServer.Router.ServeHTTP(rr, req)

	// Assert the results
	assert.Equal(t, http.StatusOK, rr.Code, "handler returned wrong status code")
	assert.Equal(t, `{"status":"ok"}`, rr.Body.String(), "handler returned unexpected body")
}
