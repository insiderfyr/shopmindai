package handlers

import (
	"auth-service/internal/models"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockKeycloakService is a mock implementation of KeycloakService
type MockKeycloakService struct {
	mock.Mock
}

func (m *MockKeycloakService) Login(username, password string) (*models.AuthResponse, error) {
	args := m.Called(username, password)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.AuthResponse), args.Error(1)
}

func (m *MockKeycloakService) Register(req *models.RegisterRequest) error {
	args := m.Called(req)
	return args.Error(0)
}

func (m *MockKeycloakService) RefreshToken(refreshToken string) (*models.AuthResponse, error) {
	args := m.Called(refreshToken)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.AuthResponse), args.Error(1)
}

func (m *MockKeycloakService) Logout(refreshToken string) error {
	args := m.Called(refreshToken)
	return args.Error(0)
}

func (m *MockKeycloakService) GetUserProfile(accessToken string) (*models.User, error) {
	args := m.Called(accessToken)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockKeycloakService) UpdateUserProfile(accessToken string, req *models.UpdateProfileRequest) error {
	args := m.Called(accessToken, req)
	return args.Error(0)
}

func (m *MockKeycloakService) ChangePassword(accessToken, currentPassword, newPassword string) error {
	args := m.Called(accessToken, currentPassword, newPassword)
	return args.Error(0)
}

func TestAuthHandler_Login(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	// Create mock service
	mockService := new(MockKeycloakService)
	logger := logrus.New()
	
	// Create handler with mock service
	handler := &AuthHandler{
		keycloakService: mockService,
		logger:          logger,
	}
	
	// Test cases
	tests := []struct {
		name           string
		requestBody    models.LoginRequest
		mockSetup      func()
		expectedStatus int
		expectedError  string
	}{
		{
			name: "successful login",
			requestBody: models.LoginRequest{
				Username: "testuser",
				Password: "password123",
			},
			mockSetup: func() {
				mockService.On("Login", "testuser", "password123").Return(
					&models.AuthResponse{
						AccessToken:  "access-token",
						RefreshToken: "refresh-token",
						TokenType:    "Bearer",
						ExpiresIn:    3600,
						User: &models.User{
							ID:       "user-id",
							Username: "testuser",
							Email:    "test@example.com",
						},
					},
					nil,
				).Once()
			},
			expectedStatus: http.StatusOK,
		},
		{
			name: "invalid credentials",
			requestBody: models.LoginRequest{
				Username: "testuser",
				Password: "wrongpassword",
			},
			mockSetup: func() {
				mockService.On("Login", "testuser", "wrongpassword").Return(
					nil,
					assert.AnError,
				).Once()
			},
			expectedStatus: http.StatusUnauthorized,
			expectedError:  "authentication_failed",
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup mock
			tt.mockSetup()
			
			// Create request
			jsonBody, _ := json.Marshal(tt.requestBody)
			req, _ := http.NewRequest("POST", "/auth/login", bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			
			// Create response recorder
			w := httptest.NewRecorder()
			
			// Create Gin context
			c, _ := gin.CreateTestContext(w)
			c.Request = req
			
			// Call handler
			handler.Login(c)
			
			// Assertions
			assert.Equal(t, tt.expectedStatus, w.Code)
			
			if tt.expectedError != "" {
				var response models.ErrorResponse
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Equal(t, tt.expectedError, response.Error)
			}
			
			// Verify mock expectations
			mockService.AssertExpectations(t)
		})
	}
}

func TestAuthHandler_Register(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	// Create mock service
	mockService := new(MockKeycloakService)
	logger := logrus.New()
	
	// Create handler with mock service
	handler := &AuthHandler{
		keycloakService: mockService,
		logger:          logger,
	}
	
	// Test successful registration
	requestBody := models.RegisterRequest{
		Username:  "newuser",
		Email:     "newuser@example.com",
		Password:  "Password123!",
		FirstName: "John",
		LastName:  "Doe",
	}
	
	// Setup mock
	mockService.On("Register", mock.AnythingOfType("*models.RegisterRequest")).Return(nil).Once()
	
	// Create request
	jsonBody, _ := json.Marshal(requestBody)
	req, _ := http.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	
	// Create response recorder
	w := httptest.NewRecorder()
	
	// Create Gin context
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	
	// Call handler
	handler.Register(c)
	
	// Assertions
	assert.Equal(t, http.StatusCreated, w.Code)
	
	var response models.SuccessResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Registration successful", response.Message)
	
	// Verify mock expectations
	mockService.AssertExpectations(t)
}
