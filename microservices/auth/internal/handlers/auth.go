package handlers

import (
	"auth-service/internal/config"
	"auth-service/internal/models"
	"auth-service/internal/services"
	"auth-service/pkg/logger"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication requests
type AuthHandler struct {
	keycloakService services.KeycloakServiceInterface
	logger          logger.LoggerInterface
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(cfg *config.Config, logger logger.LoggerInterface) *AuthHandler {
	return &AuthHandler{
		keycloakService: services.NewKeycloakService(cfg.Keycloak, logger),
		logger:          logger,
	}
}

// Login handles user login - IMPROVED with better validation
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.WithError(err).Error("Invalid login request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid request format",
			Code:    http.StatusBadRequest,
			Details: err.Error(),
		})
		return
	}

	// Basic input sanitization
	req.Username = sanitizeInput(req.Username)

	// Normalize username for authentication (skip if email)
	if !strings.Contains(req.Username, "@") {
		req.Username = models.NormalizeUsername(req.Username)
	}

	// Authenticate with Keycloak
	authResponse, err := h.keycloakService.Login(req.Username, req.Password)
	if err != nil {
		h.logger.WithError(err).WithField("username", req.Username).Error("Login failed")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "authentication_failed",
			Message: "Invalid username or password",
			Code:    http.StatusUnauthorized,
		})
		return
	}

	h.logger.WithField("username", req.Username).Info("User logged in successfully")
	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "Login successful",
		Data:    authResponse,
	})
}

// Register handles user registration - IMPROVED with validation
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.WithError(err).Error("Invalid registration request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid request format",
			Code:    http.StatusBadRequest,
			Details: err.Error(),
		})
		return
	}

	// Derive username from email if not provided
	if strings.TrimSpace(req.Username) == "" && req.Email != "" {
		if at := strings.Index(req.Email, "@"); at > 0 {
			req.Username = req.Email[:at]
		} else {
			// Fallback for invalid emails, though unlikely due to validation
			req.Username = "user"
		}
	}

	// Normalize username before validation
	req.Username = models.NormalizeUsername(req.Username)

	// Additional validation
	if validationErrors := req.Validate(); len(validationErrors) > 0 {
		h.logger.WithField("errors", validationErrors).Error("Registration validation failed")
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid input data",
			Code:    http.StatusBadRequest,
			Details: validationErrors,
		})
		return
	}

	// Sanitize inputs
	req.Username = sanitizeInput(req.Username)
	req.Email = sanitizeInput(req.Email)
	req.FirstName = sanitizeInput(req.FirstName)
	req.LastName = sanitizeInput(req.LastName)

	// Register user in Keycloak
	err := h.keycloakService.Register(&req)
	if err != nil {
		h.logger.WithError(err).WithField("username", req.Username).Error("Registration failed")

		// Check if user already exists
		if isUserExistsError(err) {
			c.JSON(http.StatusConflict, models.ErrorResponse{
				Error:   "user_exists",
				Message: "Username or email already exists",
				Code:    http.StatusConflict,
			})
			return
		}

		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "registration_failed",
			Message: "Failed to create user account",
			Code:    http.StatusBadRequest,
			Details: err.Error(),
		})
		return
	}

	h.logger.WithField("username", req.Username).Info("User registered successfully")
	c.JSON(http.StatusCreated, models.SuccessResponse{
		Message: "Registration successful",
	})
}

// Refresh handles token refresh - IMPROVED with better error handling
func (h *AuthHandler) Refresh(c *gin.Context) {
	var req models.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.WithError(err).Error("Invalid refresh request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "validation_error",
			Message: "Refresh token is required",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Refresh token with Keycloak
	authResponse, err := h.keycloakService.RefreshToken(req.RefreshToken)
	if err != nil {
		h.logger.WithError(err).Error("Token refresh failed")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "refresh_failed",
			Message: "Invalid or expired refresh token",
			Code:    http.StatusUnauthorized,
		})
		return
	}

	h.logger.Info("Token refreshed successfully")
	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "Token refreshed successfully",
		Data:    authResponse,
	})
}

// Logout handles user logout - IMPROVED with better error handling
func (h *AuthHandler) Logout(c *gin.Context) {
	var req models.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.WithError(err).Error("Invalid logout request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "validation_error",
			Message: "Refresh token is required for logout",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Logout from Keycloak
	err := h.keycloakService.Logout(req.RefreshToken)
	if err != nil {
		h.logger.WithError(err).Error("Logout failed")
		// Don't return error to client - logout should always appear successful
		h.logger.Warn("Logout failed but returning success to client")
	}

	h.logger.Info("User logged out successfully")
	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "Logout successful",
	})
}

// Helper functions
func sanitizeInput(input string) string {
	// Basic XSS prevention - strip obvious script markers while keeping common name characters
	replacer := strings.NewReplacer(
		"<", "",
		">", "",
		"\"", "",
		"`", "",
	)
	clean := replacer.Replace(input)
	clean = strings.ReplaceAll(clean, "javascript:", "")
	return strings.TrimSpace(clean)
}

func isUserExistsError(err error) bool {
	// Check if error indicates user already exists
	// This is specific to Keycloak error messages
	return strings.Contains(strings.ToLower(err.Error()), "user exists") ||
		strings.Contains(strings.ToLower(err.Error()), "already exists") ||
		strings.Contains(strings.ToLower(err.Error()), "conflict")
}
