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
    <main className="auth-page">
      <div className="auth-split">
        <div className="auth-split__left">
          <Link className="auth-logo" to="/">
            <span>🌿</span> <strong>Smart</strong>Agri
          </Link>
          <div className="auth-split__illustration">🤝</div>
          <h1 className="auth-split__title">Join SmartAgri Today!</h1>
          <p className="auth-split__copy">Create your account and unlock powerful tools, insights, and opportunities to grow better, together.</p>
          <div className="auth-who-can">
            <span className="auth-who-can__icon">👥</span>
            <div>
              <div className="auth-who-can__label">Who can register?</div>
              <div className="auth-who-can__roles">Traders and Land Owners can create an account.</div>
            </div>
          </div>
        </div>
        <div className="auth-split__right">
          <h2 className="auth-form-title">Create Your Account</h2>
          <form className="auth-form-new" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Full Name</span>
              <div className="auth-field__input-wrap">
                <span className="auth-field__icon">👤</span>
                <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Enter your full name" required />
              </div>
            </label>
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
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="At least 8 characters" minLength={8} required />
              </div>
            </label>
            <label className="auth-field">
              <span>Register as</span>
              <select name="role" value={formData.role} onChange={handleChange}>
                {REGISTERABLE_ROLES.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
            </label>
            {error && <div className="auth-error">⚠️ {error}</div>}
            <button className="auth-submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Register →'}
            </button>
            <div className="auth-links-row">
              <span>Already have an account? <Link to="/login">Login</Link></span>
              <span>|</span>
              <Link to="/">Back to Home</Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
