import axios from 'axios';

const AUTH_SERVICE_URL =
  (import.meta.env?.VITE_AUTH_SERVICE_URL as string | undefined) ??
  (import.meta.env?.VITE_AUTH_SERVICE_BASE_URL as string | undefined) ??
  (import.meta.env?.VITE_GATEWAY_URL as string | undefined) ??
  'http://localhost:8088';

const sanitizeOrigin = (value: string | undefined | null) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  try {
    const origin = new URL(value).origin;
    return origin.replace(/\/$/, '');
  } catch (_error) {
    if (value.startsWith('http')) {
      // If the value looked like a URL but failed parsing, strip trailing slash and return.
      return value.replace(/\/$/, '');
    }
    return null;
  }
};

const DEFAULT_SERVER_DOMAIN = sanitizeOrigin(AUTH_SERVICE_URL) ?? 'http://localhost:8088';

const authService = axios.create({
  baseURL: AUTH_SERVICE_URL,
  timeout: 10000,
});

type ProviderFlags = {
  google: boolean;
  facebook: boolean;
  discord: boolean;
  github: boolean;
  saml: boolean;
  apple: boolean;
  openid: boolean;
};

const DEFAULT_PROVIDER_FLAGS = {
  google: true,
  apple: true,
  github: false,
  facebook: false,
  discord: false,
  saml: false,
  openid: false,
} satisfies ProviderFlags;

const DEFAULT_SOCIAL_LOGINS = Object.entries(DEFAULT_PROVIDER_FLAGS)
  .filter(([, enabled]) => enabled)
  .map(([key]) => key);

const buildBaseStartupConfig = (overrides: Record<string, unknown> = {}) => {
  const base = {
    appTitle: 'ShopMindAI',
    version: '1.0.0-mvp',
    description: 'AI-Powered Shopping Assistant',
    interface: {
      modelSelect: true,
      sidebar: true,
      header: true,
      footer: true,
    },
    socialLogins: DEFAULT_SOCIAL_LOGINS,
    discordLoginEnabled: DEFAULT_PROVIDER_FLAGS.discord,
    facebookLoginEnabled: DEFAULT_PROVIDER_FLAGS.facebook,
    githubLoginEnabled: DEFAULT_PROVIDER_FLAGS.github,
    googleLoginEnabled: DEFAULT_PROVIDER_FLAGS.google,
    openidLoginEnabled: DEFAULT_PROVIDER_FLAGS.openid,
    appleLoginEnabled: DEFAULT_PROVIDER_FLAGS.apple,
    samlLoginEnabled: DEFAULT_PROVIDER_FLAGS.saml,
    openidLabel: 'Continue with Single Sign-On',
    openidImageUrl: '',
    openidAutoRedirect: false,
    samlLabel: 'SAML',
    samlImageUrl: '',
    ldap: {
      enabled: false,
    },
    serverDomain: DEFAULT_SERVER_DOMAIN,
    emailLoginEnabled: true,
    registrationEnabled: true,
    socialLoginEnabled: DEFAULT_SOCIAL_LOGINS.length > 0,
    passwordResetEnabled: true,
    emailEnabled: false,
    showBirthdayIcon: false,
    helpAndFaqURL: '',
    sharedLinksEnabled: false,
    publicSharedLinksEnabled: false,
    instanceProjectId: 'shopmindai',
    analyticsGtmId: undefined,
    bundlerURL: undefined,
    staticBundlerURL: undefined,
    sharePointFilePickerEnabled: false,
    sharePointBaseUrl: undefined,
    sharePointPickerGraphScope: undefined,
    sharePointPickerSharePointScope: undefined,
    openidReuseTokens: false,
    minPasswordLength: 8,
    webSearch: undefined,
    mcpServers: undefined,
    mcpPlaceholder: undefined,
    endpoints: {
      login: '/api/v1/auth/login',
      register: '/api/v1/auth/register',
      refresh: '/api/v1/auth/refresh',
      logout: '/api/v1/auth/logout',
      profile: '/api/v1/user/profile',
    },
  };

  return {
    ...base,
    ...overrides,
    interface: {
      ...base.interface,
      ...(overrides.interface as Record<string, unknown> | undefined),
    },
    endpoints: {
      ...base.endpoints,
      ...(overrides.endpoints as Record<string, unknown> | undefined),
    },
    ldap: {
      ...base.ldap,
      ...(overrides.ldap as Record<string, unknown> | undefined),
    },
  };
};

