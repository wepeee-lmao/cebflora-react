import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Brand from '../components/Brand';
import usePageTitle from '../lib/usePageTitle';
import '../styles/auth.css';

export default function ForgotPassword() {
  usePageTitle('CebFlora — Find Your Account');
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }

    sessionStorage.setItem('pending_verification_email', email.trim());
    sessionStorage.setItem('verification_flow', 'recovery');
    navigate('/verify-email');
  };

  return (
    <div className="auth-page">
      <Link to="/login" className="return-home">Back to Sign In</Link>

      <div className="auth-card">

        <h2 className="verify2">Find your account</h2>
        <p className="verify3">
          Enter your email and we'll send you a 6-digit code.
        </p>

        <form className="otp-loc" onSubmit={handleSubmit}>
          <label htmlFor="fp-email">Email Address</label>
          <input
            type="email" id="fp-email" required placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <p className={`field-error${error ? ' show' : ''}`}>{error}</p>

          <button type="submit" className="btn btn-solid-yellow" disabled={submitting}>
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}