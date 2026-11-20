import { Link, useParams } from 'react-router-dom';
import { CONFIG, ROLE_TABS, same } from '../adminConfig';
import { db } from '../adminDb';
import { Badge, Empty, NotFound, PageState, RoleBadge, useLoad } from '../ui';

export default function RoleList() {
  const { role } = useParams();
  const tab = ROLE_TABS.find(t => t.value === role);
  const st = useLoad(async () => {
    const [users, apps] = await Promise.all([db.users(), db.apps()]);
    return { users, apps };
  }, [role]);
  if (!tab) return <NotFound what="role" to={`${CONFIG.BASE}/roles`} />;
  return (
    <PageState st={st}>{({ users, apps }) => {
      const list = users.filter(u => u.role === role);
      return (<>
        <Link className="back" to={`${CONFIG.BASE}/roles`}>Back to roles</Link>
        <h1>{tab.label} accounts</h1>
        <p className="sub">{list.length} user{list.length === 1 ? '' : 's'} with this role.</p>
        <div className="card"><div className="table-wrap">
          {list.length ? (
            <table className="data">
              <thead><tr><th>Profile</th><th>Role</th><th>Curator application</th></tr></thead>
              <tbody>{list.map(u => {
                const a = apps.filter(x => same(x.userId, u.id)).pop();
                return (
                  <tr key={u.id}>
                    <td><Link className="link" to={`${CONFIG.BASE}/users/${encodeURIComponent(u.id)}`}><b>{u.name}</b></Link><br /><span className="muted">{u.email}</span></td>
                    <td><RoleBadge r={u.role} /></td>
                    <td>{a ? <Badge s={a.status} /> : <span className="muted">No application</span>}</td>
                  </tr>);
              })}</tbody>
            </table>) : <Empty>Nobody has this role yet.</Empty>}
        </div></div>
      </>);
    }}</PageState>
  );
}
