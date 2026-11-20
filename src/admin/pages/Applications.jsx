import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CONFIG, ST, same } from '../adminConfig';
import { db } from '../adminDb';
import { Badge, Empty, PageState, useLoad } from '../ui';

const TABS = [[ST.pending, 'Pending'], [ST.approved, 'Approved'], [ST.rejected, 'Declined'], ['all', 'All']];

export default function Applications() {
  const [tab, setTab] = useState(ST.pending);
  const st = useLoad(async () => {
    const [apps, users] = await Promise.all([db.apps(), db.users()]);
    return { apps, users };
  });
  return (<>
    <h1>Curator applications</h1>
    <p className="sub">Students apply for curator status with proof documents. Approving gives the user the curator role.</p>
    <PageState st={st}>{({ apps, users }) => {
      const list = apps.filter(a => tab === 'all' || a.status === tab);
      return (<>
        <div className="tabs" role="group" aria-label="Filter applications">
          {TABS.map(([v, l]) => (
            <button key={v} className="tab" type="button" aria-pressed={tab === v} onClick={() => setTab(v)}>
              {l} ({v === 'all' ? apps.length : apps.filter(a => a.status === v).length})
            </button>))}
        </div>
        <div className="card"><div className="table-wrap">
          {list.length ? (
            <table className="data">
              <thead><tr><th>Applicant</th><th>Documents</th><th>Status</th><th></th></tr></thead>
              <tbody>{list.map(a => {
                const u = users.find(x => same(x.id, a.userId)) || { name: 'Unknown user', email: '' };
                const to = `${CONFIG.BASE}/applications/${encodeURIComponent(a.id)}`;
                return (
                  <tr key={a.id}>
                    <td><Link className="link" to={to}><b>{u.name}</b></Link><br /><span className="muted">{u.email}</span>{a.affiliation && <><br /><span className="muted">{a.affiliation}</span></>}</td>
                    <td>{a.docs.length} file{a.docs.length === 1 ? '' : 's'}</td>
                    <td><Badge s={a.status} /></td>
                    <td className="num"><Link className={'abtn' + (a.status === ST.pending ? ' abtn-primary' : '')} to={to}>{a.status === ST.pending ? 'Check application' : 'View'}</Link></td>
                  </tr>);
              })}</tbody>
            </table>) : <Empty>No applications in this list.</Empty>}
        </div></div>
      </>);
    }}</PageState>
  </>);
}
