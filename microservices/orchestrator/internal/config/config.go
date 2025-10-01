package config

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Port           string
	Env            string
	AllowedOrigins string
	LLMProxyURL    string // ex: http://localhost:9000
	LLMProxyToken  string // optional: Authorization Bearer
	Keycloak       KeycloakConfig
	AuthService    AuthServiceConfig
}

type KeycloakConfig struct {
	URL      string
	Realm    string
	ClientID string
	Issuer   string
	JWKSURL  string
}

func Load() Config {
	cfg := Config{
		Port:           getenv("APP_PORT", "8090"),
		Env:            getenv("APP_ENV", "dev"),
		AllowedOrigins: getenv("ALLOWED_ORIGINS", "*"),
		LLMProxyURL:    getenv("LLM_PROXY_URL", ""),
		LLMProxyToken:  getenv("LLM_PROXY_TOKEN", ""),
		Keycloak: KeycloakConfig{
			URL:      getenv("KEYCLOAK_URL", ""),
			Realm:    getenv("KEYCLOAK_REALM", ""),
			ClientID: getenv("KEYCLOAK_CLIENT_ID", ""),
			Issuer:   getenv("KEYCLOAK_ISSUER_URL", ""),
			JWKSURL:  getenv("KEYCLOAK_JWKS_URL", ""),
		},
		AuthService: AuthServiceConfig{
			BaseURL: getenv("AUTH_SERVICE_URL", getenv("AUTH_SERVICE_BASE_URL", "")),
		},
	}

	cfg.Keycloak.populateDerived()
	cfg.AuthService.populateDerived()
	return cfg
}

func (kc *KeycloakConfig) populateDerived() {
	if !kc.Enabled() {
		return
	}

	trimmed := strings.TrimRight(kc.URL, "/")
	if kc.Issuer == "" {
		if strings.Contains(trimmed, "/realms/") {
			kc.Issuer = trimmed
		} else {
			kc.Issuer = fmt.Sprintf("%s/realms/%s", trimmed, kc.Realm)
		}
	}

	if kc.JWKSURL == "" {
		kc.JWKSURL = fmt.Sprintf("%s/protocol/openid-connect/certs", strings.TrimRight(kc.Issuer, "/"))
	}
}

func (kc KeycloakConfig) Enabled() bool {
	return kc.URL != "" && kc.Realm != ""
}

type AuthServiceConfig struct {
	BaseURL    string
	ProfileURL string
}

func (ac *AuthServiceConfig) populateDerived() {
	if !ac.Enabled() {
		return
	}
	ac.BaseURL = strings.TrimRight(ac.BaseURL, "/")
	ac.ProfileURL = ac.BaseURL + "/api/v1/user/profile"
}

func (ac AuthServiceConfig) Enabled() bool {
	return ac.BaseURL != ""
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
