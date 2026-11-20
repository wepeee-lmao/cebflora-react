import { Link, useNavigate, useParams } from 'react-router-dom';
import { CONFIG, SCHEMA, ST, same } from '../adminConfig';
import { db } from '../adminDb';
import { Badge, NotFound, PageState, useAdminUI, useLoad } from '../ui';

export default function RecordDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { confirm, toast } = useAdminUI();
  const st = useLoad(async () => {
    const [recs, users] = await Promise.all([db.records(), db.users()]);
    return { recs, users };
  }, [id]);

  async function act(fn, okMsg, after) {
    try { await fn(); toast(okMsg); after ? after() : st.reload(); }
    catch (e) { toast(e.message || 'Something went wrong. Try again.'); }
  }

  return (
    <PageState st={st}>{({ recs, users }) => {
      const r = recs.find(x => same(x.id, id));
      if (!r) return <NotFound what="plant record" to={`${CONFIG.BASE}/records`} />;
      const p = users.find(u => same(u.id, r.publisher));

      const unpublish = async () => {
        if (!await confirm({ title: 'Unpublish record?', body: 'Students will no longer see it. The curator can publish it again.', okLabel: 'Unpublish' })) return;
        act(() => db.setRecordStatus(r.id, ST.draft), 'Record moved back to draft.');
      };
      const remove = async () => {
        if (!await confirm({ title: 'Delete this record?', body: 'This removes the plant record and cannot be undone.', okLabel: 'Delete record', danger: true })) return;
        act(() => db.deleteRecord(r.id), 'Record deleted.', () => nav(`${CONFIG.BASE}/records`));
      };
      const verify = () => act(() => db.setVerified(r.id, !r.verified), r.verified ? 'Verification removed.' : 'Record marked as verified.');

      return (<>
        <Link className="back" to={`${CONFIG.BASE}/records`}>Back to plant records</Link>
        <h1><em className="sci">{r.sci}</em></h1>
        <p className="sub">{r.local}</p>
        <div className="card">
          <h2>Record details</h2>
          <dl className="kv">
            <dt>Family</dt><dd>{r.family}</dd>
            <dt>Genus</dt><dd>{r.genus}</dd>
            <dt>Local name</dt><dd>{r.local}</dd>
            <dt>Ecological zone</dt><dd>{r.zone}</dd>
            <dt>Status</dt><dd><Badge s={r.status} /></dd>
            <dt>Publisher</dt><dd>{p ? <Link className="link" to={`${CONFIG.BASE}/users/${encodeURIComponent(p.id)}`}>{p.name}</Link> : 'Unknown'}</dd>
          </dl>
          <div className="actions">
            {SCHEMA.records.verified && <button className="abtn abtn-lime" type="button" onClick={verify}>{r.verified ? 'Remove verification' : 'Mark as verified'}</button>}
            {r.status === ST.published && <button className="abtn" type="button" onClick={unpublish}>Unpublish (back to draft)</button>}
            <button className="abtn abtn-danger" type="button" onClick={remove}>Delete record</button>
          </div>
        </div>
      </>);
    }}</PageState>
  );
}
