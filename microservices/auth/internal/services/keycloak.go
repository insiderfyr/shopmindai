package services

import (
	"auth-service/internal/config"
	"auth-service/internal/models"
	"auth-service/pkg/logger"
	"context"
	"fmt"

	"github.com/Nerzal/gocloak/v13"
)

// KeycloakServiceInterface defines the interface for Keycloak operations.
type KeycloakServiceInterface interface {
	Login(username, password string) (*models.AuthResponse, error)
	Register(req *models.RegisterRequest) error
	RefreshToken(refreshToken string) (*models.AuthResponse, error)
	Logout(refreshToken string) error
	GetUserProfile(accessToken string) (*models.User, error)
	UpdateUserProfile(accessToken string, req *models.UpdateProfileRequest) error
	ChangePassword(accessToken, currentPassword, newPassword string) error
}

// KeycloakService handles all Keycloak operations
type KeycloakService struct {
	client   *gocloak.GoCloak
	cfg      config.KeycloakConfig
	ctx      context.Context
	logger   logger.LoggerInterface
}

// NewKeycloakService creates a new Keycloak service instance
func NewKeycloakService(cfg config.KeycloakConfig, logger logger.LoggerInterface) KeycloakServiceInterface {
	client := gocloak.NewClient(cfg.URL)
	ctx := context.Background()
	
	return &KeycloakService{
		client: client,
		cfg:    cfg,
		ctx:    ctx,
		logger: logger,
	}
}

// Login authenticates a user and returns tokens
func (k *KeycloakService) Login(username, password string) (*models.AuthResponse, error) {
	token, err := k.client.Login(k.ctx, k.cfg.ClientID, k.cfg.ClientSecret, k.cfg.Realm, username, password)
	if err != nil {
		k.logger.WithError(err).Error("Failed to login user")
		return nil, fmt.Errorf("invalid credentials")
	}

	// Get user info
	userInfo, err := k.client.GetUserInfo(k.ctx, token.AccessToken, k.cfg.Realm)
	if err != nil {
		k.logger.WithError(err).Error("Failed to get user info")
		return nil, fmt.Errorf("failed to get user info")
	}

	// Convert to our user model
	user := &models.User{
		ID:        getString(userInfo.Sub),
		Username:  getString(userInfo.PreferredUsername),
		Email:     getString(userInfo.Email),
		FirstName: getString(userInfo.GivenName),
		LastName:  getString(userInfo.FamilyName),
		Enabled:   true,
	}

	return &models.AuthResponse{
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		TokenType:    token.TokenType,
		ExpiresIn:    int(token.ExpiresIn),
		User:         user,
	}, nil
}

// Register creates a new user in Keycloak
func (k *KeycloakService) Register(req *models.RegisterRequest) error {
	// Get admin token using admin-cli
	adminRealm := k.cfg.AdminRealm
	if adminRealm == "" {
		adminRealm = "master" // fallback to master realm
	}
	
	// Use admin-cli for admin operations
	adminClientID := k.cfg.AdminClientID
	if adminClientID == "" {
		adminClientID = "admin-cli" // fallback to admin-cli
	}
	
	adminToken, err := k.client.Login(k.ctx, adminClientID, "", adminRealm, k.cfg.AdminUser, k.cfg.AdminPass)
	if err != nil {
		k.logger.WithError(err).Error("Failed to get admin token")
		return fmt.Errorf("failed to authenticate admin")
	}

	// Create user representation
	user := gocloak.User{
		Username:  &req.Username,
		Email:     &req.Email,
		FirstName: &req.FirstName,
		LastName:  &req.LastName,
		Enabled:   gocloak.BoolP(true),
		Credentials: &[]gocloak.CredentialRepresentation{
			{
				Type:      gocloak.StringP("password"),
				Value:     &req.Password,
				Temporary: gocloak.BoolP(false),
			},
		},
	}

	// Create user
	userID, err := k.client.CreateUser(k.ctx, adminToken.AccessToken, k.cfg.Realm, user)
	if err != nil {
		k.logger.WithError(err).Error("Failed to create user")
		return fmt.Errorf("failed to create user: %w", err)
	}

	// Set password for the user
	err = k.client.SetPassword(k.ctx, adminToken.AccessToken, userID, k.cfg.Realm, req.Password, false)
	if err != nil {
		k.logger.WithError(err).Error("Failed to set password")
		return fmt.Errorf("failed to set password")
	}

	k.logger.WithField("user_id", userID).Info("User created successfully")
	return nil
}

