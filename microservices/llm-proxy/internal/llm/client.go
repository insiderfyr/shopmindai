package llm

import (
	"context"
	"fmt"
	"io"

	openai "github.com/sashabaranov/go-openai"
	"github.com/shopmindai/llm-proxy/internal/config"
)

type Client struct {
	cfg    config.Config
	client *openai.Client
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

func New(cfg config.Config) *Client {
	config := openai.DefaultConfig(cfg.LLMAPIKey)
	if cfg.LLMBaseURL != "" {
		config.BaseURL = cfg.LLMBaseURL
	}
	client := openai.NewClientWithConfig(config)
	return &Client{
		cfg:    cfg,
		client: client,
	}
}

func (c *Client) StreamChat(messages []ChatMessage, writer io.Writer) error {
	// Mapare mesaje la tipul oficial
	openaiMessages := make([]openai.ChatCompletionMessage, len(messages))
	for i, msg := range messages {
		openaiMessages[i] = openai.ChatCompletionMessage{
			Role:    msg.Role,
			Content: msg.Content,
		}
	}

	req := openai.ChatCompletionRequest{
		Model:    c.cfg.LLMModel,
		Messages: openaiMessages,
		Stream:   true,
	}

	stream, err := c.client.CreateChatCompletionStream(context.Background(), req)
	if err != nil {
		return fmt.Errorf("failed to start chat completion stream: %w", err)
	}
	defer stream.Close()

	for {
		response, err := stream.Recv()
		if err == io.EOF {
			break
		}
		if err != nil {
			return fmt.Errorf("error reading from stream: %w", err)
		}
		if len(response.Choices) > 0 {
			if content := response.Choices[0].Delta.Content; content != "" {
				if _, err := fmt.Fprint(writer, content); err != nil {
					return err
				}
			}
		}
	}
	return nil
}
