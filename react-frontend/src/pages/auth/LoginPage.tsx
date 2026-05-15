import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface LoginForm {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, authError, clearAuthError } = useAuth();
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [touched, setTouched] = useState<Record<keyof LoginForm, boolean>>({
    email: false,
    password: false,
  });

  const emailInvalid = touched.email && (!form.email || !/^\S+@\S+\.\S+$/.test(form.email));
  const passwordInvalid = touched.password && !form.password;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ email: true, password: true });

    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email) || !form.password) {
      return;
    }

    try {
      await login(form);
      navigate('/dashboard');
    } catch {
      // error state is handled in auth context
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Sign In</h1>

        {authError && <div className="alert alert-error">{authError}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, email: e.target.value }));
                clearAuthError();
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              className={emailInvalid ? 'invalid' : ''}
              placeholder="you@example.com"
            />
            {emailInvalid && <span className="error-msg">Valid email is required</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, password: e.target.value }));
                clearAuthError();
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              className={passwordInvalid ? 'invalid' : ''}
              placeholder="........"
            />
            {passwordInvalid && <span className="error-msg">Password is required</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/auth/register">Register</Link>
        </p>
      </div>
    </div>
  );
};
