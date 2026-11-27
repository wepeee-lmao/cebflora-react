import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient'; // adjust if your export has another name
import '../styles/profile.css';

const AVATAR_BUCKET = 'avatars';
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

// First and last name. Accounts made before the first_name / last_name columns
// existed only have full_name, so split that instead.
function nameParts(row) {
  if (row.first_name || row.last_name) {
    return { first: row.first_name ?? '', last: row.last_name ?? '' };
  }
  const words = (row.full_name ?? '').trim().split(/\s+/).filter(Boolean);
  return { first: words[0] ?? '', last: words.slice(1).join(' ') };
}

// Database row -> what the form shows
function toForm(row) {
  const { first, last } = nameParts(row);
  return {
    firstName: first,
    lastName: last,
    organization: row.organization ?? '',
    about: row.about ?? '',
  };
}

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

function Field({ id, label, value, onChange, disabled, textarea = false, wide = false, maxLength }) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div className={`ps-field${wide ? ' ps-wide' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <Tag
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        {...(textarea ? { rows: 3 } : { type: 'text' })}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Profile() {
  const { logOut } = useAuth();
  const navigate = useNavigate();

  // Loading the profile from the database
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0); // bump to load again
  const [userId, setUserId] = useState(null);
  const [row, setRow] = useState(null); // the profile as saved in the database
  const [form, setForm] = useState(null); // what is typed in the form

  // Editing and the photo
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState(null); // { kind: 'ok' | 'error', text }
  const fileInput = useRef(null);

  // How many published plants this user has bookmarked (null = loading or failed)
  const [bookmarkCount, setBookmarkCount] = useState(null);

  // Deleting the account
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Load the signed-in user's profile
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) {
        if (cancelled) return;
        setLoadError('You are not signed in.');
        setStatus('error');
        return;
      }

      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        if (error) console.error('Could not load profile:', error);
        setLoadError(error?.message ?? 'No profile was found for this account.');
        setStatus('error');
        return;
      }

      setUserId(uid);
      setRow(data);
      setForm(toForm(data));
      setStatus('ready');
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Count this user's bookmarks, published plants only (same rule as the bookmarks page)
  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    supabase
      .from('bookmarks')
      .select('plant_id, plants!inner(status)', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('plants.status', 'published')
      .then(({ count, error }) => {
        if (cancelled) return;
        if (error) console.error('Could not count bookmarks:', error);
        setBookmarkCount(error ? null : count ?? 0);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Escape closes the delete dialog (but not while it is deleting)
  useEffect(() => {
    if (!confirmOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && !deleting && setConfirmOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmOpen, deleting]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const startEdit = () => {
    setNotice(null);
    setEditing(true);
  };
  const cancelEdit = () => {
    setForm(toForm(row));
    setNotice(null);
    setEditing(false);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const first = form.firstName.trim();
    const last = form.lastName.trim();
    if (!first) {
      setNotice({ kind: 'error', text: 'Please enter your first name.' });
      return;
    }

    setSaving(true);
    setNotice(null);
    // Only send columns this database has, so the page works before every
    // column from profile-database.sql has been added.
    const payload = { full_name: `${first} ${last}`.trim() }; // the rest of the app reads full_name
    if ('first_name' in row) {
      payload.first_name = first;
      payload.last_name = last || null;
    }
    if ('organization' in row && 'about' in row) {
      payload.organization = form.organization.trim() || null;
      payload.about = form.about.trim() || null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();
    setSaving(false);

    if (error) {
      console.error('Could not save profile:', error);
      const hint = /column/i.test(error.message) ? ' Run profile-database.sql in the Supabase SQL Editor first.' : '';
      setNotice({ kind: 'error', text: `Could not save your changes. ${error.message}.${hint}` });
      return;
    }
    setRow(data);
    setForm(toForm(data));
    setEditing(false);
    setNotice({ kind: 'ok', text: 'Your changes were saved.' });
  };

  // Upload a new profile photo to Storage and save its address on the profile
  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // so choosing the same file again still triggers this
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotice({ kind: 'error', text: 'Please choose an image file.' });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setNotice({ kind: 'error', text: 'That image is too large. Please choose one under 2 MB.' });
      return;
    }

    setUploading(true);
    setNotice(null);
    const path = `${userId}/avatar`; // one file per user, replaced each time
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
    if (uploadError) {
      setUploading(false);
      console.error('Photo upload failed:', uploadError);
      setNotice({
        kind: 'error',
        text: /bucket not found/i.test(uploadError.message)
          ? 'Profile photos aren’t set up yet: create a public “avatars” bucket in Supabase Storage (see profile-database.sql).'
          : `Could not upload the photo. ${uploadError.message}`,
      });
      return;
    }

    // ?v= makes browsers fetch the new picture instead of showing the old cached one
    const { data: pub } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const url = `${pub.publicUrl}?v=${Date.now()}`;
    const { error: saveError } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
    setUploading(false);

    if (saveError) {
      console.error('Could not save photo address:', saveError);
      setNotice({ kind: 'error', text: `The photo uploaded but could not be saved. ${saveError.message}` });
      return;
    }
    setRow((r) => ({ ...r, avatar_url: url }));
    setNotice({ kind: 'ok', text: 'Profile photo updated.' });
  };

  const handleLogOut = async () => {
    await logOut();
    navigate('/login');
  };

  const openDelete = () => {
    setConfirmText('');
    setDeleteError('');
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');

    const { error } = await supabase.rpc('delete_my_account');
    if (error) {
      setDeleting(false);
      console.error('Could not delete account:', error);
      let text = `Could not delete your account. ${error.message}`;
      if (error.message.includes('OWNS_CONTENT')) {
        text = 'This account still owns plants or plant photos, so it can’t be deleted yet. Ask an admin to remove or reassign them first.';
      } else if (/delete_my_account|schema cache|could not find the function/i.test(error.message)) {
        text = 'Deleting accounts isn’t set up yet: run the delete_my_account part of profile-database.sql in the Supabase SQL Editor.';
      }
      setDeleteError(text);
      return;
    }

    // The account is gone. Remove the photo file and end the session; neither
    // must stop us from leaving the page.
    try {
      await supabase.storage.from(AVATAR_BUCKET).remove([`${userId}/avatar`]);
    } catch {
      /* nothing to do */
    }
    try {
      await logOut();
    } catch {
      /* the user no longer exists, so signing out can complain; ignore */
    }
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      /* ignore */
    }
    navigate('/', { replace: true });
  };

  if (status !== 'ready') {
    return (
      <div className="ps-page">
        {status === 'loading' ? (
          <p className="ps-state" role="status">Loading your profile…</p>
        ) : (
          <div className="ps-state" role="alert">
            <h1>Couldn’t load your profile</h1>
            <p>{loadError}</p>
            <button type="button" className="ps-outline" onClick={() => setAttempt((n) => n + 1)}>
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  // Shown on the left; these come from what is saved, so they don't change while typing
  const saved = toForm(row);
  const fullName = `${saved.firstName} ${saved.lastName}`.trim() || row.email || 'Your name';
  const initials =
    `${saved.firstName[0] ?? ''}${saved.lastName[0] ?? ''}`.toUpperCase() ||
    (row.email?.[0] ?? '?').toUpperCase();
  const role = capitalize(row.role);
  const memberSince = row.created_at
    ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';
  const hasPhoto = row.avatar_url?.startsWith('http');
  const isVerified = Boolean(row.is_verified);
  const canDelete = confirmText.trim().toUpperCase() === 'DELETE';
  // Organization and About need two columns on profiles; hide them until they exist
  const hasDetails = 'organization' in row && 'about' in row;

  return (
    <div className="ps-page">
      <div className="ps-grid">
        {/* Left: profile summary */}
        <aside className="ps-summary">
          <div className="ps-avatar-wrap">
            <div className="ps-avatar">
              {hasPhoto ? <img src={row.avatar_url} alt={`${fullName} profile`} /> : <span>{initials}</span>}
            </div>
            <button
              type="button"
              className="ps-camera"
              aria-label="Change profile photo"
              title="Change profile photo"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
            >
              <Icon d={ICON.camera} size={18} />
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={handlePhoto}
            />
          </div>
          {uploading && <p className="ps-org" role="status">Uploading photo…</p>}

          <h2 className="ps-name">{fullName}</h2>
          <p className="ps-role">{role}</p>
          {saved.organization && <p className="ps-org">{saved.organization}</p>}

          <dl className="ps-stats">
            <div>
              <dt>Member since</dt>
              <dd>{memberSince}</dd>
            </div>
            <div>
              <dt><Link to="/my-bookmarked-plants">Bookmarked species</Link></dt>
              <dd>{bookmarkCount ?? '—'}</dd>
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
                  <button type="button" className="ps-outline" onClick={cancelEdit} disabled={saving}>Cancel</button>
                  <button type="submit" className="ps-outline ps-filled" disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              ) : (
                <button type="button" className="ps-outline" onClick={startEdit}>Edit details</button>
              )}
            </div>

            {notice && (
              <p className={`ps-notice ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
                {notice.text}
              </p>
            )}

            <div className="ps-fields">
              <Field id="ps-first" label="First name" value={form.firstName} onChange={set('firstName')} disabled={!editing} maxLength={60} />
              <Field id="ps-last" label="Last name" value={form.lastName} onChange={set('lastName')} disabled={!editing} maxLength={60} />
              {/* Email stays read-only: changing it normally needs a verification step */}
              <Field id="ps-email" label="Email" value={row.email ?? ''} onChange={() => {}} disabled wide />
              {hasDetails ? (
                <>
                  <Field id="ps-org" label="Organization (optional)" value={form.organization} onChange={set('organization')} disabled={!editing} wide maxLength={120} />
                  <Field id="ps-about" label="About you" value={form.about} onChange={set('about')} disabled={!editing} textarea wide maxLength={500} />
                </>
              ) : (
                import.meta.env.DEV && (
                  <p className="ps-notice ps-wide">
                    Organization and About are hidden: add text columns named organization and about to the
                    profiles table to show them. (This note only appears while developing.)
                  </p>
                )
              )}
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
          <div className="ps-security-row">
            <div>
              <h3 className="ps-danger-title">Delete Account</h3>
              <p>Permanently deletes your profile, bookmarks and curator applications. This can’t be undone.</p>
            </div>
            <button type="button" className="ps-outline ps-danger" onClick={openDelete}>Delete account</button>
          </div>
        </div>
      </section>

      {/* Confirm deleting the account */}
      {confirmOpen && (
        <div className="ps-overlay" onClick={() => !deleting && setConfirmOpen(false)}>
          <div
            className="ps-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ps-del-title"
            aria-describedby="ps-del-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="ps-del-title">Delete your account?</h2>
            <p id="ps-del-desc">
              This permanently deletes your profile, bookmarks and curator applications, and signs you out.
              It can’t be undone.
            </p>
            <label htmlFor="ps-del-confirm">Type <strong>DELETE</strong> to confirm</label>
            <input
              id="ps-del-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              autoFocus
              disabled={deleting}
            />
            {deleteError && <p className="ps-notice error" role="alert">{deleteError}</p>}
            <div className="ps-btn-row">
              <button type="button" className="ps-outline" onClick={() => setConfirmOpen(false)} disabled={deleting}>
                Cancel
              </button>
              <button
                type="button"
                className="ps-outline ps-danger-solid"
                onClick={handleDelete}
                disabled={!canDelete || deleting}
              >
                {deleting ? 'Deleting…' : 'Delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}