package handlers

import (
	"auth-service/internal/config"
	"auth-service/internal/models"
	"auth-service/internal/services"
	"auth-service/pkg/logger"
	"net/http"

	"github.com/gin-gonic/gin"
)

// UserHandler handles user-related requests
type UserHandler struct {
	keycloakService services.KeycloakServiceInterface
	logger          logger.LoggerInterface
}

// NewUserHandler creates a new user handler
func NewUserHandler(cfg *config.Config, logger logger.LoggerInterface) *UserHandler {
	return &UserHandler{
		keycloakService: services.NewKeycloakService(cfg.Keycloak, logger),
		logger:          logger,
	}
}

// GetProfile retrieves user profile information
func (h *UserHandler) GetProfile(c *gin.Context) {
	// Get access token from context (set by auth middleware)
	accessToken, exists := c.Get("access_token")
	if !exists {
		h.logger.Error("Access token not found in context")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "unauthorized",
			Message: "Access token not found",
			Code:    http.StatusUnauthorized,
		})
		return
	}

	// Get user profile from Keycloak
	user, err := h.keycloakService.GetUserProfile(accessToken.(string))
	if err != nil {
		h.logger.WithError(err).Error("Failed to get user profile")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "internal_error",
			Message: "Failed to retrieve user profile",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	h.logger.WithField("user_id", user.ID).Info("User profile retrieved")
	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "Profile retrieved successfully",
		Data:    user,
	})
}

// UpdateProfile updates user profile information
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	// Get access token from context
	accessToken, exists := c.Get("access_token")
	if !exists {
		h.logger.Error("Access token not found in context")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "unauthorized",
			Message: "Access token not found",
			Code:    http.StatusUnauthorized,
		})
		return
	}

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.WithError(err).Error("Invalid profile update request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "validation_error",
			Message: err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Update user profile in Keycloak
	err := h.keycloakService.UpdateUserProfile(accessToken.(string), &req)
	if err != nil {
		h.logger.WithError(err).Error("Failed to update user profile")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "update_failed",
			Message: "Failed to update user profile",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	userID, _ := c.Get("user_id")
	h.logger.WithField("user_id", userID).Info("User profile updated successfully")
	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "Profile updated successfully",
	})
}

// ChangePassword changes user password
func (h *UserHandler) ChangePassword(c *gin.Context) {
	// Get access token from context
	accessToken, exists := c.Get("access_token")
	if !exists {
		h.logger.Error("Access token not found in context")
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "unauthorized",
			Message: "Access token not found",
			Code:    http.StatusUnauthorized,
		})
		return
	}

	var req models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.WithError(err).Error("Invalid password change request")
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "validation_error",
			Message: err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Change password in Keycloak
	err := h.keycloakService.ChangePassword(accessToken.(string), req.CurrentPassword, req.NewPassword)
	if err != nil {
		h.logger.WithError(err).Error("Failed to change password")
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "password_change_failed",
			Message: "Failed to change password",
			Code:    http.StatusBadRequest,
		})
		return
	}

	userID, _ := c.Get("user_id")
	h.logger.WithField("user_id", userID).Info("Password changed successfully")
	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "Password changed successfully",
	})
}
