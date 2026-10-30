import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Brand from '../components/Brand';
import usePageTitle from '../lib/usePageTitle';
import '../styles/auth.css';

export default function Login() {
  usePageTitle('CebFlora — Sign In');
  const navigate = useNavigate();

  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
  const [submitting, setSubmitting] = useState(false);

  const [signin, setSignin] = useState({ email: '', password: '', error: '' });
  const [signup, setSignup] = useState({ name: '', email: '', password: '', confirm: '', error: '' });

  const showTab = (e, which) => {
    e?.preventDefault();
    setTab(which);
  };

  // ---- SIGN IN ----
  const handleSignin = async (e) => {
    e.preventDefault();
    setSignin((s) => ({ ...s, error: '' }));
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: signin.email.trim(),
      password: signin.password,
    });

    setSubmitting(false);
    if (error) {
      setSignin((s) => ({ ...s, error: error.message }));
      return;
    }
    navigate('/dashboard');
  };

  // ---- CREATE ACCOUNT ----
  const handleSignup = async (e) => {
    e.preventDefault();
    setSignup((s) => ({ ...s, error: '' }));

    if (signup.password !== signup.confirm) {
      setSignup((s) => ({ ...s, error: "Passwords don't match." }));
      return;
    }

    setSubmitting(true);
    const email = signup.email.trim();

    // Triggers Supabase email verification (if enabled); the handle_new_user()
    // trigger creates the matching row in `profiles` automatically.
    const { data, error } = await supabase.auth.signUp({
      email,
      password: signup.password,
      options: { data: { full_name: signup.name.trim() } },
    });

    setSubmitting(false);
    if (error) {
      setSignup((s) => ({ ...s, error: error.message }));
      return;
    }

    // "Confirm email" ON  -> no session yet, user must verify first
    // "Confirm email" OFF -> session already set, they're logged in now
    if (data.session) {
      navigate('/dashboard');
    } else {
      sessionStorage.setItem('pending_verification_email', email);
      navigate('/verify-email');
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="return-home">&larr; Return to Homepage</Link>

      <div className="auth-card">
        <Brand />

        <div className="auth-tabs">
          <button className={tab === 'signin' ? 'active' : ''} onClick={() => setTab('signin')}>
            Sign In
          </button>
          <button className={tab === 'signup' ? 'active' : ''} onClick={() => setTab('signup')}>
            Create account
          </button>
        </div>

        {tab === 'signin' ? (
          <>
            <form onSubmit={handleSignin}>
              <label htmlFor="signin-email">Email Address</label>
              <input
                type="email" id="signin-email" required placeholder="you@email.com"
                value={signin.email}
                onChange={(e) => setSignin({ ...signin, email: e.target.value })}
              />

              <label htmlFor="signin-password">Password</label>
              <input
                type="password" id="signin-password" required placeholder="••••••••"
                value={signin.password}
                onChange={(e) => setSignin({ ...signin, password: e.target.value })}
              />

              <p className={`field-error${signin.error ? ' show' : ''}`}>{signin.error}</p>

              <button type="submit" className="btn btn-solid-yellow" disabled={submitting}>
                Sign in
              </button>
            </form>
            <p className="form-note">
              <Link to="/forgot-password">Forgot password?</Link><br /><br />
              New to CebFlora? <a href="#" onClick={(e) => showTab(e, 'signup')}>Create one</a>
            </p>
          </>
        ) : (
          <>
            <form onSubmit={handleSignup}>
              <label htmlFor="signup-name">Full Name</label>
              <input
                type="text" id="signup-name" required placeholder="Juan Dela Cruz"
                value={signup.name}
                onChange={(e) => setSignup({ ...signup, name: e.target.value })}
              />

              <label htmlFor="signup-email">Email Address</label>
              <input
                type="email" id="signup-email" required placeholder="you@email.com"
                value={signup.email}
                onChange={(e) => setSignup({ ...signup, email: e.target.value })}
              />

              <label htmlFor="signup-password">Password</label>
              <input
                type="password" id="signup-password" required minLength={8} placeholder="At least 8 characters"
                value={signup.password}
                onChange={(e) => setSignup({ ...signup, password: e.target.value })}
              />

              <label htmlFor="signup-confirm">Confirm Password</label>
              <input
                type="password" id="signup-confirm" required placeholder="Repeat password"
                value={signup.confirm}
                onChange={(e) => setSignup({ ...signup, confirm: e.target.value })}
              />

              <div className="checkbox-row">
                <input type="checkbox" id="signup-terms" required style={{ marginTop: 3 }} />
                <label htmlFor="signup-terms" style={{ margin: 0, fontWeight: 400 }}>
                  I agree to the <a href="#">Terms and Privacy Notice</a>.
                </label>
              </div>

              <p className={`field-error${signup.error ? ' show' : ''}`}>{signup.error}</p>

              <button type="submit" className="btn btn-solid-yellow" disabled={submitting}>
                Create account
              </button>
            </form>
            <p className="form-note">
              Already have an account? <a href="#" onClick={(e) => showTab(e, 'signin')}>Sign in</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
