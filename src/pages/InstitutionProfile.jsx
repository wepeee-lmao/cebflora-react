import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; // adjust if your export has another name
import '../styles/institution.css';

const PAGE_SIZE = 48;


const svgUri = (svg) => `data:image/svg+xml,${encodeURIComponent(svg)}`;


const scene = (sky, hillBack, hillFront, w = 800, h = 600) =>
  svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">` +
      `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky}"/><stop offset="1" stop-color="#f4fbff"/></linearGradient></defs>` +
      `<rect width="${w}" height="${h}" fill="url(#s)"/>` +
      `<g fill="#fff"><ellipse cx="${w * 0.2}" cy="${h * 0.2}" rx="${w * 0.09}" ry="${h * 0.05}"/><ellipse cx="${w * 0.62}" cy="${h * 0.16}" rx="${w * 0.1}" ry="${h * 0.06}"/></g>` +
      `<path d="M0 ${h * 0.72} C${w * 0.25} ${h * 0.55} ${w * 0.5} ${h * 0.7} ${w} ${h * 0.6} L${w} ${h} L0 ${h}Z" fill="${hillBack}"/>` +
      `<path d="M0 ${h * 0.82} C${w * 0.3} ${h * 0.7} ${w * 0.6} ${h * 0.9} ${w} ${h * 0.78} L${w} ${h} L0 ${h}Z" fill="${hillFront}"/>` +
      `</svg>`
  );

