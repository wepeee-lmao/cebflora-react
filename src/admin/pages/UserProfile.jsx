import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CONFIG, ROLE_TABS, ST, roleLabel, same } from '../adminConfig';
import { db } from '../adminDb';
import { Badge, Empty, NotFound, PageState, RoleBadge, useAdminUI, useLoad } from '../ui';

export default function UserProfile() {
  const { id } = useParams();
  const st = useLoad(async () => {
    const [users, apps, recs] = await Promise.all([db.users(), db.apps(), db.records()]);
    const u = users.find(x => same(x.id, id));
    const vc = u && u.role === 'curator' ? await db.viewCount(u.id) : 0;
    return { u, users, apps, recs, vc };
  }, [id]);
  return (
    <PageState st={st}>{({ u, users, apps, recs, vc }) =>
      u ? <Profile key={u.id + u.role} {...{ u, users, apps, recs, vc }} reload={st.reload} />
        : <NotFound what="user" to={`${CONFIG.BASE}/roles`} />}
    </PageState>
  );
}

function Profile({ u, users, apps, recs, vc, reload }) {
  const { confirm, toast } = useAdminUI();
  const [role, setRole] = useState(u.role);
  const locked = u.role === CONFIG.ADMIN_ROLE;
  const app = apps.filter(x => same(x.userId, u.id)).pop();
  const tab = ROLE_TABS.find(t => t.value === u.role);
  const mine = recs.filter(r => same(r.publisher, u.id));

  // changeRole rules (SRS 2.3): admins only, and curator needs an approved application.
  async function change() {
    if (role === u.role) return toast('That is already this user’s role.');
    if (role === 'curator' && !apps.some(a => same(a.userId, u.id) && a.status === ST.approved))
      return toast('Approve this user’s curator application first.');
    if (role === 'institution' && users.filter(x => x.role === 'institution' && !same(x.id, u.id)).length >= CONFIG.MAX_INSTITUTIONS)
      return toast('CebFlora already has its institution account (USC).');
    if (!await confirm({ title: 'Change role?', body: `${u.name} will become ${roleLabel(role)}.`, okLabel: 'Update role' })) return;
    try { await db.setRole(u.id, role); toast(`Role updated to ${roleLabel(role)}`); reload(); }
    catch (e) { toast(e.message || 'Could not update the role.'); }
  }

  return (<>
    <Link className="back" to={tab ? `${CONFIG.BASE}/roles/${tab.value}` : `${CONFIG.BASE}/roles`}>{tab ? `Back to ${tab.label} list` : 'Back to roles'}</Link>
    <h1>{u.name}</h1>
    <p className="sub">{u.email}</p>
    <div className="card">
      <h2>Account</h2>
      <dl className="kv">
        <dt>Role</dt><dd><RoleBadge r={u.role} /></dd>
        <dt>Curator application</dt>
        <dd>{app ? <><Badge s={app.status} /> <Link className="link" to={`${CONFIG.BASE}/applications/${encodeURIComponent(app.id)}`}>Open application</Link></> : 'None'}</dd>
      </dl>
      {locked ? <p className="muted" style={{ marginTop: 14 }}>Admin roles cannot be changed from this screen.</p> : (<>
        <div className="filters" style={{ margin: '16px 0 0' }}>
          <div>
            <label htmlFor="newrole">Change role to</label>
            <select id="newrole" value={role} onChange={e => setRole(e.target.value)}>
              {ROLE_TABS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <button className="abtn abtn-primary" type="button" onClick={change}>Update role</button>
        </div>
        <p className="muted" style={{ marginTop: 10, fontSize: '.85rem' }}>A user becomes a curator only after an admin approves their application.</p>
      </>)}
    </div>
    {(u.role === 'curator' || u.role === 'institution') && (
      <div className="card">
        <h2>{u.role === 'institution' ? 'Plant records' : 'Contributions'} ({mine.length}){u.role === 'curator' && <> · {vc} profile view{vc === 1 ? '' : 's'}</>}</h2>
        {mine.length ? (
          <div className="table-wrap"><table className="data">
            <thead><tr><th>Plant</th><th>Family</th><th>Status</th></tr></thead>
            <tbody>{mine.map(r => (
              <tr key={r.id}>
                <td><Link className="link" to={`${CONFIG.BASE}/records/${encodeURIComponent(r.id)}`}><em className="sci">{r.sci}</em></Link></td>
                <td>{r.family}</td><td><Badge s={r.status} /></td>
              </tr>))}
            </tbody></table></div>) : <Empty>No records yet.</Empty>}
      </div>)}
  </>);
}
