import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cap, displayName, photosOf } from '../lib/plants';

export default function SpecimenOfTheDay({ items }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  if (items.length === 0) {
    return (
      <section className="specimen">
        <div className="specimen-tab">Specimens of the day</div>
        <div className="specimen-card empty-card">No published plants yet. Check back soon.</div>
      </section>
    );
  }

  const s = items[Math.min(index, items.length - 1)];
  const photo = photosOf(s)[0]?.url;

  return (
    <section className="specimen">
      <div className="specimen-tab">Specimens of the day</div>

      {/* key={s.id} replays the slide-in each time you switch */}
      <article
        className="specimen-card clickable"
        key={s.id}
        role="link"
        tabIndex={0}
        onClick={() => navigate(`/plants/${s.id}`)}
        onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/plants/${s.id}`); }}
      >
        <div className={`specimen-photo${photo ? '' : ' empty'}`}>
          {photo && <img src={photo} alt={displayName(s)} />}
        </div>

        <div className="specimen-info">
          <h2>
            <span className="local-name">{displayName(s)}</span>
            <span className="bar">|</span>
            <em className="sci-name">{s.scientific_name}</em>
          </h2>
          <p>{s.description || 'No description yet.'}</p>
          <ul className="tags">
            <li className="tag">{s.family}</li>
            <li className="tag">{s.genus}</li>
            <li className="tag">{cap(s.ecological_zone)}</li>
          </ul>
        </div>
      </article>

      {items.length > 1 && (
        <div className="dots">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={i === index ? 'active' : ''}
              aria-label={`Show ${displayName(item)}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
