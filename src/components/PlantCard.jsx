import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { cap, displayName, photosOf } from '../lib/plants';

export default function PlantCard({ plant, saved, onToggleSave }) {
  const navigate = useNavigate();
  const photo = photosOf(plant)[0]?.url;
  const open = () => navigate(`/plants/${plant.id}`);

  return (
    <article
      className="plant-card"
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter') open(); }}
      style={photo ? { backgroundImage: `url(${photo})` } : undefined}
    >
      <button
        type="button"
        className={`bookmark-btn${saved ? ' saved' : ''}`}
        aria-label={saved ? 'Remove bookmark' : 'Save plant'}
        onClick={(e) => { e.stopPropagation(); onToggleSave(plant.id); }}
      >
        <Bookmark size={14} fill="currentColor" />
      </button>

      <div className="plant-card-info">
        <h3>{displayName(plant)}</h3>
        <em>{plant.scientific_name}</em>
        <ul className="tags">
          <li className="tag">{plant.family}</li>
          <li className="tag">{plant.genus}</li>
          <li className="tag">{cap(plant.ecological_zone)}</li>
        </ul>
      </div>
    </article>
  );
}
