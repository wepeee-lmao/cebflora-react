import { Link } from 'react-router-dom';
import { CONFIG, ROLE_TABS } from '../adminConfig';
import { db } from '../adminDb';
import { PageState, useLoad } from '../ui';

export default function Roles() {
  const st = useLoad(() => db.users());
  return (<>
    <h1>Manage user roles</h1>
    <p className="sub">Pick a role to see its users. Open a profile to change that user’s role.</p>
    <PageState st={st}>{users => {
      const n = v => users.filter(u => u.role === v).length;
      return (<>
        <div className="grid">{ROLE_TABS.map(t => (
          <Link key={t.value} className="tile" to={`${CONFIG.BASE}/roles/${t.value}`}>
            <h2>{t.label} <span className="n">{n(t.value)}</span></h2><p>View {t.label.toLowerCase()} accounts.</p>
          </Link>))}
        </div>
        <p style={{ color: 'var(--color-text-muted)' }}>{n(CONFIG.ADMIN_ROLE)} administrator account{n(CONFIG.ADMIN_ROLE) === 1 ? '' : 's'} exist. Admin roles cannot be changed from this screen.</p>
      </>);
    }}</PageState>
  </>);
}
