import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import useBookmarks from '../lib/useBookmarks';
import PlantCard from '../components/PlantCard';
import { CARD_FIELDS } from '../lib/plants';

export default function SavedPlants() {
  const { profile } = useAuth();
  const { ids: savedIds, toggle } = useBookmarks();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    supabase.from('bookmarks')
      .select(`created_at, plants(${CARD_FIELDS})`)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else setPlants((data ?? []).map((r) => r.plants).filter(Boolean));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [profile.id]);

  return (
    <>
      <h1 className="page-heading">Saved plants</h1>
      <p className="page-sub">Everything you've bookmarked.</p>

      {error && <p className="error-banner">{error}</p>}
      {loading ? (
        <p className="muted-note" style={{ marginTop: 24 }}>Loading…</p>
      ) : plants.length === 0 ? (
        <p className="muted-note" style={{ marginTop: 24 }}>Nothing saved yet. Tap the bookmark on any plant to add it.</p>
      ) : (
        <div className="plant-grid" style={{ marginTop: 28 }}>
          {plants.map((p) => (
            <PlantCard key={p.id} plant={p} saved={savedIds.has(p.id)} onToggleSave={toggle} />
          ))}
        </div>
      )}
    </>
  );
}
