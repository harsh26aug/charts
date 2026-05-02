import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <h1>Dashboard</h1>
        <div class="user-info">
          <span>Welcome, {{ authService.displayName() }}</span>
          @if (authService.isAdmin()) {
            <span class="badge badge-admin">Admin</span>
          }
          <button class="btn btn-outline" (click)="logout()">Logout</button>
        </div>
      </header>

      <main class="dashboard-content">
        @if (authService.currentUser(); as user) {
          <div class="profile-card">
            <h2>Your Profile</h2>
            <dl class="profile-details">
              <dt>Email</dt><dd>{{ user.email }}</dd>
              <dt>Name</dt><dd>{{ user.firstName }} {{ user.lastName }}</dd>
              <dt>Role</dt><dd>{{ user.role | titlecase }}</dd>
              <dt>Member since</dt><dd>{{ user.createdAt | date: 'mediumDate' }}</dd>
            </dl>
          </div>
        }
      </main>
    </div>
  `,
    styles: [`
    .dashboard { min-height: 100vh; background: var(--bg-color); }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: var(--primary-color); color: #fff; }
    .user-info { display: flex; align-items: center; gap: 1rem; }
    .badge { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .badge-admin { background: var(--secondary-color); color: #fff; }
    .btn-outline { padding: 0.4rem 1rem; border: 1px solid #fff; border-radius: 4px; background: transparent; color: #fff; cursor: pointer; }
    .dashboard-content { padding: 2rem; }
    .profile-card { background: var(--card-bg); border-radius: 8px; padding: 1.5rem; max-width: 480px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    h2 { margin-bottom: 1rem; font-size: 1.125rem; }
    dl { display: grid; grid-template-columns: 140px 1fr; gap: 0.5rem 1rem; }
    dt { font-weight: 500; color: #666; }
    dd { margin: 0; }
  `],
})
export class DashboardComponent {
    readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    logout(): void {
        this.authService.logout().subscribe({
            next: () => this.router.navigate(['/auth/login']),
            error: () => this.router.navigate(['/auth/login']),
        });
    }
}
