package middleware

import (
	"auth-service/internal/config"
	"auth-service/internal/models"
	"auth-service/pkg/logger"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/Nerzal/gocloak/v13"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

// -------------------- Rate Limiter --------------------

type rateLimiter struct {
	requests map[string][]time.Time
	mutex    sync.RWMutex
	limit    int
	window   time.Duration
}

func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	return &rateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
}

func (rl *rateLimiter) allow(ip string) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	now := time.Now()
	windowStart := now.Add(-rl.window)

	// păstrăm doar request-urile din fereastra curentă
	if requests, exists := rl.requests[ip]; exists {
		var validRequests []time.Time
		for _, reqTime := range requests {
			if reqTime.After(windowStart) {
				validRequests = append(validRequests, reqTime)
			}
		}
		rl.requests[ip] = validRequests
	}

	// verificăm dacă depășește limita
	if len(rl.requests[ip]) >= rl.limit {
		return false
	}

	// adăugăm requestul curent
	rl.requests[ip] = append(rl.requests[ip], now)
	return true
}

var authRateLimiter = newRateLimiter(50, time.Minute)     // 50 req/min pentru login/register
var generalRateLimiter = newRateLimiter(100, time.Minute) // 100 req/min pentru endpoints generale

// -------------------- Auth Middleware --------------------

// AuthMiddleware validează JWT-urile de la Keycloak
func AuthMiddleware(cfg *config.Config, logger *logger.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		// rate limiting pe rute protejate
		if !generalRateLimiter.allow(c.ClientIP()) {
			c.JSON(http.StatusTooManyRequests, models.ErrorResponse{
				Error:   "rate_limit_exceeded",
				Message: "Too many requests. Please try again later.",
				Code:    http.StatusTooManyRequests,
			})
			c.Abort()
			return
		}

		// verificăm headerul Authorization
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, models.ErrorResponse{
				Error:   "unauthorized",
				Message: "Authorization header is required",
				Code:    http.StatusUnauthorized,
			})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, models.ErrorResponse{
				Error:   "unauthorized",
				Message: "Invalid authorization header format",
				Code:    http.StatusUnauthorized,
			})
			c.Abort()
			return
		}

		accessToken := parts[1]

		// validăm JWT cu gocloak și extragem claims
		client := gocloak.NewClient(cfg.Keycloak.URL)

		customClaims := jwt.MapClaims{}
		_, err := client.DecodeAccessTokenCustomClaims(c.Request.Context(), accessToken, cfg.Keycloak.Realm, &customClaims)
		if err != nil {
			logger.WithError(err).Error("Failed to decode access token")
			c.JSON(http.StatusUnauthorized, models.ErrorResponse{
				Error:   "unauthorized",
				Message: "Invalid or expired token",
				Code:    http.StatusUnauthorized,
			})
			c.Abort()
			return
		}

		// adăugăm user info în context
		if username, ok := customClaims["preferred_username"].(string); ok {
			c.Set("username", username)
		}
		if email, ok := customClaims["email"].(string); ok {
			c.Set("email", email)
		}
		if sub, ok := customClaims["sub"].(string); ok {
			c.Set("user_id", sub)
		}

		c.Set("access_token", accessToken)
		c.Next()
	}
}

// -------------------- Extra Middlewares --------------------

// pentru login/register rate limiting
func AuthRateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !authRateLimiter.allow(c.ClientIP()) {
			c.JSON(http.StatusTooManyRequests, models.ErrorResponse{
				Error:   "auth_rate_limit_exceeded",
				Message: "Too many authentication attempts. Please try again in a minute.",
				Code:    http.StatusTooManyRequests,
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// LoggerMiddleware loghează requesturile HTTP
func LoggerMiddleware(logger *logger.Logger) gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		logger.WithFields(map[string]interface{}{
			"status":     param.StatusCode,
			"method":     param.Method,
			"path":       param.Path,
			"ip":         param.ClientIP,
			"user_agent": param.Request.UserAgent(),
			"latency":    param.Latency,
		}).Info("HTTP Request")
		return ""
	})
}

// CORSMiddleware
func CORSMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		allowedOrigins := []string{
			"http://localhost:3000",
			"http://localhost:3080",
			"http://localhost:3090",
			"http://localhost:8080",
			"https://yourdomain.com",
		}

		origin := c.Request.Header.Get("Origin")
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				c.Header("Access-Control-Allow-Origin", origin)
				break
			}
		}

		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// InputValidationMiddleware
func InputValidationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if strings.Contains(c.Request.URL.Path, "<script>") ||
			strings.Contains(c.Request.URL.Path, "javascript:") {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				Error:   "invalid_input",
				Message: "Invalid characters in request",
				Code:    http.StatusBadRequest,
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
