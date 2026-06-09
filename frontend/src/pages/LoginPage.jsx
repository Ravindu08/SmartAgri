import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, saveAuthSession } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
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
      const response = await loginUser(formData);
      saveAuthSession(response);
      navigate(response.redirect_to, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-split">
        {/* Left panel */}
        <div className="auth-split__left">
          <Link className="auth-logo" to="/">
            <span>🌿</span> <strong>Smart</strong>Agri
          </Link>
          <div className="auth-split__illustration">🌾</div>
          <h1 className="auth-split__title">Welcome Back!</h1>
          <p className="auth-split__copy">Login to your SmartAgri account and continue your journey towards smarter farming.</p>
          <div className="auth-who-can">
            <span className="auth-who-can__icon">👥</span>
            <div>
              <div className="auth-who-can__label">Who can register?</div>
              <div className="auth-who-can__roles">Traders and Land Owners can create an account.</div>
            </div>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="auth-split__right">
          <h2 className="auth-form-title">Login to SmartAgri</h2>
          <form className="auth-form-new" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Email Address</span>
              <div className="auth-field__input-wrap">
                <span className="auth-field__icon">📧</span>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
              </div>
            </label>
            <label className="auth-field">
              <span>Password</span>
              <div className="auth-field__input-wrap">
                <span className="auth-field__icon">🔒</span>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Your password" required />
              </div>
            </label>
            {error && <div className="auth-error">⚠️ {error}</div>}
            <button className="auth-submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Login →'}
            </button>
            <div className="auth-links-row">
              <span>Don't have an account? <Link to="/register">Register</Link></span>
              <span>|</span>
              <Link to="/">Back to Home</Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
