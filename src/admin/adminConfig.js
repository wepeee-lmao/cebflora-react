// Everything you may need to change lives in this file.

export const CONFIG = {
  BASE: '/admin',            // path where <AdminApp /> is mounted
  LOGIN_PATH: '/login',      // where signed-out users are sent
  DOCS_BUCKET: 'curator-proofs', // private Storage bucket with curator proof documents
  ADMIN_ROLE: 'admin',
  MAX_INSTITUTIONS: 1        // CebFlora has one institution: University of San Carlos (USC)
};

// Matches your Supabase tables (sql/schema). Change here if a name ever changes.
export const SCHEMA = {
  users:   { table: 'profiles', id: 'id', name: 'full_name', email: 'email', role: 'role' },
  apps:    { table: 'curator_applications', id: 'id', user: 'user_id', docs: 'proof_file_path', status: 'status',
             affiliation: 'affiliation', submitted: 'submitted_at', reviewedBy: 'reviewed_by', reviewedAt: 'reviewed_at' },
  records: { table: 'plants', id: 'id', sci: 'scientific_name', family: 'family', genus: 'genus',
             local: 'local_name', zone: 'ecological_zone', status: 'status', publisher: 'created_by',
             verified: null /* set to a boolean column name to enable the Verify button */ },
  views:   { table: 'curator_profile_views', curator: 'curator_id', viewer: 'viewer_id', at: 'viewed_at' }
};

// Values stored in your database.
export const ST = { pending: 'pending', approved: 'approved', rejected: 'declined', draft: 'draft', published: 'published' };

export const ROLE_TABS = [
  { value: 'user', label: 'Student' },
  { value: 'curator', label: 'Curator' },
  { value: 'institution', label: 'Institution' }
];

const ROLE_LABEL = { user: 'Student', viewer: 'Student', curator: 'Curator', institution: 'Institution', admin: 'Admin' };
export const roleLabel = r => ROLE_LABEL[r] || r || 'No role';
export const STATUS_LABEL = { pending: 'Pending', approved: 'Approved', declined: 'Declined', rejected: 'Declined', draft: 'Draft', published: 'Published', Draft: 'Draft', Published: 'Published' };

export const same = (a, b) => String(a) === String(b);
export const fmtDate = d => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
export const isoDay = d => d.toISOString().slice(0, 10);

export function parseDocs(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (!v) return [];
  try { const j = JSON.parse(v); if (Array.isArray(j)) return j.filter(Boolean); } catch (e) { /* plain text */ }
  return String(v).split(/[,\n;]+/).map(s => s.trim()).filter(Boolean);
}
