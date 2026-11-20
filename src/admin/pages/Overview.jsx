import { Link } from 'react-router-dom';
import { CONFIG, ST } from '../adminConfig';
import { db } from '../adminDb';
import { PageState, useLoad } from '../ui';

export default function Overview() {
  const st = useLoad(async () => {
    const [apps, recs, users] = await Promise.all([db.apps(), db.records(), db.users()]);
    return { apps, recs, users };
  });
  return (
    <PageState st={st}>{({ apps, recs, users }) => {
      const pending = apps.filter(a => a.status === ST.pending).length;
      const drafts = recs.filter(r => r.status === ST.draft).length;
      const curators = users.filter(u => u.role === 'curator').length;
      return (<>
        <h1>Welcome back</h1>
        <p className="sub">Review curator applications, check plant records, manage roles and see which curators get the most views.</p>
        <div className="grid">
          <div className="card stat"><b>{pending}</b><span>Applications waiting for review</span></div>
          <div className="card stat"><b>{recs.length}</b><span>Plant records ({drafts} still drafts)</span></div>
          <div className="card stat"><b>{users.length}</b><span>Registered users</span></div>
          <div className="card stat"><b>{curators}</b><span>Platform curators</span></div>
        </div>
        <div className="grid">
          <Link className="tile" to={`${CONFIG.BASE}/applications`}><h2>Curator applications {pending > 0 && <span className="n">{pending}</span>}</h2><p>Open an application, download proof documents, then approve or reject.</p></Link>
          <Link className="tile" to={`${CONFIG.BASE}/records`}><h2>Review plant records</h2><p>Check records submitted by curators and unpublish or remove problem entries.</p></Link>
          <Link className="tile" to={`${CONFIG.BASE}/roles`}><h2>Manage user roles</h2><p>See students, curators and the institution, and update a user’s role.</p></Link>
          <Link className="tile" to={`${CONFIG.BASE}/report`}><h2>Curator views report</h2><p>Most viewed curator profiles for any date range.</p></Link>
        </div>
      </>);
    }}</PageState>
  );
}
