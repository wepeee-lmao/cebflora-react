import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Brand from '../components/Brand';
import usePageTitle from '../lib/usePageTitle';
import '../styles/auth.css';

export default function ResetPassword() {
  usePageTitle('CebFlora — New Password');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 style={{ position: 'relative', fontFamily: 'var(--font-mont)', fontWeight: '800', bottom: '25px', color: 'var(--color-accent-yellow)' }}>Choose a new password</h2>
        <p style={{ position: 'relative', fontFamily: 'var(--font-mont)', fontWeight: '500', bottom: '35px', color: 'var(--color-text-muted)' , fontSize: '0.9rem' }}>Make sure your new password is different from your previous passwords.</p>
        <form onSubmit={handleSubmit}  style={{ position: 'relative', fontFamily: 'var(--font-mont)', fontWeight: '500', bottom: '15px' }}>
          <label htmlFor="rp-pass">New Password</label>
          <input
            type="password" id="rp-pass" required minLength={8} placeholder="At least 8 characters"
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
          <label htmlFor="rp-confirm">Confirm Password</label>
          <input
            type="password" id="rp-confirm" required placeholder="Repeat password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
          />
          <p className={`field-error${error ? ' show' : ''}`}>{error}</p>
          <button type="submit" className="btn btn-solid-yellow" disabled={submitting}>
            Save password
          </button>
        </form>
      </div>
    </div>
  );
}