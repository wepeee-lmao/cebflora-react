import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { cap, displayName, timeAgo } from '../lib/plants';

const ACTIVITY_TEXT = {
  pending:   (n) => `Submitted ${n}, awaiting verification`,
  draft:     (n) => `Saved a draft for ${n}`,
  published: (n) => `Published ${n}`,
};

export default function ManagePlants() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.from('plants')
      .select('id, local_name, scientific_name, family, ecological_zone, status, updated_at')
      .eq('created_by', profile.id)
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else setPlants(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [profile.id]);

  const count = (s) => plants.filter((p) => p.status === s).length;

  const confirmDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from('plants').delete().eq('id', toDelete.id);
    setDeleting(false);
    if (error) {
      setError(error.message);
    } else {
      setPlants((list) => list.filter((p) => p.id !== toDelete.id));
    }
    setToDelete(null);
  };

  const firstName = (profile.full_name || 'Your').split(' ')[0];

  return (
    <>
      <div className="manage-head">
        <div>
          <h1 className="page-heading">{profile.full_name ? `${firstName}’s` : 'Your'} Plant Entries</h1>
          <p className="page-sub">Create, edit, and delete plant records you've added to CebFlora.</p>
        </div>
        <Link to="/manage/new" className="pill-btn">
          <Plus size={20} /> Add new record
        </Link>
      </div>

      {state?.notice && <p className="notice-banner">{state.notice}</p>}
      {error && <p className="error-banner">{error}</p>}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Specimen</th><th>Family</th><th>Zone</th><th>Status</th><th>Last edited</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="table-empty">Loading…</td></tr>
            )}
            {!loading && plants.length === 0 && (
              <tr><td colSpan={6} className="table-empty">
                No entries yet. Choose “Add new record” to create your first one.
              </td></tr>
            )}
            {plants.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link className="specimen-link" to={`/plants/${p.id}`} state={{ from: 'manage' }}>
                    {displayName(p)}
                  </Link>
                </td>
                <td>{p.family}</td>
                <td>{cap(p.ecological_zone)}</td>
                <td><StatusBadge status={p.status} /></td>
                <td>{timeAgo(p.updated_at)}</td>
                <td className="row-actions">
                  <button type="button" className="row-btn" onClick={() => navigate(`/manage/${p.id}/edit`)}>Edit</button>
                  <button type="button" className="row-btn danger" onClick={() => setToDelete(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="activity-head">
        <h2 className="section-title">My activity</h2>
        <div className="activity-stats">
          <span><b>{plants.length}</b> Total entries</span>
          <span><b>{count('published')}</b> Published</span>
          <span><b>{count('draft')}</b> Drafts</span>
          <span><b>{count('pending')}</b> Awaiting verification</span>
        </div>
      </div>
      <ul className="activity-list">
        {plants.length === 0 && <li>Your recent activity will appear here.</li>}
        {plants.slice(0, 5).map((p) => (
          <li key={p.id}>
            {(ACTIVITY_TEXT[p.status] ?? ACTIVITY_TEXT.draft)(displayName(p))} · {timeAgo(p.updated_at)}
          </li>
        ))}
      </ul>

      {toDelete && (
        <ConfirmDialog
          title="Delete this record?"
          message={`“${displayName(toDelete)}” and its photos and links will be removed. This cannot be undone.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}
