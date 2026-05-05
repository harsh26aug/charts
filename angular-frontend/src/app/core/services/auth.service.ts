import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';
import {
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiResponse,
} from '@core/models/auth.models';
import { environment } from '@env/environment';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  // --- Signals ---
  readonly currentUser = signal<User | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly authError = signal<string | null>(null);

  // --- Computed signals ---
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly displayName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  // Used internally for refresh token synchronization
  private refreshInProgress$ = new BehaviorSubject<boolean>(false);

  constructor() {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      this.currentUser.set(JSON.parse(stored));
    }
  }

  login(credentials: LoginRequest): Observable<User> {
    this.isLoading.set(true);
    this.authError.set(null);

    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap((res) => {
        this.storeTokens(res.data.tokens);
        this.storeUser(res.data.user);
      }),
      map((res) => res.data.user),
      catchError((err) => {
        const msg = err.error?.message || 'Login failed';
        this.authError.set(msg);
        return throwError(() => new Error(msg));
      }),
      tap({ finalize: () => this.isLoading.set(false) }),
    );
  }

  register(data: RegisterRequest): Observable<User> {
    this.isLoading.set(true);
    this.authError.set(null);

    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, data).pipe(
      tap((res) => {
        this.storeTokens(res.data.tokens);
        this.storeUser(res.data.user);
      }),
      map((res) => res.data.user),
      catchError((err) => {
        const msg = err.error?.message || 'Registration failed';
        this.authError.set(msg);
        return throwError(() => new Error(msg));
      }),
      tap({ finalize: () => this.isLoading.set(false) }),
    );
  }

  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    const call$ = refreshToken
      ? this.http.post<void>(`${this.baseUrl}/logout`, { refreshToken })
      : new Observable<void>((obs) => {
          obs.next();
          obs.complete();
        });

    return call$.pipe(
      tap({ complete: () => this.clearSession() }),
      catchError(() => {
        this.clearSession();
        return throwError(() => new Error('Logout failed'));
      }),
    );
  }

  refreshTokens(): Observable<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }

    return this.http
      .post<ApiResponse<AuthTokens>>(`${this.baseUrl}/refresh`, { refreshToken })
      .pipe(
        tap((res) => this.storeTokens(res.data)),
        map((res) => res.data),
        catchError((err) => {
          this.clearSession();
          return throwError(() => err);
        }),
      );
  }

  loadProfile(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/me`).pipe(
      tap((res) => this.currentUser.set(res.data)),
      map((res) => res.data),
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  private storeUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }
}
