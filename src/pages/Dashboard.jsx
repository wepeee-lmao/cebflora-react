import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import useBookmarks from '../lib/useBookmarks';
import PlantCard from '../components/PlantCard';
import SpecimenOfTheDay from '../components/SpecimenOfTheDay';
import { CARD_FIELDS, SPECIMEN_FIELDS } from '../lib/plants';

const PAGE_SIZE = 8; // cards per page in "Continue where you left off"

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { ids: savedIds, toggle } = useBookmarks();

  const [specimens, setSpecimens] = useState([]);
  const [recents, setRecents] = useState([]);
  const [saved, setSaved] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 1) the two specimens of the day (same two for everyone, all day)
      const picks = await supabase.rpc('specimens_of_the_day');
      if (picks.error) throw picks.error;
      const pickIds = (picks.data ?? []).map((p) => p.id);

      // 2) their details + the user's recent views and bookmarks, in parallel
      const [spec, rec, sav] = await Promise.all([
        pickIds.length
          ? supabase.from('plants').select(SPECIMEN_FIELDS).in('id', pickIds)
          : Promise.resolve({ data: [] }),
        supabase.from('plant_views')
          .select(`viewed_at, plants(${CARD_FIELDS})`)
          .eq('user_id', profile.id)
          .order('viewed_at', { ascending: false })
          .limit(PAGE_SIZE * 3),
        supabase.from('bookmarks')
          .select(`created_at, plants(${CARD_FIELDS})`)
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(4),
      ]);
      for (const r of [spec, rec, sav]) if (r.error) throw r.error;

      if (cancelled) return;
      setSpecimens(pickIds.map((id) => spec.data.find((p) => p.id === id)).filter(Boolean));
      setRecents((rec.data ?? []).map((r) => r.plants).filter(Boolean));
      setSaved((sav.data ?? []).map((r) => r.plants).filter(Boolean));
    }

    load()
      .catch((e) => !cancelled && setError(e.message || 'Something went wrong loading your dashboard.'))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [profile.id]);

  const pageCount = Math.ceil(recents.length / PAGE_SIZE);
  const visibleRecents = recents.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      <h1 className="welcome">Welcome back, {profile.full_name || 'Anonymous'}</h1>

      {error && (
        <p className="error-banner">
          Could not load everything: {error}. If this mentions a missing function or column,
          run <code>sql/002_plants_update.sql</code> in Supabase.
        </p>
      )}

      <SpecimenOfTheDay items={specimens} />

      <div className="section-head">
        <h2 className="section-title">Continue where you left off</h2>
      </div>
      {loading ? (
        <p className="muted-note">Loading…</p>
      ) : recents.length === 0 ? (
        <p className="muted-note">Plants you open will show up here so you can pick up where you stopped.</p>
      ) : (
        <>
          <div className="plant-grid">
            {visibleRecents.map((p) => (
              <PlantCard key={p.id} plant={p} saved={savedIds.has(p.id)} onToggleSave={toggle} />
            ))}
          </div>
          {pageCount > 1 && (
            <div className="dots">
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={i === page ? 'active' : ''}
                  aria-label={`Page ${i + 1}`}
                  onClick={() => setPage(i)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="section-head">
        <h2 className="section-title">Saved plants</h2>
        <button type="button" className="circle-btn" aria-label="See all saved plants" onClick={() => navigate('/saved')}>
          <ArrowRight size={22} />
        </button>
      </div>
      {loading ? null : saved.length === 0 ? (
        <p className="muted-note">Tap the bookmark on any plant to keep it here.</p>
      ) : (
        <div className="plant-grid">
          {saved.map((p) => (
            <PlantCard key={p.id} plant={p} saved={savedIds.has(p.id)} onToggleSave={toggle} />
          ))}
        </div>
      )}

    </>
  );
}
