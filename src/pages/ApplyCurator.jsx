import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import usePageTitle from '../lib/usePageTitle';
import logo from '../assets/icons/ceblogo.png';
import '../styles/apply-curator.css';

const MAX_FILES = 3;
const MAX_SIZE_MB = 5;
const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png'];

const EDUCATION = [
  'High school',
  'Some college',
  "Bachelor's degree",
  "Master's degree",
  'Doctorate',
  'Other',
];

const formatSize = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// Header shared by the form and the confirmation card.
function Brand() {
  return (
    <header className="ac-brand">
      <div className="ac-logo">
        <img src={logo} alt="CebFlora logo" />
      </div>
      <div>
        <p className="ac-brand-name">CebFlora</p>
        <p className="ac-brand-sub">A Cebu-based Local Web Herbarium</p>
      </div>
    </header>
  );
}

function TextField({ id, label, error, textarea = false, wide = false, ...rest }) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div className={`ac-field${wide ? ' ac-wide' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <Tag
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
        {...(textarea ? { rows: 4 } : {})}
        {...rest}
      />
      {error && <span id={`${id}-err`} className="ac-error" role="alert">{error}</span>}
    </div>
  );
}

export default function ApplyCurator() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  usePageTitle('CebFlora — Apply for Curator Status');

  const [form, setForm] = useState({
    firstName: profile?.first_name ?? '',
    lastName: profile?.last_name ?? '',
    birthDate: '',
    sex: '',
    contactNumber: '',
    email: profile?.email ?? '',
    city: '',
    province: '',
    occupation: '',
    organization: profile?.organization ?? '',
    education: '',
    expertise: '',
    reason: '',
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const addFiles = (list) => {
    const incoming = Array.from(list ?? []);
    if (!incoming.length) return;
    let problem = '';
    const next = [...files];
    for (const file of incoming) {
      if (!ACCEPTED.includes(file.type)) {
        problem = `"${file.name}" isn't a PDF, JPG or PNG file.`;
      } else if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        problem = `"${file.name}" is larger than ${MAX_SIZE_MB} MB.`;
      } else if (next.length >= MAX_FILES) {
        problem = `You can upload up to ${MAX_FILES} files.`;
      } else if (!next.some((f) => f.name === file.name && f.size === file.size)) {
        next.push(file);
      }
    }
    setFiles(next);
    setFileError(problem);
    if (fileInput.current) fileInput.current.value = ''; // allow re-picking the same file
  };

  const removeFile = (index) => {
    setFiles((list) => list.filter((_, i) => i !== index));
    setFileError('');
  };

  const validate = () => {
    const e = {};
    const required = {
      firstName: 'Enter your first name.',
      lastName: 'Enter your last name.',
      birthDate: 'Enter your date of birth.',
      sex: 'Select an option.',
      contactNumber: 'Enter a contact number.',
      city: 'Enter your city or municipality.',
      province: 'Enter your province.',
      occupation: 'Enter your occupation.',
      education: 'Select your highest education.',
      expertise: 'Describe your area of expertise.',
      reason: 'Tell us why you want to become a curator.',
    };
    Object.entries(required).forEach(([key, msg]) => {
      if (!String(form[key]).trim()) e[key] = msg;
    });
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (form.birthDate && new Date(form.birthDate) > new Date()) e.birthDate = 'Date of birth can’t be in the future.';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    const noFiles = files.length === 0;
    if (noFiles) setFileError('Upload at least one file as proof.');
    if (Object.keys(e).length || noFiles) {
      // Move focus to the first problem so keyboard and screen-reader users land on it
      const firstId = Object.keys(e)[0];
      (firstId ? document.getElementById(`ac-${firstId}`) : fileInput.current?.parentElement)?.focus?.();
      return;
    }

    setSubmitting(true);
    try {
      // TODO: send the application to your backend. With Supabase this is usually:
      //   1. upload each file to a private storage bucket (e.g. 'curator-documents'):
      //        await supabase.storage.from('curator-documents').upload(`${userId}/${file.name}`, file)
      //   2. insert one row into a 'curator_applications' table with the form values,
      //      the stored file paths and status = 'pending'.
      // Keep the bucket private so only developers/admins can open the documents.
      await new Promise((resolve) => setTimeout(resolve, 600)); // placeholder for the request
      setSubmitted(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      console.error('Curator application failed:', err);
      setFileError('Something went wrong while submitting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------------------------------------------------ Confirmation
  if (submitted) {
    return (
      <main className="ac-page">
        <section className="ac-card ac-done" aria-labelledby="ac-done-title">
          <Brand />

          <div className="ac-check" aria-hidden="true">
            <svg viewBox="0 0 80 80" width="80" height="80">
              <circle cx="40" cy="40" r="37" fill="none" stroke="#7a9660" strokeWidth="4" />
              <path d="M22 41l12 12 25-27" fill="none" stroke="#7a9660" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="ac-eyebrow">Verification received</p>
          <h1 id="ac-done-title" className="ac-title">Your request is being reviewed.</h1>
          <p className="ac-lead">
            Your documents are private. The developers must approve you before you can become a
            Platform Curator and have the rights to create, update, and delete plant records.
          </p>

          <div className="ac-notice" role="status">
            <span className="ac-mail" aria-hidden="true">✉</span>
            <p>
              <strong>You will receive an email notification</strong> at{' '}
              <strong className="ac-email">{form.email.trim()}</strong> once a developer has
              reviewed your documents. This email will let you know whether your verification was{' '}
              <span className="ac-approved">approved</span> or <span className="ac-declined">declined</span>.
            </p>
          </div>

          <ol className="ac-steps" aria-label="Application progress">
            <li className="ac-step">Submitted</li>
            <li className="ac-step ac-step-current" aria-current="step">Staff Review</li>
            <li className="ac-step">Account Updated</li>
          </ol>

          <button type="button" className="ac-primary" onClick={() => navigate('/user-profile')}>
            Return to Profile
          </button>
        </section>
      </main>
    );
  }

  // ------------------------------------------------------------------ Form
  return (
    <main className="ac-page">
      <section className="ac-card" aria-labelledby="ac-title">
        <Brand />

        <p className="ac-eyebrow">Curator application</p>
        <h1 id="ac-title" className="ac-title">Apply for Curator Status</h1>
        <p className="ac-lead">
          Tell us a little about yourself and upload proof of your background. Your documents are
          private and are only seen by the developers reviewing your request.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <fieldset className="ac-group">
            <legend>Personal details</legend>
            <div className="ac-fields">
              <TextField id="ac-firstName" label="First name" value={form.firstName} onChange={set('firstName')} error={errors.firstName} autoComplete="given-name" />
              <TextField id="ac-lastName" label="Last name" value={form.lastName} onChange={set('lastName')} error={errors.lastName} autoComplete="family-name" />
              <TextField id="ac-birthDate" label="Date of birth" type="date" value={form.birthDate} onChange={set('birthDate')} error={errors.birthDate} autoComplete="bday" />
              <div className="ac-field">
                <label htmlFor="ac-sex">Sex</label>
                <select id="ac-sex" value={form.sex} onChange={set('sex')} aria-invalid={Boolean(errors.sex)}>
                  <option value="">Select…</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Prefer not to say</option>
                </select>
                {errors.sex && <span className="ac-error" role="alert">{errors.sex}</span>}
              </div>
              <TextField id="ac-contactNumber" label="Contact number" type="tel" value={form.contactNumber} onChange={set('contactNumber')} error={errors.contactNumber} autoComplete="tel" />
              <TextField id="ac-email" label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
              <TextField id="ac-city" label="City / Municipality" value={form.city} onChange={set('city')} error={errors.city} autoComplete="address-level2" />
              <TextField id="ac-province" label="Province" value={form.province} onChange={set('province')} error={errors.province} autoComplete="address-level1" />
            </div>
          </fieldset>

          <fieldset className="ac-group">
            <legend>Background</legend>
            <div className="ac-fields">
              <TextField id="ac-occupation" label="Occupation" value={form.occupation} onChange={set('occupation')} error={errors.occupation} />
              <TextField id="ac-organization" label="Institution / Organization (optional)" value={form.organization} onChange={set('organization')} />
              <div className="ac-field ac-wide">
                <label htmlFor="ac-education">Highest education</label>
                <select id="ac-education" value={form.education} onChange={set('education')} aria-invalid={Boolean(errors.education)}>
                  <option value="">Select…</option>
                  {EDUCATION.map((e) => <option key={e}>{e}</option>)}
                </select>
                {errors.education && <span className="ac-error" role="alert">{errors.education}</span>}
              </div>
              <TextField id="ac-expertise" label="Area of expertise (e.g. plant taxonomy, ethnobotany)" value={form.expertise} onChange={set('expertise')} error={errors.expertise} wide />
              <TextField id="ac-reason" label="Why do you want to become a curator?" textarea wide value={form.reason} onChange={set('reason')} error={errors.reason} />
            </div>
          </fieldset>

          <fieldset className="ac-group">
            <legend>Proof of qualification</legend>
            <p className="ac-hint">
              Upload a government ID plus a certificate, school or employment letter, or similar
              document. PDF, JPG or PNG, up to {MAX_FILES} files, {MAX_SIZE_MB} MB each.
            </p>

            <label
              className={`ac-drop${dragging ? ' ac-drop-active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
            >
              <span className="ac-drop-icon" aria-hidden="true">⬆</span>
              <span><strong>Choose files</strong> or drag them here</span>
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                multiple
                onChange={(e) => addFiles(e.target.files)}
              />
            </label>

            {files.length > 0 && (
              <ul className="ac-files">
                {files.map((f, i) => (
                  <li key={`${f.name}-${f.size}`}>
                    <span className="ac-file-name">{f.name}</span>
                    <span className="ac-file-size">{formatSize(f.size)}</span>
                    <button type="button" aria-label={`Remove ${f.name}`} onClick={() => removeFile(i)}>✕</button>
                  </li>
                ))}
              </ul>
            )}
            {fileError && <span className="ac-error" role="alert">{fileError}</span>}
          </fieldset>

          <div className="ac-actions">
            <button type="button" className="ac-secondary" onClick={() => navigate('/user-profile')}>
              Cancel
            </button>
            <button type="submit" className="ac-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}