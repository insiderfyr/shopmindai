package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/rs/zerolog/log"

	"github.com/shopmindai/orchestrator/internal/config"
)

type Claims struct {
	Subject  string
	Username string
	Email    string
}

type Validator struct {
	client     *http.Client
	profileURL string
}

func NewValidator(_ context.Context, cfg config.AuthServiceConfig) (*Validator, error) {
	if !cfg.Enabled() {
		return nil, nil
	}

	return &Validator{
		client:     &http.Client{Timeout: 5 * time.Second},
		profileURL: cfg.ProfileURL,
	}, nil
}

func (v *Validator) Close() {}

func (v *Validator) Verify(token string) (*Claims, error) {
	if v == nil {
		return nil, errors.New("validator not configured")
	}

	token = strings.TrimSpace(token)
	if token == "" {
		return nil, errors.New("empty token")
	}

	req, err := http.NewRequest(http.MethodGet, v.profileURL, nil)
	if err != nil {
		return nil, fmt.Errorf("build profile request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := v.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call auth service: %w", err)
	}
	defer func() {
		if cerr := resp.Body.Close(); cerr != nil {
			log.Warn().Err(cerr).Msg("failed to close auth response body")
		}
	}()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("auth service rejected token: %s", resp.Status)
	}

	var payload struct {
		Data struct {
			ID       string `json:"id"`
			Username string `json:"username"`
			Email    string `json:"email"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("decode auth response: %w", err)
	}

	if payload.Data.ID == "" {
		return nil, errors.New("auth service returned empty user id")
	}

	return &Claims{
		Subject:  payload.Data.ID,
		Username: payload.Data.Username,
		Email:    payload.Data.Email,
	}, nil
}
