import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/bookmarks.css';

// Placeholder data shown until real bookmarks are available from the backend.
// Replace with profile.bookmarks (or a fetch) once that exists. Each item:
// { id, localName, scientificName, family, location, imageUrl }
const DEMO_BOOKMARKS = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  localName: 'Local Name',
  scientificName: 'Scientific Name',
  family: 'Family plant',
  location: 'Location',
  imageUrl: '',
}));

export default function MyBookmarkedPlants() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState(profile?.bookmarks ?? DEMO_BOOKMARKS);

  // Local only for now: hook this up to your bookmark API to persist removals.
  const removeBookmark = (id) => setItems((list) => list.filter((p) => p.id !== id));

  return (
    <div className="bm-page">
      <div className="bm-top">
        <button type="button" className="bm-back" onClick={() => navigate('/profile')}>
          ← Back to profile
        </button>
        <h1 className="bm-heading">My Bookmarked Plants</h1>
      </div>

      <p className="bm-count">
        {items.length} {items.length === 1 ? 'specimen' : 'specimens'} bookmarked
      </p>

      {items.length === 0 ? (
        <div className="bm-empty">
          <p>You haven't bookmarked any plants yet.</p>
          <Link to="/dashboard" className="bm-browse">Browse specimens</Link>
        </div>
      ) : (
        <ul className="bm-grid">
          {items.map((p) => (
            <li key={p.id} className="bm-card">
              <Link to={`/plants/${p.id}`} className="bm-link">
                <div className="bm-img">
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.localName} /> : <div className="bm-img-placeholder" />}
                </div>
                <div className="bm-body">
                  <h3>{p.localName}</h3>
                  <p className="bm-sci">{p.scientificName}</p>
                  <div className="bm-tags">
                    <span>{p.family}</span>
                    <span>{p.location}</span>
                  </div>
                </div>
              </Link>
              <button
                type="button"
                className="bm-remove"
                aria-label={`Remove ${p.localName} from bookmarks`}
                title="Remove bookmark"
                onClick={() => removeBookmark(p.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}