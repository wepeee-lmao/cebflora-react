import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CONFIG, ST, same } from '../adminConfig';
import { db } from '../adminDb';
import { Badge, Empty, PageState, useLoad } from '../ui';

const TABS = [['all', 'All'], [ST.published, 'Published'], [ST.draft, 'Drafts']];

export default function Records() {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const st = useLoad(async () => {
    const [recs, users] = await Promise.all([db.records(), db.users()]);
    return { recs, users };
  });
  return (<>
    <h1>Plant records</h1>
    <p className="sub">Check curator submissions. You can unpublish or remove records that break the data rules.</p>
    <div className="filters">
      <div className="tabs" role="group" aria-label="Filter records" style={{ margin: 0 }}>
        {TABS.map(([v, l]) => <button key={v} className="tab" type="button" aria-pressed={tab === v} onClick={() => setTab(v)}>{l}</button>)}
      </div>
      <div className="card" style={{ margin: 0, padding: '8px 12px' }}>
        <label htmlFor="rq" className="muted" style={{ margin: 0 }}>Search name or family</label>
        <input id="rq" type="search" value={q} onChange={e => setQ(e.target.value)} />
      </div>
    </div>
    <PageState st={st}>{({ recs, users }) => {
      const needle = q.trim().toLowerCase();
      const list = recs.filter(r => (tab === 'all' || r.status === tab) &&
        (!needle || [r.sci, r.local, r.family, r.genus].some(v => String(v || '').toLowerCase().includes(needle))));
      return (
        <div className="card"><div className="table-wrap">
          {list.length ? (
            <table className="data">
              <thead><tr><th>Scientific / local name</th><th>Family</th><th>Ecological zone</th><th>Publisher</th><th>Status</th></tr></thead>
              <tbody>{list.map(r => {
                const p = users.find(u => same(u.id, r.publisher));
                return (
                  <tr key={r.id}>
                    <td><Link className="link" to={`${CONFIG.BASE}/records/${encodeURIComponent(r.id)}`}><em className="sci">{r.sci}</em></Link><br /><span className="muted">{r.local}</span></td>
                    <td>{r.family}</td><td>{r.zone}</td><td>{p ? p.name : 'Unknown'}</td>
                    <td><Badge s={r.status} />{r.verified && <> <Badge s="Verified" cls="approved" /></>}</td>
                  </tr>);
              })}</tbody>
            </table>) : <Empty>No plant records match.</Empty>}
        </div></div>
      );
    }}</PageState>
  </>);
}
