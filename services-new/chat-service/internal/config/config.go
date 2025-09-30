package config

import (
	"os"
	"strconv"
)

type Config struct {
	// Server
	Port           string
	Env            string
	AllowedOrigins string
	
	// Database
	DatabaseURL    string
	DatabaseMaxConns int
	
	// Redis
	RedisURL       string
	RedisPassword  string
	
	// Message Queue
	RabbitMQURL    string
	
	// LLM
	LLMProvider    string
	LLMAPIKey      string
	LLMBaseURL     string
	LLMModel       string
	LLMMaxTokens   int
	LLMTemperature float64
	
	// Auth
	JWTSecret      string
	JWTExpiry      string
	
	// Rate Limiting
	RateLimitRPS   int
	RateLimitBurst int
	
	// Monitoring
	MetricsPort    string
}

func Load() Config {
	return Config{
		// Server
		Port:           getenv("APP_PORT", "8080"),
		Env:            getenv("APP_ENV", "dev"),
		AllowedOrigins: getenv("ALLOWED_ORIGINS", "*"),
		
		// Database
		DatabaseURL:    getenv("DATABASE_URL", "postgres://user:pass@localhost/chatdb?sslmode=disable"),
		DatabaseMaxConns: getenvInt("DATABASE_MAX_CONNS", 25),
		
		// Redis
		RedisURL:       getenv("REDIS_URL", "redis://localhost:6379"),
		RedisPassword:  getenv("REDIS_PASSWORD", ""),
		
		// Message Queue
		RabbitMQURL:    getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		
		// LLM
		LLMProvider:    getenv("LLM_PROVIDER", "openai"),
		LLMAPIKey:      getenv("LLM_API_KEY", ""),
		LLMBaseURL:     getenv("LLM_BASE_URL", "https://api.openai.com/v1"),
		LLMModel:       getenv("LLM_MODEL", "gpt-3.5-turbo"),
		LLMMaxTokens:   getenvInt("LLM_MAX_TOKENS", 1000),
		LLMTemperature: getenvFloat("LLM_TEMPERATURE", 0.7),
		
		// Auth
		JWTSecret:      getenv("JWT_SECRET", "your-secret-key"),
		JWTExpiry:      getenv("JWT_EXPIRY", "24h"),
		
		// Rate Limiting
		RateLimitRPS:   getenvInt("RATE_LIMIT_RPS", 10),
		RateLimitBurst: getenvInt("RATE_LIMIT_BURST", 20),
		
		// Monitoring
		MetricsPort:    getenv("METRICS_PORT", "9090"),
	}
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func getenvInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return def
}

func getenvFloat(key string, def float64) float64 {
	if v := os.Getenv(key); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return f
		}
	}
	return def
}
