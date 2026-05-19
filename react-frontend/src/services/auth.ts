import { api } from './http';
import type {
  ApiResponse,
  AuthResponse,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
} from '../types/auth';

export const authService = {
  login(payload: LoginRequest) {
    return api.post<AuthResponse>('/auth/login', payload);
  },
  register(payload: RegisterRequest) {
    return api.post<AuthResponse>('/auth/register', payload);
  },
  logout(refreshToken: string) {
    return api.post<void>('/auth/logout', { refreshToken });
  },
  me() {
    return api.get<ApiResponse<User>>('/auth/me');
  },
  refresh(refreshToken: string) {
    return api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken });
  },
};
