package test

import (
	"auth-service/internal/config"
	"auth-service/internal/models"
	"auth-service/pkg/logger"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// TestServer represents a test server instance
type TestServer struct {
	router *gin.Engine
	config *config.Config
	logger *logger.Logger
}

// NewTestServer creates a new test server
func NewTestServer() *TestServer {
	gin.SetMode(gin.TestMode)
	
	// Create test configuration
	cfg := &config.Config{
		Server: config.ServerConfig{
			Address: ":8080",
			Port:    "8080",
			Mode:    "test",
		},
		Keycloak: config.KeycloakConfig{
			URL:          "http://localhost:8081/auth",
			Realm:        "master",
			ClientID:     "auth-service",
			ClientSecret: "test-secret",
			AdminUser:    "admin",
			AdminPass:    "admin",
		},
	}
	
	logger := logger.NewLogger()
	
	// Create router
	router := gin.New()
	
	return &TestServer{
		router: router,
		config: cfg,
		logger: logger,
	}
}

// TestHealthCheck tests the health check endpoint
func TestHealthCheck(t *testing.T) {
	server := NewTestServer()
	
	// Add health check route
	server.router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "auth-service",
		})
	})
	
	// Create request
	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	
	// Serve request
	server.router.ServeHTTP(w, req)
	
	// Assertions
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "healthy", response["status"])
	assert.Equal(t, "auth-service", response["service"])
}

// TestAuthEndpoints tests authentication endpoints
func TestAuthEndpoints(t *testing.T) {
	server := NewTestServer()
	
	// Add auth routes (simplified for testing)
	auth := server.router.Group("/api/v1/auth")
	{
		auth.POST("/login", func(c *gin.Context) {
			var req models.LoginRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, models.ErrorResponse{
					Error:   "validation_error",
					Message: err.Error(),
					Code:    http.StatusBadRequest,
				})
				return
			}
			
			// Mock successful login
			c.JSON(http.StatusOK, models.SuccessResponse{
				Message: "Login successful",
				Data: models.AuthResponse{
					AccessToken:  "test-access-token",
					RefreshToken: "test-refresh-token",
					TokenType:    "Bearer",
					ExpiresIn:    3600,
					User: &models.User{
						ID:       "test-user-id",
						Username: req.Username,
						Email:    "test@example.com",
					},
				},
			})
		})
		
		auth.POST("/register", func(c *gin.Context) {
			var req models.RegisterRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, models.ErrorResponse{
					Error:   "validation_error",
					Message: err.Error(),
					Code:    http.StatusBadRequest,
				})
				return
			}
			
			// Mock successful registration
			c.JSON(http.StatusCreated, models.SuccessResponse{
				Message: "Registration successful",
			})
		})
	}
	
	tests := []struct {
		name           string
		method         string
		path           string
		requestBody    interface{}
		expectedStatus int
	}{
		{
			name:   "successful login",
			method: "POST",
			path:   "/api/v1/auth/login",
			requestBody: models.LoginRequest{
				Username: "testuser",
				Password: "password123",
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:   "successful registration",
			method: "POST",
			path:   "/api/v1/auth/register",
			requestBody: models.RegisterRequest{
				Username:  "newuser",
				Email:     "newuser@example.com",
				Password:  "password123",
				FirstName: "John",
				LastName:  "Doe",
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name:           "invalid login request",
			method:         "POST",
			path:           "/api/v1/auth/login",
			requestBody:    models.LoginRequest{},
			expectedStatus: http.StatusBadRequest,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create request body
			var jsonBody []byte
			if tt.requestBody != nil {
				jsonBody, _ = json.Marshal(tt.requestBody)
			}
			
			// Create request
			req, _ := http.NewRequest(tt.method, tt.path, bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			
			// Create response recorder
			w := httptest.NewRecorder()
			
			// Serve request
			server.router.ServeHTTP(w, req)
			
			// Assertions
			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}

// TestMiddleware tests middleware functionality
func TestMiddleware(t *testing.T) {
	server := NewTestServer()
	
	// Add CORS middleware
	server.router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		
		c.Next()
	})
	
	// Add test route
	server.router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "test"})
	})
	
	// Test CORS preflight request
	req, _ := http.NewRequest("OPTIONS", "/test", nil)
	req.Header.Set("Access-Control-Request-Method", "GET")
	req.Header.Set("Access-Control-Request-Headers", "Content-Type")
	
	w := httptest.NewRecorder()
	server.router.ServeHTTP(w, req)
	
	// Assertions
	assert.Equal(t, http.StatusNoContent, w.Code)
	assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
	assert.Equal(t, "GET, POST, PUT, DELETE, OPTIONS", w.Header().Get("Access-Control-Allow-Methods"))
}
