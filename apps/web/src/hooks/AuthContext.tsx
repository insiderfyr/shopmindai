import {
  useRef,
  useMemo,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useCallback,
  createContext,
} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useRecoilState, useResetRecoilState, useSetRecoilState } from 'recoil';
import { setTokenHeader, SystemRoles } from 'librechat-data-provider';
import type * as t from 'librechat-data-provider';
import { useGetRole } from '~/data-provider';
import { TAuthConfig, TAuthContext, TResError } from '~/common';
import useClearStates from '~/hooks/Config/useClearStates';
import store from '~/store';

const AuthContext = createContext<TAuthContext | undefined>(undefined);

const AUTH_SERVICE_URL =
  (import.meta.env?.VITE_AUTH_SERVICE_URL as string | undefined) ??
  (import.meta.env?.VITE_AUTH_SERVICE_BASE_URL as string | undefined) ??
  (import.meta.env?.VITE_GATEWAY_URL as string | undefined) ??
  'http://localhost:8088';

const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';
const AUTH_PROVIDER_NAME = 'auth-service';

const authClient = axios.create({
  baseURL: AUTH_SERVICE_URL,
  timeout: 10000,
});

type AuthServiceUser = {
  id?: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: string;
  provider?: string;
};

type AuthServiceAuthResponse = {
  access_token: string;
  refresh_token?: string | null;
  token_type?: string;
  expires_in?: number;
  user?: AuthServiceUser | null;
  twoFAPending?: boolean;
  tempToken?: string;
};

type AuthServiceSuccessResponse<T> = {
  message?: string;
  data?: T;
};

type FinalizeAuthStateParams = {
  token?: string;
  user?: t.TUser | undefined;
  isAuthenticated?: boolean;
  redirect?: string;
  refreshToken?: string | null;
};

type ResetAuthStateOptions = {
  redirect?: string;
  clearError?: boolean;
};

const getStoredRefreshToken = (): string | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) ?? undefined;
  } catch (storageError) {
    console.warn('Unable to read refresh token from storage', storageError);
    return undefined;
  }
};

const persistRefreshToken = (value?: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (value) {
      window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, value);
      return;
    }

    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch (storageError) {
    console.warn('Unable to persist refresh token in storage', storageError);
  }
};

const toTUser = (rawUser?: AuthServiceUser | null): t.TUser | undefined => {
  if (!rawUser?.id) {
    return undefined;
  }

  const firstName = rawUser.first_name ?? rawUser.firstName ?? '';
  const lastName = rawUser.last_name ?? rawUser.lastName ?? '';
  const createdAt = rawUser.created_at ?? rawUser.createdAt ?? new Date().toISOString();
  const updatedAt = rawUser.updated_at ?? rawUser.updatedAt ?? createdAt;

  return {
    id: rawUser.id,
    username: rawUser.username ?? rawUser.email ?? rawUser.id,
    email: rawUser.email ?? '',
    name: rawUser.name ?? ([firstName, lastName].filter(Boolean).join(' ') || rawUser.username || rawUser.email || rawUser.id),
    avatar: '',
    role: rawUser.role ?? SystemRoles.USER,
    provider: rawUser.provider ?? AUTH_PROVIDER_NAME,
    createdAt: new Date(createdAt).toISOString(),
    updatedAt: new Date(updatedAt).toISOString(),
    twoFactorEnabled: false,
  };
};

