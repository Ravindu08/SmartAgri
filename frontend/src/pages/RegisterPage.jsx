import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, saveAuthSession } from '../services/api';

const REGISTERABLE_ROLES = [
  { value: 'Trader', label: 'Trader' },
  { value: 'Land Owner', label: 'Land Owner' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'Trader',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await registerUser(formData);
      saveAuthSession(response);
      navigate(response.redirect_to, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page auth-page--register">
      <div className="auth-panel">
        <div className="auth-panel__copy">
          <p className="section__label">Register</p>
          <h1>Create a SmartAgri account</h1>
          <p>
            Only Traders and Land Owners can self-register. Visitors can browse public pages, and
            Admin credentials are predefined.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Your full name"
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </label>

          <label>
            Register as
            <select name="role" value={formData.role} onChange={handleChange}>
              {REGISTERABLE_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>

          {error ? <div className="auth-error">{error}</div> : null}

          <button className="button button--primary button--full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>

          <div className="auth-links">
            <Link to="/login">Already have an account?</Link>
            <Link to="/">Back to home</Link>
          </div>
        </form>
      </div>
    </main>
  );
}