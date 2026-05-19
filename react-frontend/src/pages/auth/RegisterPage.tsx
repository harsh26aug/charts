import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading, authError, clearAuthError } = useAuth();
  const [form, setForm] = useState<RegisterForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const [touched, setTouched] = useState<Record<keyof RegisterForm, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
  });

  const nameInvalid = (value: string, key: 'firstName' | 'lastName') =>
    touched[key] && value.trim().length < 2;
  const emailInvalid = touched.email && (!form.email || !/^\S+@\S+\.\S+$/.test(form.email));
  const passwordInvalid = touched.password && form.password.length < 8;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ firstName: true, lastName: true, email: true, password: true });

    if (
      form.firstName.trim().length < 2 ||
      form.lastName.trim().length < 2 ||
      !/^\S+@\S+\.\S+$/.test(form.email) ||
      form.password.length < 8
    ) {
      return;
    }

    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email,
        password: form.password,
      });
      navigate('/dashboard');
    } catch {
      // error state is handled in auth context
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-register">
        <h1 className="auth-title">Create Account</h1>

        {authError && <div className="alert alert-error">{authError}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                value={form.firstName}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, firstName: e.target.value }));
                  clearAuthError();
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, firstName: true }))}
                className={nameInvalid(form.firstName, 'firstName') ? 'invalid' : ''}
              />
              {nameInvalid(form.firstName, 'firstName') && (
                <span className="error-msg">First name is required</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={form.lastName}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, lastName: e.target.value }));
                  clearAuthError();
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, lastName: true }))}
                className={nameInvalid(form.lastName, 'lastName') ? 'invalid' : ''}
              />
              {nameInvalid(form.lastName, 'lastName') && (
                <span className="error-msg">Last name is required</span>
              )}
            </div>
          </div>

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
            />
            {passwordInvalid && <span className="error-msg">Min 8 characters required</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/auth/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
