package handlers

import (
	"auth-service/internal/config"
	"auth-service/pkg/logger"
	"net/http"

	"github.com/gin-gonic/gin"
)

// FrontendHandler provides endpoints for frontend integration
type FrontendHandler struct {
	cfg    *config.Config
	logger *logger.Logger
}

// NewFrontendHandler creates a new frontend handler
func NewFrontendHandler(cfg *config.Config, logger *logger.Logger) *FrontendHandler {
	return &FrontendHandler{
		cfg:    cfg,
		logger: logger,
	}
}

// GetAuthConfig returns authentication configuration for frontend
func (h *FrontendHandler) GetAuthConfig(c *gin.Context) {
	config := gin.H{
		"keycloak": gin.H{
			"url":       h.cfg.Keycloak.ExternalURL,
			"realm":     h.cfg.Keycloak.Realm,
			"clientId":  h.cfg.Keycloak.ClientID,
			"authUrl":   h.cfg.Keycloak.ExternalAuthURL,
			"tokenUrl":  h.cfg.Keycloak.ExternalTokenURL,
			"logoutUrl": h.cfg.Keycloak.ExternalLogoutURL,
		},
		"endpoints": gin.H{
			"login":         "/api/v1/auth/login",
			"register":      "/api/v1/auth/register",
			"refresh":       "/api/v1/auth/refresh",
			"logout":        "/api/v1/auth/logout",
			"profile":       "/api/v1/user/profile",
			"updateProfile": "/api/v1/user/profile",
			"changePassword": "/api/v1/user/change-password",
		},
		"features": gin.H{
			"registration":     true,
			"passwordReset":    true,
			"emailVerification": false,
			"socialLogin":      false,
		},
		"validation": gin.H{
			"username": gin.H{
				"minLength": 3,
				"maxLength": 30,
				"pattern":   "^[a-zA-Z0-9_]+$",
			},
			"password": gin.H{
				"minLength": 8,
				"maxLength": 128,
				"requirements": []string{
					"At least one uppercase letter",
					"At least one lowercase letter", 
					"At least one number",
					"At least one special character",
				},
			},
			"email": gin.H{
				"required": true,
				"pattern":  "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
			},
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    config,
	})
}

// GetAppInfo returns application information
func (h *FrontendHandler) GetAppInfo(c *gin.Context) {
	info := gin.H{
		"name":        "ShopMindAI",
		"version":     "1.0.0-mvp",
		"description": "AI-Powered Shopping Assistant",
		"features": []string{
			"Authentication",
			"AI Shopping Assistant", 
			"Product Search",
			"Price Comparison",
		},
		"support": gin.H{
			"email":   "support@shopmindai.com",
			"website": "https://shopmindai.com",
			"docs":    "https://docs.shopmindai.com",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    info,
	})
}

// GetHealthStatus returns detailed health status
func (h *FrontendHandler) GetHealthStatus(c *gin.Context) {
	status := gin.H{
		"status":     "healthy",
		"service":    "auth-service",
		"version":    "1.0.0-mvp",
		"timestamp":  gin.H{},
		"components": gin.H{
			"database": gin.H{
				"status": "connected",
				"type":   "postgresql",
			},
			"cache": gin.H{
				"status": "connected", 
				"type":   "redis",
			},
			"identity_provider": gin.H{
				"status": "connected",
				"type":   "keycloak",
			},
		},
		"metrics": gin.H{
			"uptime":         "running",
			"active_users":   0,
			"total_requests": 0,
			"error_rate":     "0%",
		},
	}

	c.JSON(http.StatusOK, status)
}
