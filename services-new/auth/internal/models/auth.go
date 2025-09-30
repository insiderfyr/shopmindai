package models

import (
	"strings"
	"time"
	"unicode"
)

// User represents a user in the system
type User struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Enabled   bool      `json:"enabled"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=8"`
}

// RegisterRequest represents a registration request - IMPROVED VALIDATION
type RegisterRequest struct {
	Username  string `json:"username" binding:"omitempty,min=3,max=30"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8,max=128"`
	FirstName string `json:"first_name" binding:"omitempty,min=2,max=50"`
	LastName  string `json:"last_name" binding:"omitempty,min=2,max=50"`
}

// Validate performs additional validation for RegisterRequest
func (r *RegisterRequest) Validate() []string {
	var errors []string

	// Username validation
	if r.Username != "" && !isValidUsername(r.Username) {
		errors = append(errors, "username may contain letters, numbers, underscore, dot, and hyphen")
	}

	// Password validation
	if !isValidPassword(r.Password) {
		errors = append(errors, "password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")
	}

	// Name validation (no numbers or special chars)
	if r.FirstName != "" && !isValidName(r.FirstName) {
		errors = append(errors, "first name must contain only letters and spaces")
	}
	if r.LastName != "" && !isValidName(r.LastName) {
		errors = append(errors, "last name must contain only letters and spaces")
	}

	return errors
}

// RefreshRequest represents a token refresh request
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// AuthResponse represents an authentication response
type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	User         *User  `json:"user"`
}

// ChangePasswordRequest represents a password change request - IMPROVED
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8,max=128"`
}

// Validate performs additional validation for ChangePasswordRequest
func (c *ChangePasswordRequest) Validate() []string {
	var errors []string

	if c.CurrentPassword == c.NewPassword {
		errors = append(errors, "new password must be different from current password")
	}

	if !isValidPassword(c.NewPassword) {
		errors = append(errors, "password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")
	}

	return errors
}

// UpdateProfileRequest represents a profile update request - IMPROVED
type UpdateProfileRequest struct {
	FirstName string `json:"first_name" binding:"omitempty,min=2,max=50"`
	LastName  string `json:"last_name" binding:"omitempty,min=2,max=50"`
	Email     string `json:"email" binding:"omitempty,email"`
}

// Validate performs additional validation for UpdateProfileRequest
func (u *UpdateProfileRequest) Validate() []string {
	var errors []string

	if u.FirstName != "" && !isValidName(u.FirstName) {
		errors = append(errors, "first name must contain only letters and spaces")
	}
	if u.LastName != "" && !isValidName(u.LastName) {
		errors = append(errors, "last name must contain only letters and spaces")
	}

	return errors
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string      `json:"error"`
	Message string      `json:"message"`
	Code    int         `json:"code"`
	Details interface{} `json:"details,omitempty"`
}

// SuccessResponse represents a success response
type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Helper validation functions
func isValidUsername(username string) bool {
	// Allow letters, digits, underscore, dot, and hyphen.
	// Disallow leading/trailing dot or hyphen and disallow consecutive dots.
	if len(username) == 0 {
		return false
	}

	var prevDot bool
	for i, char := range username {
		isAllowed := unicode.IsLetter(char) || unicode.IsDigit(char) || char == '_' || char == '.' || char == '-'
		if !isAllowed {
			return false
		}

		if char == '.' {
			if i == 0 || i == len(username)-1 { // no leading/trailing dot
				return false
			}
			if prevDot { // no consecutive dots
				return false
			}
			prevDot = true
		} else {
			prevDot = false
		}

		if char == '-' && (i == 0 || i == len(username)-1) { // no leading/trailing hyphen
			return false
		}
	}
	return true
}

func isValidPassword(password string) bool {
	var (
		hasUpper   = false
		hasLower   = false
		hasNumber  = false
		hasSpecial = false
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsDigit(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	return hasUpper && hasLower && hasNumber && hasSpecial
}

func isValidName(name string) bool {
	name = strings.TrimSpace(name)
	for _, char := range name {
		if !unicode.IsLetter(char) && char != ' ' && char != '\'' && char != '-' {
			return false
		}
	}
	return true
}

// NormalizeUsername converts an arbitrary input into a safe username form that
// passes validation policies: trims spaces, removes disallowed characters,
// collapses consecutive dots, and trims leading/trailing dots or hyphens.
func NormalizeUsername(input string) string {
	s := strings.TrimSpace(input)

	// Build only allowed characters
	var b strings.Builder
	b.Grow(len(s))

	lastWasDot := false
	for _, r := range s {
		switch {
		case unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_' || r == '-':
			b.WriteRune(r)
			lastWasDot = false
		case r == '.':
			if !lastWasDot { // collapse consecutive dots
				b.WriteRune('.')
				lastWasDot = true
			}
		default:
			// drop any other character
		}
	}

	out := b.String()
	// Trim leading/trailing '.' or '-'
	out = strings.Trim(out, "-. ")
	return out
}
