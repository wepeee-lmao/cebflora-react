import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import useBookmarks from '../lib/useBookmarks';
import StatusBadge from '../components/StatusBadge';
import { cap, displayName, isWebUrl, linksOf, monthYear, photosOf } from '../lib/plants';

function Section({ title, children }) {
  return (
    <>
      <h4 className="label">{title}</h4>
      <p className={children ? undefined : 'empty-text'}>{children || 'Not provided yet.'}</p>
    </>
  );
}

function Fact({ label, value }) {
  return (
    <div className="fact">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  );
}

export default function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { ids: savedIds, toggle } = useBookmarks();

  const [plant, setPlant] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | missing | error
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    setActive(0);

    supabase.from('plants')
      .select('*, plant_media(*), verifier:profiles!plants_verified_by_fkey(full_name)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error(error); setState('error'); return; }
        if (!data) { setState('missing'); return; }
        setPlant(data);
        setState('ready');
        // remember it for "Continue where you left off"
        // (a Supabase query only runs once it is awaited or .then()'d)
        supabase.from('plant_views')
          .upsert(
            { user_id: profile.id, plant_id: id, viewed_at: new Date().toISOString() },
            { onConflict: 'user_id,plant_id' },
          )
          .then(({ error: viewError }) => { if (viewError) console.error(viewError); });
      });

    return () => { cancelled = true; };
  }, [id, profile.id]);

  if (state === 'loading') return <p className="muted-note">Loading…</p>;

  if (state !== 'ready') {
    return (
      <>
        <button type="button" className="circle-btn" aria-label="Go back" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <p className="muted-note" style={{ marginTop: 24 }}>
          {state === 'missing'
            ? 'This plant could not be found, or it has not been published yet.'
            : 'Something went wrong loading this plant. If you just updated the project, run sql/002_plants_update.sql in Supabase.'}
        </p>
      </>
    );
  }

  const photos = photosOf(plant);
  const mainPhoto = photos[Math.min(active, photos.length - 1)];
  const thumbs = photos.map((p, i) => ({ ...p, i })).filter((p) => p.i !== active);
  const links = linksOf(plant);

  const isOwner = plant.created_by === profile.id;
  const canEdit = isOwner || profile.role === 'admin';

  return (
    <>
      <div className="detail-bar">
        <button type="button" className="circle-btn" aria-label="Go back" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>

        <div className="detail-bar-right">
          {plant.status !== 'published' && <StatusBadge status={plant.status} />}
          {canEdit ? (
            <button type="button" className="pill-btn" onClick={() => navigate(`/manage/${plant.id}/edit`)}>
              Edit Mode
            </button>
          ) : (
            <button
              type="button"
              className={`bookmark-btn large${savedIds.has(plant.id) ? ' saved' : ''}`}
              aria-label={savedIds.has(plant.id) ? 'Remove bookmark' : 'Save plant'}
              onClick={() => toggle(plant.id)}
            >
              <Bookmark size={20} fill="currentColor" />
            </button>
          )}
        </div>
      </div>

      <div className="detail">
        {/* ---------- left column ---------- */}
        <div className="col-left">
          <h1>{displayName(plant)}</h1>
          <p className="sci">{plant.scientific_name}</p>
          <Section title="Habitat">{plant.habitat}</Section>
          <Section title="Source collection">{plant.source_collection}</Section>
          <Section title="Local uses">{plant.local_uses}</Section>
        </div>

        {/* ---------- center column ---------- */}
        <div className="col-center">
          <div className={`gallery-main${mainPhoto ? '' : ' empty'}`}>
            {mainPhoto && <img src={mainPhoto.url} alt={displayName(plant)} />}
          </div>

          {thumbs.length > 0 && (
            <div className="gallery-thumbs">
              {thumbs.map((t) => (
                <button key={t.id ?? t.url} type="button" className="thumb" onClick={() => setActive(t.i)}>
                  <img src={t.url} alt={`${displayName(plant)} photo ${t.i + 1}`} />
                </button>
              ))}
            </div>
          )}
          {photos.length > 0 && <p className="caption">Herbarium reference photos</p>}

          <div className="info-pair">
            <div className="info-card"><span>Ecological zone</span><strong>{cap(plant.ecological_zone)}</strong></div>
            <div className="info-card"><span>Conservation status</span><strong>{plant.conservation_status || 'Not evaluated'}</strong></div>
          </div>

          {links.length > 0 && (
            <>
              <p className="sub-label">Additional information</p>
              <ul className="links-box">
                {links.map((l, i) => (
                  <li key={l.id ?? l.url}>
                    [{i + 1}]{' '}
                    {isWebUrl(l.url)
                      ? <a href={l.url} target="_blank" rel="noopener noreferrer">{l.caption || l.url}</a>
                      : (l.caption || l.url)}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="meta-row">
            <Fact label="Collected" value={monthYear(plant.collected_on)} />
            <Fact label="Verified by" value={plant.verifier?.full_name} />
            <Fact label="Source" value={plant.source} />
          </div>
        </div>

        {/* ---------- right column ---------- */}
        <div className="col-right">
          <Section title="Description">{plant.description}</Section>
          <Section title="Identifying features">{plant.identifying_features}</Section>

          <h4 className="label">Taxonomy</h4>
          <div className="tax-grid">
            <Fact label="Domain" value={plant.domain} />
            <Fact label="Kingdom" value={plant.kingdom} />
            <Fact label="Phylum" value={plant.phylum} />
            <Fact label="Class" value={plant.class_name} />
            <Fact label="Order" value={plant.order_name} />
            <Fact label="Family" value={plant.family} />
            <Fact label="Genus" value={plant.genus} />
            <Fact label="Species" value={plant.species} />
          </div>
        </div>
      </div>
    </>
  );
}
