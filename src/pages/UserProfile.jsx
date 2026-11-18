import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/profile.css';


const DEMO = {
  firstName: 'Jane',
  lastName: 'Doe',
  username: 'janedoe123',
  email: 'janedoe123@sample.org',
  organization: 'Cebu Flora Club',
  about: 'Biology student of Silliman University.',
  role: 'Student',
  memberSince: 'June 2025',
  bookmarkCount: 34,
};


function Icon({ d, size = 22, strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const ICON = {
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
};

function Field({ id, label, value, onChange, disabled, textarea = false, wide = false }) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div className={`ps-field${wide ? ' ps-wide' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <Tag
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        {...(textarea ? { rows: 3 } : { type: 'text' })}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Profile() {
  const { profile, logOut } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: profile?.first_name ?? DEMO.firstName,
    lastName: profile?.last_name ?? DEMO.lastName,
    username: profile?.username ?? DEMO.username,
    email: profile?.email ?? DEMO.email,
    organization: profile?.organization ?? DEMO.organization,
    about: profile?.about ?? DEMO.about,
  });
  const snapshot = useRef(form); // values to restore if the user cancels
  const [photoUrl, setPhotoUrl] = useState('');
  const fileInput = useRef(null);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const fullName = `${form.firstName} ${form.lastName}`.trim() || 'Your name';
  const initials =
    `${form.firstName[0] ?? ''}${form.lastName[0] ?? ''}`.toUpperCase() ||
    (form.email[0] ?? '?').toUpperCase();
  const role = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : DEMO.role;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : DEMO.memberSince;
  const bookmarkCount = profile?.bookmark_count ?? DEMO.bookmarkCount;
  
  const isVerified = Boolean(profile?.is_verified);

  
  useEffect(() => () => photoUrl && URL.revokeObjectURL(photoUrl), [photoUrl]);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) setPhotoUrl(URL.createObjectURL(file));
    
  };

  const startEdit = () => {
    snapshot.current = form;
    setEditing(true);
  };
  const cancelEdit = () => {
    setForm(snapshot.current);
    setEditing(false);
  };
  const saveEdit = (e) => {
    e.preventDefault();
    
    setEditing(false);
  };

  const handleLogOut = async () => {
    await logOut();
    navigate('/login');
  };

  return (
    <div className="ps-page">
      <div className="ps-grid">
        {/* Left: profile summary */}
        <aside className="ps-summary">
          <div className="ps-avatar-wrap">
            <div className="ps-avatar">
              {photoUrl ? <img src={photoUrl} alt={`${fullName} profile`} /> : <span>{initials}</span>}
            </div>
            <button
              type="button"
              className="ps-camera"
              aria-label="Change profile photo"
              title="Change profile photo"
              onClick={() => fileInput.current?.click()}
            >
              <Icon d={ICON.camera} size={18} />
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={handlePhoto}
            />
          </div>

          <h2 className="ps-name">{fullName}</h2>
          <p className="ps-role">{role}</p>
          <p className="ps-org">{form.organization}</p>

          <dl className="ps-stats">
            <div>
              <dt>Member since</dt>
              <dd>{memberSince}</dd>
            </div>
            <div>
              <dt><Link to="/my-bookmarked-plants">Bookmarked species</Link></dt>
              <dd>{bookmarkCount}</dd>
            </div>
          </dl>

          <button type="button" className="ps-bookmarks" onClick={() => navigate('/my-bookmarked-plants')}>
            Bookmarked Plants
          </button>

          <button type="button" className="ps-apply" onClick={() => navigate('/apply-curator')}>
            Apply For Curator Status
          </button>

          {isVerified && (
            <div className="ps-verified" aria-label="Verified account">
              <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="11" fill="currentColor" />
                <path d={ICON.check} fill="none" stroke="var(--color-bg-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Verified
            </div>
          )}
        </aside>

        {/* Right: account details */}
        <section className="ps-details" aria-labelledby="ps-title">
          <h1 id="ps-title" className="ps-heading">Account Profile</h1>

          <form className="ps-card" onSubmit={saveEdit}>
            <div className="ps-card-head">
              <h2>Account details</h2>
              {editing ? (
                <div className="ps-btn-row">
                  <button type="button" className="ps-outline" onClick={cancelEdit}>Cancel</button>
                  <button type="submit" className="ps-outline ps-filled">Save</button>
                </div>
              ) : (
                <button type="button" className="ps-outline" onClick={startEdit}>Edit details</button>
              )}
            </div>

            <div className="ps-fields">
              <Field id="ps-first" label="First name" value={form.firstName} onChange={set('firstName')} disabled={!editing} />
              <Field id="ps-last" label="Last name" value={form.lastName} onChange={set('lastName')} disabled={!editing} />
              <Field id="ps-user" label="Username" value={form.username} onChange={set('username')} disabled={!editing} />
              {/* Email stays read-only: changing it normally needs a verification step */}
              <Field id="ps-email" label="Email" value={form.email} onChange={set('email')} disabled />
              <Field id="ps-org" label="Organization (optional)" value={form.organization} onChange={set('organization')} disabled={!editing} wide />
              <Field id="ps-about" label="About you" value={form.about} onChange={set('about')} disabled={!editing} textarea wide />
            </div>
          </form>
        </section>
      </div>

      {/* Security: bottom of the scroll */}
      <section className="ps-security" aria-labelledby="ps-security-title">
        <h2 id="ps-security-title" className="ps-heading">Security</h2>
        <div className="ps-card ps-security-card">
          <div className="ps-security-row">
            <div>
              <h3>Change Password</h3>
              <p>Make sure your new password is different from your previous passwords.</p>
            </div>
            {/* Sends a reset email via your existing forgot-password flow */}
            <button type="button" className="ps-outline" onClick={() => navigate('/forgot-password')}>
              Change Password
            </button>
          </div>
          <div className="ps-security-row">
            <div>
              <h3>Logout</h3>
              <p>End Session.</p>
            </div>
            <button type="button" className="ps-outline" onClick={handleLogOut}>Logout</button>
          </div>
        </div>
      </section>
    </div>
  );
}