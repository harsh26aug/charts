import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { authService } from '../services/auth';
import { authStorage } from '../services/auth-storage';
import type { LoginRequest, RegisterRequest, User } from '../types/auth';

interface AuthContextValue {
  currentUser: User | null;
  isLoading: boolean;
  authError: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  displayName: string;
  login: (payload: LoginRequest) => Promise<User>;
  register: (payload: RegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authStorage.getUser());
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const login = useCallback(async (payload: LoginRequest): Promise<User> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await authService.login(payload);
      authStorage.setTokens(res.data.data.tokens);
      authStorage.setUser(res.data.data.user);
      setCurrentUser(res.data.data.user);
      return res.data.data.user;
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'message' in error.response
          ? String(error.response.message)
          : 'Login failed';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterRequest): Promise<User> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await authService.register(payload);
      authStorage.setTokens(res.data.data.tokens);
      authStorage.setUser(res.data.data.user);
      setCurrentUser(res.data.data.user);
      return res.data.data.user;
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'message' in error.response
          ? String(error.response.message)
          : 'Registration failed';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = authStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } finally {
      authStorage.clear();
      setCurrentUser(null);
      setAuthError(null);
    }
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isLoading,
      authError,
      isAuthenticated: currentUser !== null,
      isAdmin: currentUser?.role === 'admin',
      displayName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
      login,
      register,
      logout,
      clearAuthError,
    }),
    [currentUser, isLoading, authError, login, register, logout, clearAuthError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};
