import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { profile } = useAuth();

  return (
    <>
      <h2>
        Welcome back{profile.full_name ? `, ${profile.full_name}` : ''} 🌿
      </h2>
      <p style={{ color: 'var(--color-text-muted)' }}>
        This is your CebFlora dashboard. Your bookmarked plants, recent quiz scores,
        and curator status (if applicable) will appear here.
      </p>

      {/* FR-04 / UR-08: "become a curator" CTA for regular users only */}
      {profile.role === 'user' && (
        <Link
          to="/apply-curator"
          className="btn btn-primary"
          style={{ marginTop: 16, display: 'inline-block' }}
        >
          Apply to become a Curator
        </Link>
      )}
    </>
  );
}
