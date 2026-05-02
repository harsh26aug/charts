import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1 class="auth-title">Create Account</h1>

        @if (authService.authError()) {
          <div class="alert alert-error">{{ authService.authError() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name</label>
              <input id="firstName" type="text" formControlName="firstName" [class.invalid]="isInvalid('firstName')" />
              @if (isInvalid('firstName')) { <span class="error-msg">First name is required</span> }
            </div>
            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input id="lastName" type="text" formControlName="lastName" [class.invalid]="isInvalid('lastName')" />
              @if (isInvalid('lastName')) { <span class="error-msg">Last name is required</span> }
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" [class.invalid]="isInvalid('email')" />
            @if (isInvalid('email')) { <span class="error-msg">Valid email is required</span> }
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" formControlName="password" [class.invalid]="isInvalid('password')" />
            @if (isInvalid('password')) { <span class="error-msg">Min 8 characters required</span> }
          </div>

          <button type="submit" class="btn btn-primary" [disabled]="authService.isLoading() || form.invalid">
            @if (authService.isLoading()) { Creating account… } @else { Register }
          </button>
        </form>

        <p class="auth-footer">Already have an account? <a routerLink="/auth/login">Sign in</a></p>
      </div>
    </div>
  `,
    styles: [`
    .auth-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .auth-card { background: var(--card-bg); padding: 2rem; border-radius: 8px; width: 100%; max-width: 480px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
    .auth-title { font-size: 1.5rem; margin-bottom: 1.5rem; text-align: center; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 4px; }
    label { font-size: 0.875rem; font-weight: 500; }
    input { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: 4px; font-size: var(--font-size-base); }
    input.invalid { border-color: var(--error-color); }
    .error-msg { font-size: 0.75rem; color: var(--error-color); }
    .btn { width: 100%; padding: 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-size: var(--font-size-base); margin-top: 0.5rem; }
    .btn-primary { background: var(--primary-color); color: #fff; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .alert { padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem; font-size: 0.875rem; }
    .alert-error { background: #fde8e8; color: var(--error-color); }
    .auth-footer { text-align: center; margin-top: 1rem; font-size: 0.875rem; }
    a { color: var(--primary-color); }
  `],
})
export class RegisterComponent {
    readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);

    form = this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
    });

    isInvalid(field: string): boolean {
        const ctrl = this.form.get(field);
        return !!(ctrl?.invalid && ctrl.touched);
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const { email, firstName, lastName, password } = this.form.value;
        this.authService
            .register({ email: email!, firstName: firstName!, lastName: lastName!, password: password! })
            .subscribe({ next: () => this.router.navigate(['/dashboard']) });
    }
}