const resolveErrorMessage = (error: unknown): string => {
  if (!error) {
    return 'Unknown authentication error';
  }

  if ((error as TResError)?.message) {
    return (error as TResError).message;
  }

  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as { message?: string } | undefined;
    return responseData?.message ?? error.response?.statusText ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

const fetchUserProfile = async (token: string): Promise<t.TUser> => {
  const response = await authClient.get<AuthServiceSuccessResponse<AuthServiceUser>>(
    '/api/v1/user/profile',
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const user = toTUser(response.data?.data ?? response.data);

  if (!user) {
    throw new Error('Auth service returned an invalid user payload');
  }

  return user;
};

const AuthContextProvider = ({
  authConfig,
  children,
}: {
  authConfig?: TAuthConfig;
  children: ReactNode;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearStates = useClearStates();
  const resetDefaultPreset = useResetRecoilState(store.defaultPreset);
  const setQueriesEnabled = useSetRecoilState<boolean>(store.queriesEnabled);

  const [user, setUser] = useRecoilState(store.user);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const isMountedRef = useRef(true);
  const redirectRef = useRef<string | undefined>(undefined);

  const { data: userRole = null } = useGetRole(SystemRoles.USER, {
    enabled: !!(isAuthenticated && (user?.role ?? '')),
  });
  const { data: adminRole = null } = useGetRole(SystemRoles.ADMIN, {
    enabled: !!(isAuthenticated && user?.role === SystemRoles.ADMIN),
  });

  const finalizeAuthState = useCallback(
    (params: FinalizeAuthStateParams) => {
      if (!isMountedRef.current) {
        return;
      }

      const { token: nextToken, user: nextUser, isAuthenticated: nextIsAuthenticated, redirect, refreshToken } = params;
      const hasProp = (key: keyof FinalizeAuthStateParams) =>
        Object.prototype.hasOwnProperty.call(params, key);

      if (hasProp('token')) {
        setToken(nextToken);

        if (nextToken) {
          setTokenHeader(nextToken);
          authClient.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
        } else {
          delete axios.defaults.headers.common.Authorization;
          delete authClient.defaults.headers.common.Authorization;
        }
      }

      if (hasProp('isAuthenticated') && typeof nextIsAuthenticated === 'boolean') {
        setIsAuthenticated(nextIsAuthenticated);
        setQueriesEnabled(nextIsAuthenticated);
      }

      if (hasProp('user')) {
        setUser(nextUser);
      }

      if (hasProp('refreshToken')) {
        if (refreshToken === null) {
          persistRefreshToken(undefined);
        } else if (typeof refreshToken === 'string') {
          persistRefreshToken(refreshToken);
        }
      }

      const finalRedirect = redirectRef.current || redirect;
      redirectRef.current = undefined;

      if (finalRedirect) {
        if (finalRedirect.startsWith('http://') || finalRedirect.startsWith('https://')) {
          window.location.href = finalRedirect;
          return;
        }

        navigate(finalRedirect, { replace: true });
      }
    },
    [navigate, setQueriesEnabled, setToken, setUser],
  );

  const resetAuthState = useCallback(
    ({ redirect, clearError }: ResetAuthStateOptions = {}) => {
      finalizeAuthState({
        token: undefined,
        user: undefined,
        isAuthenticated: false,
        refreshToken: null,
        redirect,
      });
      queryClient.removeQueries();
      resetDefaultPreset();
      clearStates();

      if (clearError) {
        setError(undefined);
      }
    },
    [clearStates, finalizeAuthState, queryClient, resetDefaultPreset, setError],
  );

  const refreshSession = useCallback(
    async (providedRefreshToken?: string) => {
      const activeRefreshToken = providedRefreshToken ?? getStoredRefreshToken();

      if (!activeRefreshToken) {
        return false;
      }

      try {
        const response = await authClient.post<AuthServiceSuccessResponse<AuthServiceAuthResponse>>(
          '/api/v1/auth/refresh',
          {
            refresh_token: activeRefreshToken,
          },
        );

        const payload = (response.data?.data ?? response.data) as AuthServiceAuthResponse | undefined;

        if (!payload?.access_token) {
          throw new Error('Missing access token from refresh response');
        }

        const userProfile =
          toTUser(payload.user ?? undefined) ?? (await fetchUserProfile(payload.access_token));

        finalizeAuthState({
          token: payload.access_token,
          user: userProfile,
          isAuthenticated: true,
          refreshToken: payload.refresh_token ?? activeRefreshToken,
        });

        setError(undefined);
        return true;
      } catch (refreshError) {
        console.warn('Failed to refresh session', refreshError);
        finalizeAuthState({
          token: undefined,
          user: undefined,
          isAuthenticated: false,
          refreshToken: null,
        });
        persistRefreshToken(undefined);
        return false;
      }
    },
    [finalizeAuthState, setError],
  );

  const loadUser = useCallback(async () => {
    if (!token) {
      return undefined;
    }

    try {
      const userProfile = await fetchUserProfile(token);
      finalizeAuthState({ user: userProfile });
      return userProfile;
    } catch (profileError) {
      const message = resolveErrorMessage(profileError);
      setError(message);
      return undefined;
    }
  }, [finalizeAuthState, setError, token]);

  const initializeFromRefreshToken = useCallback(async () => {
    if (authConfig?.test) {
      setIsInitializing(false);
      return;
    }

    const storedRefreshToken = getStoredRefreshToken();

    if (!storedRefreshToken) {
      setIsInitializing(false);
      return;
    }

    const refreshed = await refreshSession(storedRefreshToken);

    if (!refreshed) {
      resetAuthState({ redirect: '/login', clearError: true });
    }

    setIsInitializing(false);
  }, [authConfig?.test, refreshSession, resetAuthState]);

  useEffect(() => {
    initializeFromRefreshToken();

    return () => {
      isMountedRef.current = false;
    };
  }, [initializeFromRefreshToken]);

  const login = useCallback(
    (credentials: t.TLoginUser) => {
      void (async () => {
        setError(undefined);

        try {
          const response = await authClient.post<AuthServiceSuccessResponse<AuthServiceAuthResponse>>(
            '/api/v1/auth/login',
            {
              username: credentials.email,
              password: credentials.password,
            },
          );

          const payload = (response.data?.data ?? response.data) as AuthServiceAuthResponse | undefined;

          if (payload?.twoFAPending && payload.tempToken) {
            navigate(`/login/2fa?tempToken=${payload.tempToken}`, { replace: true });
            return;
          }

          if (!payload?.access_token) {
            throw new Error('Authentication failed: missing access token');
          }

          const normalizedUser =
            toTUser(payload.user ?? undefined) ?? (await fetchUserProfile(payload.access_token));

          finalizeAuthState({
            token: payload.access_token,
            user: normalizedUser,
            isAuthenticated: true,
            refreshToken: payload.refresh_token ?? undefined,
            redirect: authConfig?.loginRedirect ?? '/c/new',
          });

          setError(undefined);
        } catch (loginError) {
          const message = resolveErrorMessage(loginError);
          setError(message);
          resetAuthState();
        }
      })();
    },
    [authConfig?.loginRedirect, finalizeAuthState, resetAuthState],
  );

  const logout = useCallback(
    (redirect?: string) => {
      void (async () => {
        if (redirect) {
          redirectRef.current = redirect;
        }

        const storedRefreshToken = getStoredRefreshToken();

        try {
          if (storedRefreshToken) {
            await authClient.post('/api/v1/auth/logout', {
              refresh_token: storedRefreshToken,
            });
          }
        } catch (logoutError) {
          console.warn('Logout request failed', logoutError);
        } finally {
          resetAuthState({ redirect: redirect ?? '/login', clearError: true });
        }
      })();
    },
    [resetAuthState],
  );

  useEffect(() => {
    if (!isInitializing && !isAuthenticated && !getStoredRefreshToken() && !authConfig?.test) {
      resetAuthState({ clearError: true });
      navigate('/login', { replace: true });
    }
  }, [authConfig?.test, isAuthenticated, isInitializing, navigate, resetAuthState]);

  useEffect(() => {
    const handleTokenUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<string | undefined>;
      const newToken = customEvent.detail;

      finalizeAuthState({
        token: newToken,
        isAuthenticated: Boolean(newToken),
      });
    };

    window.addEventListener('tokenUpdated', handleTokenUpdate as EventListener);

    return () => {
      window.removeEventListener('tokenUpdated', handleTokenUpdate as EventListener);
    };
  }, [finalizeAuthState]);

  const memoedValue = useMemo(
    () => ({
      user,
      token,
      error,
      login,
      logout,
      refreshSession,
      loadUser,
      setError,
      roles: {
        [SystemRoles.USER]: userRole,
        [SystemRoles.ADMIN]: adminRole,
      },
      isAuthenticated,
      isInitializing,
    }),
    [
      adminRole,
      error,
      isAuthenticated,
      isInitializing,
      loadUser,
      login,
      logout,
      refreshSession,
      token,
      user,
      userRole,
    ],
  );

  return <AuthContext.Provider value={memoedValue}>{children}</AuthContext.Provider>;
};

const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext should be used inside AuthProvider');
  }

  return context;
};

export { AuthContextProvider, useAuthContext, AuthContext };
