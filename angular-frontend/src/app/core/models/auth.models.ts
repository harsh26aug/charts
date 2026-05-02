export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'user';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    data: {
        user: User;
        tokens: AuthTokens;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}
