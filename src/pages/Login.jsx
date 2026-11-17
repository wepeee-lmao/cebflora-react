import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Brand from '../components/Brand';
import usePageTitle from '../lib/usePageTitle';
import '../styles/style.css';
import '../styles/auth.css';

// letters (any language), spaces, . ' -   e.g. "Mary Ann", "Dela Cruz", "O'Neil"
const NAME_RE = /^[\p{L}][\p{L}\s.'-]*$/u;

export default function Login() {
  usePageTitle('CebFlora — Sign In');
  const navigate = useNavigate();

  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
  const [submitting, setSubmitting] = useState(false);

  const [signin, setSignin] = useState({ email: '', password: '', error: '' });
  const [signup, setSignup] = useState({
    first: '', last: '', email: '', password: '', confirm: '', error: '', codeSent: false,
  });

  const [agree, setagree] = useState(false);
  const [show, setshow] = useState(false);

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
    setSignup((s) => ({ ...s, error: '', codeSent: false }));

    const first = signup.first.trim();
    const last = signup.last.trim();

    if (!NAME_RE.test(first)) {
      setSignup((s) => ({ ...s, error: 'Invalid first name.' }));
      return;
    }
    if (!NAME_RE.test(last)) {
      setSignup((s) => ({ ...s, error: 'Invalid last name.' }));
      return;
    }
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
      options: {
        data: {
          full_name: `${first} ${last}`,   // what the profiles table uses today
          first_name: first,
          last_name: last,
        },
      },
    });

    setSubmitting(false);

    if (error) {
      // Supabase only allows one signup email per address every 60 seconds.
      // That means a code was ALREADY sent, so point the user to the code page.
      const cooldown =
        error.status === 429 ||
        error.code === 'over_email_send_rate_limit' ||
        /after \d+ seconds/i.test(error.message);

      if (cooldown) {
        sessionStorage.setItem('pending_verification_email', email);
        setSignup((s) => ({
          ...s,
          codeSent: true,
          error: 'A code was already sent to this email. Check your inbox, or wait a minute before trying again.',
        }));
        return;
      }

      setSignup((s) => ({ ...s, error: error.message }));
      return;
    }

    // Email already has an account: Supabase returns a "user" with no identities
    if (data.user && data.user.identities?.length === 0) {
      setSignup((s) => ({ ...s, error: 'This email is already registered. Try signing in.' }));
      return;
    }

    // "Confirm email" ON  -> no session yet, user must verify first
    // "Confirm email" OFF -> session already set, they're logged in now
    if (data.session) {
      navigate('/dashboard');
    } else {
      sessionStorage.setItem('pending_verification_email', email);
      sessionStorage.setItem('verification_flow', 'signup');
      navigate('/verify-email');   // <- this line was missing
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="return-home"> Return to Homepage</Link>

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
        <div className={`auth-form auth-form--${tab}`} key={tab}>
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
              Forgot password? <Link to="/forgot-password">  Click Here</Link>
            </p>
          </>
        ) : (
          <>
            <form onSubmit={handleSignup}>
              <div className="name-row">
                <div>
                  <label htmlFor="signup-first">First Name</label>
                  <input
                    type="text" id="signup-first" required placeholder="Juan"
                    value={signup.first}
                    onChange={(e) => setSignup({ ...signup, first: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="signup-last">Last Name</label>
                  <input
                    type="text" id="signup-last" required placeholder="Dela Cruz"
                    value={signup.last}
                    onChange={(e) => setSignup({ ...signup, last: e.target.value })}
                  />
                </div>
              </div>

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
                <input type="checkbox" required style={{ marginTop: 3 }} checked={agree} onChange={(e) => setagree(e.target.checked)} />
                <label style={{ margin: 0, fontWeight: 400 }}>
                  I agree to the{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); setshow(true); }}>Terms and Privacy Notice</a>.
                </label>
              </div>

              <div className={`popup${show ? ' open-popup' : ''}`}>
                <h2> CebFlora Terms & Conditions</h2>
                <h3>Members must provide accurate information,
                  respect the work of curators, and use plant records for learning, research, and conservation only.
                  Collecting or harming protected species based on information from the platform is strictly prohibited.
                  ------update later</h3>
                <button type="button" onClick={() => { setagree(true); setshow(false); }}> I agree </button>
              </div>

              <p className={`field-error${signup.error ? ' show' : ''}`}>{signup.error}</p>
              {signup.codeSent && (
                <p className="form-note"><Link to="/verify-email">I already have a code</Link></p>
              )}

              <button type="submit" className="btn btn-solid-yellow" disabled={submitting}>
                Create account
              </button>
            </form>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