// RefreshToken refreshes an access token using refresh token
func (k *KeycloakService) RefreshToken(refreshToken string) (*models.AuthResponse, error) {
	token, err := k.client.RefreshToken(k.ctx, refreshToken, k.cfg.ClientID, k.cfg.ClientSecret, k.cfg.Realm)
	if err != nil {
		k.logger.WithError(err).Error("Failed to refresh token")
		return nil, fmt.Errorf("invalid refresh token")
	}

	// Get user info
	userInfo, err := k.client.GetUserInfo(k.ctx, token.AccessToken, k.cfg.Realm)
	if err != nil {
		k.logger.WithError(err).Error("Failed to get user info")
		return nil, fmt.Errorf("failed to get user info")
	}

	// Convert to our user model
	user := &models.User{
		ID:        getString(userInfo.Sub),
		Username:  getString(userInfo.PreferredUsername),
		Email:     getString(userInfo.Email),
		FirstName: getString(userInfo.GivenName),
		LastName:  getString(userInfo.FamilyName),
		Enabled:   true,
	}

	return &models.AuthResponse{
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		TokenType:    token.TokenType,
		ExpiresIn:    int(token.ExpiresIn),
		User:         user,
	}, nil
}

// Logout logs out a user by invalidating their refresh token
func (k *KeycloakService) Logout(refreshToken string) error {
	err := k.client.Logout(k.ctx, k.cfg.ClientID, k.cfg.ClientSecret, k.cfg.Realm, refreshToken)
	if err != nil {
		k.logger.WithError(err).Error("Failed to logout user")
		return fmt.Errorf("failed to logout")
	}
	return nil
}

// GetUserProfile retrieves user profile information
func (k *KeycloakService) GetUserProfile(accessToken string) (*models.User, error) {
	userInfo, err := k.client.GetUserInfo(k.ctx, accessToken, k.cfg.Realm)
	if err != nil {
		k.logger.WithError(err).Error("Failed to get user profile")
		return nil, fmt.Errorf("failed to get user profile")
	}

	return &models.User{
		ID:        getString(userInfo.Sub),
		Username:  getString(userInfo.PreferredUsername),
		Email:     getString(userInfo.Email),
		FirstName: getString(userInfo.GivenName),
		LastName:  getString(userInfo.FamilyName),
		Enabled:   true,
	}, nil
}

// UpdateUserProfile updates user profile information
func (k *KeycloakService) UpdateUserProfile(accessToken string, req *models.UpdateProfileRequest) error {
	// Get user info to get user ID
	userInfo, err := k.client.GetUserInfo(k.ctx, accessToken, k.cfg.Realm)
	if err != nil {
		k.logger.WithError(err).Error("Failed to get user info")
		return fmt.Errorf("failed to get user info")
	}

	// Get admin token for user update
	adminRealm := k.cfg.AdminRealm
	if adminRealm == "" {
		adminRealm = "master" // fallback to master realm
	}
	
	// Use admin-cli for admin operations
	adminClientID := k.cfg.AdminClientID
	if adminClientID == "" {
		adminClientID = "admin-cli" // fallback to admin-cli
	}
	
	adminToken, err := k.client.Login(k.ctx, adminClientID, "", adminRealm, k.cfg.AdminUser, k.cfg.AdminPass)
	if err != nil {
		k.logger.WithError(err).Error("Failed to get admin token")
		return fmt.Errorf("failed to authenticate admin")
	}

	// Update user
	user := gocloak.User{
		ID:        userInfo.Sub,
		FirstName: &req.FirstName,
		LastName:  &req.LastName,
		Email:     &req.Email,
	}

	err = k.client.UpdateUser(k.ctx, adminToken.AccessToken, k.cfg.Realm, user)
	if err != nil {
		k.logger.WithError(err).Error("Failed to update user profile")
		return fmt.Errorf("failed to update user profile")
	}

	return nil
}

// ChangePassword changes user password
func (k *KeycloakService) ChangePassword(accessToken, currentPassword, newPassword string) error {
	// Get user info to get user ID
	userInfo, err := k.client.GetUserInfo(k.ctx, accessToken, k.cfg.Realm)
	if err != nil {
		k.logger.WithError(err).Error("Failed to get user info")
		return fmt.Errorf("failed to get user info")
	}

	// Get admin token for password change
	adminRealm := k.cfg.AdminRealm
	if adminRealm == "" {
		adminRealm = "master" // fallback to master realm
	}
	
	// Use admin-cli for admin operations
	adminClientID := k.cfg.AdminClientID
	if adminClientID == "" {
		adminClientID = "admin-cli" // fallback to admin-cli
	}
	
	adminToken, err := k.client.Login(k.ctx, adminClientID, "", adminRealm, k.cfg.AdminUser, k.cfg.AdminPass)
	if err != nil {
		k.logger.WithError(err).Error("Failed to get admin token")
		return fmt.Errorf("failed to authenticate admin")
	}

	// Set new password
	err = k.client.SetPassword(k.ctx, adminToken.AccessToken, getString(userInfo.Sub), k.cfg.Realm, newPassword, false)
	if err != nil {
		k.logger.WithError(err).Error("Failed to change password")
		return fmt.Errorf("failed to change password")
	}

	return nil
}

// getString safely returns the value of a *string or an empty string if nil
func getString(ptr *string) string {
    if ptr == nil {
        return ""
    }
    return *ptr
}