const DEMO = {
  institution: {
    id: 'demo',
    name: 'University of San Carlos',
    location: 'Cebu City, Philippines',
    short_description:
      'A private Catholic university in Cebu City, administered by the Society of the Divine Word since 1935. It traces its roots to the Colegio de San Ildefonso, founded in 1595, became a university in 1948, and today runs five campuses, the largest of them in Talamban.',
    website: 'https://www.usc.edu.ph',
    logo_url: '', // add the official USC logo URL here; initials show until then
    cover_url: scene('#bfe4ff', '#c8e17f', '#8aa300', 1120, 490), // replace with a campus photo URL
    created_at: '2025-06-01T00:00:00Z',
  },
  plants: [
    { id: 'd1', scientific_name: 'Nypa fruticans', local_name: 'Nipa', family: 'Arecaceae', ecological_zone: 'mangrove', image: scene('#c6e8ff', '#9fcf7a', '#5e8f2d') },
    { id: 'd2', scientific_name: 'Cocos nucifera', local_name: 'Lubi', family: 'Arecaceae', ecological_zone: 'coastal', image: scene('#b8dffc', '#d6e58a', '#9aa63a') },
    { id: 'd3', scientific_name: 'Jasminum sambac', local_name: 'Sampaguita', family: 'Oleaceae', ecological_zone: 'lowland', image: scene('#d4ecff', '#c8e17f', '#7fa31e') },
    { id: 'd4', scientific_name: 'Pterocarpus indicus', local_name: 'Narra', family: 'Fabaceae', ecological_zone: 'lowland', image: scene('#c2e3fb', '#b7d96f', '#6f9a1c') },
    { id: 'd5', scientific_name: 'Rhizophora apiculata', local_name: 'Bakawan', family: 'Rhizophoraceae', ecological_zone: 'mangrove', image: scene('#bfe0f5', '#8fc48a', '#4f8a3c') },
    { id: 'd6', scientific_name: 'Moringa oleifera', local_name: 'Malunggay', family: 'Moringaceae', ecological_zone: 'upland', image: scene('#cfe9ff', '#cfe58f', '#93ad2e') },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const formatMonthYear = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—';

// The website is user-entered, so only allow http(s) links (blocks javascript: URLs)
const safeHttpUrl = (url) => {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : '';
  } catch {
    return '';
  }
};

const SMALL_WORDS = new Set(['of', 'the', 'and', 'de', 'del', 'at', 'for']);

const initialsOf = (name) =>
  name
    .split(/\s+/)
    .filter((w) => w && !SMALL_WORDS.has(w.toLowerCase()))
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function InstitutionProfile() {
  const { id } = useParams();
  // status: 'loading' | 'ready' | 'notfound' | 'error'
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    const isMock = !id || id === 'demo';
    if (isMock) {
      setState({
        status: 'ready',
        institution: DEMO.institution,
        plants: DEMO.plants,
        plantCount: DEMO.plants.length,
      });
      return undefined;
    }

    let cancelled = false;
    setState({ status: 'loading' });

    (async () => {
      const [inst, plants] = await Promise.all([
        // The institution account: a curator/admin profile with an institution name
        supabase
          .from('profiles')
          .select(
            'id, avatar_url, created_at, institution_name, institution_location, institution_description, institution_website, institution_cover_url'
          )
          .eq('id', id)
          .not('institution_name', 'is', null)
          .in('role', ['curator', 'admin'])
          .maybeSingle(),

        // Plants that account has published
        supabase
          .from('plants')
          .select(
            'id, scientific_name, local_name, family, ecological_zone, plant_media(url, media_type)',
            { count: 'exact' }
          )
          .eq('status', 'published')
          .eq('created_by', id)
          .order('created_at', { ascending: false })
          .range(0, PAGE_SIZE - 1),
      ]);

      if (cancelled) return;
      if (inst.error?.code === '22P02' || (!inst.error && !inst.data)) {
        setState({ status: 'notfound' });
        return;
      }
      const failure = inst.error || plants.error;
      if (failure) {
        console.error('Institution page query failed:', failure);
        setState({ status: 'error', message: failure.message });
        return;
      }

      const row = inst.data;
      setState({
        status: 'ready',
        institution: {
          id: row.id,
          name: row.institution_name,
          location: row.institution_location,
          short_description: row.institution_description,
          website: row.institution_website,
          logo_url: row.avatar_url,
          cover_url: row.institution_cover_url,
          created_at: row.created_at,
        },
        plants: (plants.data ?? []).map((p) => ({
          ...p,
          image: p.plant_media?.find((m) => m.media_type === 'image')?.url ?? '',
        })),
        plantCount: plants.count ?? plants.data?.length ?? 0,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const institution = state.status === 'ready' ? state.institution : null;

  return (
    <div className="ip-page">
      {state.status === 'loading' && (
        <p className="ip-state" role="status">Loading institution…</p>
      )}

      {state.status === 'notfound' && (
        <div className="ip-state" role="alert">
          <h1>Institution not found</h1>
          <p>This institution doesn’t exist, or the link is wrong.</p>
          <Link to="/curators" className="ip-outline">Back to Community</Link>
        </div>
      )}

      {state.status === 'error' && (
        <div className="ip-state" role="alert">
          <h1>Couldn’t load this institution</h1>
          <p>{state.message}</p>
          <p className="ip-state-hint">
            If this mentions a missing table or column, run institution-columns.sql in the
            Supabase SQL Editor. If it comes back empty, check the Row Level Security policies.
          </p>
        </div>
      )}

      {state.status === 'ready' && (
        <>
          <div className="ip-grid">
            {/* Left: logo and key facts */}
            <aside className="ip-summary">
              <div className="ip-logo">
                {institution.logo_url ? (
                  <img src={institution.logo_url} alt={`${institution.name} logo`} />
                ) : (
                  <span aria-hidden="true">{initialsOf(institution.name)}</span>
                )}
              </div>

              <h2 className="ip-name">{institution.name}</h2>
              {institution.location && <p className="ip-location">{institution.location}</p>}

              <dl className="ip-stats">
                <div>
                  <dt>Published plants</dt>
                  <dd>{state.plantCount}</dd>
                </div>
                <div>
                  <dt>On CebFlora since</dt>
                  <dd>{formatMonthYear(institution.created_at)}</dd>
                </div>
              </dl>

              {safeHttpUrl(institution.website) && (
                <a
                  className="ip-outline ip-block"
                  href={safeHttpUrl(institution.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit website
                </a>
              )}
            </aside>

            {/* Right: short information and the institution picture */}
            <section className="ip-details" aria-labelledby="ip-title">
              <h1 id="ip-title" className="ip-heading">Institution Profile</h1>

              <div className="ip-card">
                <h2 className="ip-card-title">About the institution</h2>

                <figure className="ip-cover">
                  {institution.cover_url ? (
                    <img src={institution.cover_url} alt={`${institution.name}`} />
                  ) : (
                    <div className="ip-cover-empty">No photo added yet</div>
                  )}
                </figure>

                <p className="ip-about">
                  {institution.short_description || 'This institution has not added a description yet.'}
                </p>
              </div>
            </section>
          </div>

          {/* Bottom: plants published by this institution */}
          <section className="ip-plants" aria-labelledby="ip-plants-title">
            <h2 id="ip-plants-title" className="ip-heading">Plant Catalogue</h2>

            {state.plants.length === 0 ? (
              <p className="ip-empty">No published plants yet.</p>
            ) : (
              <>
                <ul className="ip-plant-grid">
                  {state.plants.map((plant) => (
                    <li key={plant.id}>
                      {/* Opens the plant's information page (the /plants/:id route) */}
                      <Link to={`/plants/${plant.id}`} className="ip-plant">
                        <div className="ip-plant-photo">
                          {plant.image ? (
                            <img src={plant.image} alt="" loading="lazy" />
                          ) : (
                            <span aria-hidden="true">🌿</span>
                          )}
                        </div>
                        <div className="ip-plant-body">
                          <strong>{plant.local_name || plant.scientific_name}</strong>
                          {plant.local_name && <em>{plant.scientific_name}</em>}
                          <span className="ip-tags">
                            <span>{plant.family}</span>
                            <span>{capitalize(plant.ecological_zone)}</span>
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                {state.plantCount > state.plants.length && (
                  <p className="ip-more">
                    Showing {state.plants.length} of {state.plantCount} plants.
                  </p>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}