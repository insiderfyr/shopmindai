import axios from 'axios';

const AUTH_SERVICE_URL =
  (import.meta.env?.VITE_AUTH_SERVICE_URL as string | undefined) ??
  (import.meta.env?.VITE_AUTH_SERVICE_BASE_URL as string | undefined) ??
  (import.meta.env?.VITE_GATEWAY_URL as string | undefined) ??
  'http://localhost:8088';

const authService = axios.create({
  baseURL: AUTH_SERVICE_URL,
  timeout: 10000,
});

// Custom startup config that calls our auth-service
export const getAuthStartupConfig = async () => {
  try {
    const response = await authService.get('/api/auth/config');
    
    // Transform the response to match TStartupConfig format
    const authConfig = response.data.data;
    
    return {
      appTitle: 'ShopMindAI',
      version: '1.0.0-mvp',
      description: 'AI-Powered Shopping Assistant',
      
      // Auth configuration
      authConfig: {
        keycloak: {
          url: authConfig.keycloak.url,
          realm: authConfig.keycloak.realm,
          clientId: authConfig.keycloak.clientId,
          authUrl: authConfig.keycloak.authUrl,
          tokenUrl: authConfig.keycloak.tokenUrl,
          logoutUrl: authConfig.keycloak.logoutUrl,
        },
        endpoints: authConfig.endpoints,
        features: authConfig.features,
        validation: authConfig.validation,
      },
      
      // Default interface settings
      interface: {
        modelSelect: true,
        sidebar: true,
        header: true,
        footer: true,
      },
      
      // Default features
      registration: authConfig.features.registration,
      passwordReset: authConfig.features.passwordReset,
      emailVerification: authConfig.features.emailVerification,
      socialLogin: authConfig.features.socialLogin,
      
      // Default endpoints
      endpoints: {
        login: authConfig.endpoints.login,
        register: authConfig.endpoints.register,
        refresh: authConfig.endpoints.refresh,
        logout: authConfig.endpoints.logout,
        profile: authConfig.endpoints.profile,
      },
    };
  } catch (error) {
    console.error('Failed to fetch auth startup config:', error);
    
    // Return fallback config if auth-service is not available
    return {
      appTitle: 'ShopMindAI',
      version: '1.0.0-mvp',
      description: 'AI-Powered Shopping Assistant',
      
      authConfig: {
        keycloak: {
          url: 'http://localhost:8081/auth',
          realm: 'ShopMindAI',
          clientId: 'auth-service',
          authUrl: 'http://localhost:8081/auth/realms/ShopMindAI/protocol/openid-connect/auth',
          tokenUrl: 'http://localhost:8081/auth/realms/ShopMindAI/protocol/openid-connect/token',
          logoutUrl: 'http://localhost:8081/auth/realms/ShopMindAI/protocol/openid-connect/logout',
        },
        endpoints: {
          login: '/api/v1/auth/login',
          register: '/api/v1/auth/register',
          refresh: '/api/v1/auth/refresh',
          logout: '/api/v1/auth/logout',
          profile: '/api/v1/user/profile',
        },
        features: {
          registration: true,
          passwordReset: true,
          emailVerification: false,
          socialLogin: false,
        },
        validation: {
          username: {
            minLength: 3,
            maxLength: 30,
            pattern: '^[a-zA-Z0-9_]+$',
          },
          password: {
            minLength: 8,
            maxLength: 128,
            requirements: [
              'At least one uppercase letter',
              'At least one lowercase letter',
              'At least one number',
              'At least one special character',
            ],
          },
          email: {
            required: true,
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          },
        },
      },
      
      interface: {
        modelSelect: true,
        sidebar: true,
        header: true,
        footer: true,
      },
      
      registration: true,
      passwordReset: true,
      emailVerification: false,
      socialLogin: false,
      
      endpoints: {
        login: '/api/v1/auth/login',
        register: '/api/v1/auth/register',
        refresh: '/api/v1/auth/refresh',
        logout: '/api/v1/auth/logout',
        profile: '/api/v1/user/profile',
      },
    };
  }
};
