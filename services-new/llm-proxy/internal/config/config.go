package config

import "os"

type Config struct {
	Port           string
	Env            string
	AllowedOrigins string
	
	// LLM API Configuration
	LLMProvider    string // "openai", "anthropic", "ollama", etc.
	LLMAPIKey      string // API key for the LLM provider
	LLMBaseURL     string // Base URL for the LLM API
	LLMModel       string // Model name (e.g., "gpt-4", "claude-3")
	LLMMaxTokens   string // Maximum tokens to generate
	LLMTemperature string // Temperature for generation
}

func Load() Config {
	return Config{
		Port:           getenv("APP_PORT", "9000"),
		Env:            getenv("APP_ENV", "dev"),
		AllowedOrigins: getenv("ALLOWED_ORIGINS", "*"),
		
		// LLM Configuration
		LLMProvider:    getenv("LLM_PROVIDER", "openai"),
		LLMAPIKey:      getenv("LLM_API_KEY", ""),
		LLMBaseURL:     getenv("LLM_BASE_URL", "https://api.openai.com/v1"),
		LLMModel:       getenv("LLM_MODEL", "gpt-3.5-turbo"),
		LLMMaxTokens:   getenv("LLM_MAX_TOKENS", "1000"),
		LLMTemperature: getenv("LLM_TEMPERATURE", "0.7"),
	}
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
