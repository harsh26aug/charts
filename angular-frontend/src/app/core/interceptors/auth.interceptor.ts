import { Injectable, inject } from '@angular/core';
import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private readonly authService = inject(AuthService);
    private isRefreshing = false;
    private refreshSubject$ = new BehaviorSubject<string | null>(null);

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const token = this.authService.getAccessToken();
        const noCacheReq = req.clone({
          setHeaders: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });
        const authReq = token ? this.addToken(noCacheReq, token) : noCacheReq;

        return next.handle(authReq).pipe(
            catchError((err: HttpErrorResponse) => {
                if (err.status === 401 && !req.url.includes('/auth/refresh')) {
                    return this.handle401(req, next);
                }
                return throwError(() => err);
            }),
        );
    }

    private addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
        return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }

    private handle401(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshSubject$.next(null);

            return this.authService.refreshTokens().pipe(
                switchMap((tokens) => {
                    this.isRefreshing = false;
                    this.refreshSubject$.next(tokens.accessToken);
                    return next.handle(this.addToken(req, tokens.accessToken));
                }),
                catchError((err) => {
                    this.isRefreshing = false;
                    return throwError(() => err);
                }),
            );
        }

        // Queue requests while refresh is in progress
        return this.refreshSubject$.pipe(
            filter((token): token is string => token !== null),
            take(1),
            switchMap((token) => next.handle(this.addToken(req, token))),
        );
    }
}