const extractProviderSettings = (authConfig: any) => {
  const socialLoginFeature = authConfig?.features?.socialLogin;
  const rawProviderConfig =
    typeof socialLoginFeature === 'object' && socialLoginFeature !== null
      ? socialLoginFeature.providers ?? socialLoginFeature
      : {};

  const providerFlags: ProviderFlags = {
    google: Boolean(rawProviderConfig?.google ?? DEFAULT_PROVIDER_FLAGS.google),
    facebook: Boolean(rawProviderConfig?.facebook ?? DEFAULT_PROVIDER_FLAGS.facebook),
    discord: Boolean(rawProviderConfig?.discord ?? DEFAULT_PROVIDER_FLAGS.discord),
    github: Boolean(rawProviderConfig?.github ?? DEFAULT_PROVIDER_FLAGS.github),
    saml: Boolean(rawProviderConfig?.saml ?? DEFAULT_PROVIDER_FLAGS.saml),
    apple: Boolean(rawProviderConfig?.apple ?? DEFAULT_PROVIDER_FLAGS.apple),
    openid: Boolean(rawProviderConfig?.openid ?? DEFAULT_PROVIDER_FLAGS.openid),
  };

  const hasKeycloakConfig = Boolean(
    authConfig?.keycloak?.authUrl || authConfig?.keycloak?.externalAuthUrl,
  );

  if (hasKeycloakConfig) {
    providerFlags.openid = true;
  }

  let socialLoginEnabled =
    typeof socialLoginFeature === 'boolean'
      ? socialLoginFeature
      : Boolean(
          socialLoginFeature?.enabled ??
            Object.values(providerFlags).some((enabled) => enabled === true),
        );

  if (hasKeycloakConfig && socialLoginEnabled === false) {
    socialLoginEnabled = true;
  }

  if (!socialLoginEnabled) {
    (Object.keys(providerFlags) as Array<keyof ProviderFlags>).forEach((key) => {
      providerFlags[key] = false;
    });
  }

  const socialLogins = socialLoginEnabled
    ? Array.from(
        new Set(
          (Object.entries(providerFlags) as Array<[keyof ProviderFlags, boolean]>)
            .filter(([, enabled]) => enabled)
            .map(([provider]) => provider),
        ),
      )
    : [];

  return {
    socialLoginEnabled,
    socialLogins,
    providerFlags,
  };
};

// Custom startup config that calls our auth-service
export const getAuthStartupConfig = async () => {
  try {
    const response = await authService.get('/api/auth/config');
    const authConfig = response.data?.data ?? {};

    const baseConfig = buildBaseStartupConfig({
      endpoints: {
        login: authConfig?.endpoints?.login ?? '/api/v1/auth/login',
        register: authConfig?.endpoints?.register ?? '/api/v1/auth/register',
        refresh: authConfig?.endpoints?.refresh ?? '/api/v1/auth/refresh',
        logout: authConfig?.endpoints?.logout ?? '/api/v1/auth/logout',
        profile: authConfig?.endpoints?.profile ?? '/api/v1/user/profile',
      },
    });

    const serverDomain = sanitizeOrigin(authConfig?.serverDomain) ?? DEFAULT_SERVER_DOMAIN;

    const { socialLoginEnabled, socialLogins, providerFlags } = extractProviderSettings(authConfig);

    return {
      ...baseConfig,
      authConfig,
      serverDomain,
      registrationEnabled:
        authConfig?.features?.registration ?? baseConfig.registrationEnabled,
      passwordResetEnabled:
        authConfig?.features?.passwordReset ?? baseConfig.passwordResetEnabled,
      emailEnabled:
        authConfig?.features?.emailVerification ?? baseConfig.emailEnabled,
      socialLoginEnabled,
      socialLogins: socialLogins.length > 0 ? socialLogins : DEFAULT_SOCIAL_LOGINS,
      discordLoginEnabled: providerFlags.discord,
      facebookLoginEnabled: providerFlags.facebook,
      githubLoginEnabled: providerFlags.github,
      googleLoginEnabled: providerFlags.google,
      samlLoginEnabled: providerFlags.saml,
      appleLoginEnabled: providerFlags.apple,
      openidLoginEnabled: providerFlags.openid,
      openidLabel:
        authConfig?.socialLogin?.openidLabel ??
        baseConfig.openidLabel ??
        `Continue with ${authConfig?.keycloak?.realm ?? 'Single Sign-On'}`,
      openidImageUrl:
        authConfig?.socialLogin?.openidImageUrl ?? baseConfig.openidImageUrl,
    };
  } catch (error) {
    console.error('Failed to fetch auth startup config:', error);

    // Return fallback config if auth-service is not available
    return buildBaseStartupConfig({
      authConfig: {
        keycloak: {
          url: 'http://localhost:8081/auth',
          realm: 'ShopMindAI',
          clientId: 'auth-service',
          authUrl:
            'http://localhost:8081/auth/realms/ShopMindAI/protocol/openid-connect/auth',
          tokenUrl:
            'http://localhost:8081/auth/realms/ShopMindAI/protocol/openid-connect/token',
          logoutUrl:
            'http://localhost:8081/auth/realms/ShopMindAI/protocol/openid-connect/logout',
        },
      },
      socialLoginEnabled: true,
      socialLogins: DEFAULT_SOCIAL_LOGINS,
      googleLoginEnabled: true,
      appleLoginEnabled: true,
    });
  }
};
