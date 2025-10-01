package main

import (
	"auth-service/internal/config"
	"auth-service/internal/handlers"
	"auth-service/internal/middleware"
	"auth-service/pkg/logger"
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "--health-check" {
		os.Exit(runHealthCheck())
	}

	// Initialize logger
	logger := logger.NewLogger()

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		logger.Fatalf("Failed to load configuration: %v", err)
	}

	// Set Gin mode based on config
	if cfg.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize Gin server
	r := gin.New()

	// Recovery middleware
	r.Use(gin.Recovery())

	// Add global middleware
	r.Use(middleware.LoggerMiddleware(logger))
	r.Use(middleware.CORSMiddleware(cfg))
	r.Use(middleware.InputValidationMiddleware())

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(cfg, logger)
	userHandler := handlers.NewUserHandler(cfg, logger)
	frontendHandler := handlers.NewFrontendHandler(cfg, logger)

	// Register routes
	api := r.Group("/api/v1")
	{
		// Public auth routes with rate limiting
		auth := api.Group("/auth")
		auth.Use(middleware.AuthRateLimitMiddleware()) // Rate limit for auth endpoints
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
			auth.POST("/refresh", authHandler.Refresh)
			auth.POST("/logout", authHandler.Logout)
		}

		// Protected routes (authentication required)
		protected := api.Group("/user")
		protected.Use(middleware.AuthMiddleware(cfg, logger))
		{
			protected.GET("/profile", userHandler.GetProfile)
			protected.PUT("/profile", userHandler.UpdateProfile)
			protected.POST("/change-password", userHandler.ChangePassword)
		}
	}

	// Mock endpoints for frontend compatibility
	r.GET("/api/banner", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Banner endpoint - placeholder for ShopMindAI",
			"data": gin.H{
				"banner_text":  "Welcome to ShopMindAI",
				"banner_image": "/assets/banner-placeholder.jpg",
			},
		})
	})

	r.GET("/api/config", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Config endpoint - placeholder for ShopMindAI",
			"data": gin.H{
				"app_name":            "ShopMindAI",
				"version":             "1.0.0-mvp",
				"features":            []string{"auth", "ai", "shopping"},
				"emailEnabled":        false,
				"registrationEnabled": true,
				"socialLogins": gin.H{
					"google":   false,
					"facebook": false,
					"discord":  false,
					"github":   false,
					"openid":   true,
				},
				"turnstile": gin.H{
					"siteKey": "",
				},
			},
		})
	})

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "healthy",
			"service":   "auth-service",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"version":   "1.0.0-mvp",
		})
	})

	// Metrics endpoint
	r.GET("/metrics", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Metrics endpoint - placeholder for ShopMindAI",
			"data": gin.H{
				"uptime":   "running",
				"requests": 0,
				"errors":   0,
			},
		})
	})

	// Frontend endpoints
	r.GET("/api/auth/config", frontendHandler.GetAuthConfig)
	r.GET("/api/app/info", frontendHandler.GetAppInfo)
	r.GET("/api/health/detailed", frontendHandler.GetHealthStatus)

	// AI Endpoints endpoint (required by librechat-data-provider)
	r.GET("/api/endpoints", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "AI Endpoints - placeholder for ShopMindAI",
			"data": gin.H{
				"xAI":             nil,
				"openAI":          nil,
				"azureOpenAI":     nil,
				"azureAssistants": nil,
				"assistants":      nil,
				"agents":          nil,
				"chatGPTBrowser":  nil,
				"gptPlugins":      nil,
				"google":          nil,
				"anthropic":       nil,
				"custom":          nil,
			},
		})
	})

	// Startup config endpoint (required by librechat-data-provider)
	r.GET("/api/startup", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Startup config - placeholder for ShopMindAI",
			"data": gin.H{
				"app_name":            "ShopMindAI",
				"version":             "1.0.0-mvp",
				"emailEnabled":        false,
				"registrationEnabled": true,
				"socialLogins": gin.H{
					"google":   false,
					"facebook": false,
					"discord":  false,
					"github":   false,
					"openid":   true,
				},
				"turnstile": gin.H{
					"siteKey": "",
				},
			},
		})
	})

	// Create HTTP server with proper timeouts
	srv := &http.Server{
		Addr:           cfg.Server.Address,
		Handler:        r,
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1MB
	}

	// Start server in a goroutine
	go func() {
		logger.Infof("Starting auth service on %s", cfg.Server.Address)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("Shutting down auth service...")

	// Give ongoing requests 5 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatalf("Auth service forced shutdown: %v", err)
	}

	logger.Info("Auth service stopped gracefully")
}

func runHealthCheck() int {
	client := &http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get("http://localhost:8080/health")
	if err != nil {
		return 1
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return 1
	}
	return 0
}
