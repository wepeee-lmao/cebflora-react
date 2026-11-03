import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Brand from '../components/Brand';
import usePageTitle from '../lib/usePageTitle';
import '../styles/auth.css';


export default function VerifyEmail() {
  usePageTitle('CebFlora — Verify Email');
  const navigate = useNavigate();

  const email = sessionStorage.getItem('pending_verification_email');
  const flow = sessionStorage.getItem('verification_flow');  

  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('No email is waiting for verification. Please create an account first.');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: token.trim(),
      type: flow === 'recovery' ? 'recovery' : 'signup',        
    });
    
    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    sessionStorage.removeItem('pending_verification_email');
    sessionStorage.removeItem('verification_flow');        
    navigate(flow === 'recovery' ? '/reset-password' : '/dashboard');
  };

  return (
    <div className="auth-page">
      <Link to="/" className="return-home">Return to Homepage</Link>

      <div className="auth-card">
        <Brand />
    
        <p className="verify1">
          SECURE MEMBER ACCESS
        </p>
        <h2 className="verify2">Verify your email</h2>
        <p className="verify3">
          We sent a 6-digit code to <span>{email || 'your email'}</span>. This code expires in 10 minutes.
        </p>

        <form onSubmit={handleSubmit}>
          
        <div className="otp-loc">
          <label htmlFor="otp-input">6-digit verification code</label>
          <input
            type="text" id="otp-input" className="otp-input"
            maxLength={6} inputMode="numeric" placeholder="000000" required
            value={token}

            onChange={(e) => setToken(e.target.value)}
          />
          
          </div>
          <p className={`field-error${error ? ' show' : ''}`}>{error}</p>

          <button type="submit" className="btn btn-solid-yellow" disabled={submitting}>
            Verify and continue
          </button>
        </form>

        <p className="form-note">
          <Link to={flow === 'recovery' ? '/forgot-password' : '/login'}>Change email or restart</Link>
        </p>
      </div>
    </div>
  );
}
