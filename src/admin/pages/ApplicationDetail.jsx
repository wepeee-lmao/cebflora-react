import { Link, useParams } from 'react-router-dom';
import { CONFIG, ST, STATUS_LABEL, fmtDate, same } from '../adminConfig';
import { db } from '../adminDb';
import { Badge, Empty, NotFound, PageState, RoleBadge, useAdminUI, useLoad } from '../ui';

export default function ApplicationDetail() {
  const { id } = useParams();
  const { confirm, toast } = useAdminUI();
  const st = useLoad(async () => {
    const [apps, users] = await Promise.all([db.apps(), db.users()]);
    return { apps, users };
  }, [id]);

  async function act(fn, okMsg) {
    try { await fn(); toast(okMsg); st.reload(); }
    catch (e) { toast(e.message || 'Something went wrong. Try again.'); }
  }
  async function download(path) {
    try { window.open(await db.docUrl(path), '_blank', 'noopener'); }
    catch (e) { toast(e.message || 'Could not open that document.'); }
  }

  return (
    <PageState st={st}>{({ apps, users }) => {
      const a = apps.find(x => same(x.id, id));
      if (!a) return <NotFound what="application" to={`${CONFIG.BASE}/applications`} />;
      const u = users.find(x => same(x.id, a.userId)) || { id: a.userId, name: 'Unknown user', email: '', role: null };

      const approve = async () => {
        if (!await confirm({ title: 'Approve application?', body: 'The applicant will become a platform curator and can publish plant records.', okLabel: 'Approve' })) return;
        act(async () => { await db.setAppStatus(a.id, ST.approved); await db.setRole(a.userId, 'curator'); }, 'Application approved. The user is now a curator.');
      };
      const reject = async () => {
        if (!await confirm({ title: 'Decline application?', body: 'The applicant keeps their current role and can apply again later.', okLabel: 'Decline', danger: true })) return;
        act(() => db.setAppStatus(a.id, ST.rejected), 'Application declined.');
      };

      return (<>
        <Link className="back" to={`${CONFIG.BASE}/applications`}>Back to applications</Link>
        <h1>{u.name}</h1>
        <p className="sub">Check the documents below before you decide.</p>
        <div className="card">
          <h2>Applicant</h2>
          <dl className="kv">
            <dt>Email</dt><dd>{u.email}</dd>
            <dt>Current role</dt><dd><RoleBadge r={u.role} /></dd>
            <dt>Application</dt><dd><Badge s={a.status} /></dd>
            <dt>Affiliation</dt><dd>{a.affiliation || '—'}</dd>
            <dt>Submitted</dt><dd>{a.submittedAt ? fmtDate(a.submittedAt) : '—'}</dd>
            <dt>Profile</dt><dd><Link className="link" to={`${CONFIG.BASE}/users/${encodeURIComponent(u.id)}`}>Open profile</Link></dd>
          </dl>
        </div>
        <div className="card">
          <h2>Proof documents</h2>
          {a.docs.length ? (
            <ul className="docs">{a.docs.map(d => (
              <li key={d}><span>{d.split('/').pop()}</span><button className="abtn" type="button" onClick={() => download(d)}>Download</button></li>
            ))}</ul>) : <Empty>No documents were attached.</Empty>}
          {a.status === ST.pending ? (
            <div className="actions">
              <button className="abtn abtn-primary" type="button" onClick={approve}>Approve application</button>
              <button className="abtn abtn-danger" type="button" onClick={reject}>Decline application</button>
            </div>
          ) : <p className="muted" style={{ marginTop: 14 }}>This application was already {(STATUS_LABEL[a.status] || a.status).toLowerCase()}.</p>}
        </div>
      </>);
    }}</PageState>
  );
}
