import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CONFIG, isoDay, same } from '../adminConfig';
import { db } from '../adminDb';
import { Empty, PageState, useAdminUI, useLoad } from '../ui';

const defaultRange = () => ({ from: isoDay(new Date(Date.now() - 29 * 86400000)), to: isoDay(new Date()) });

export default function Report() {
  const { toast } = useAdminUI();
  const [range, setRange] = useState(defaultRange);   // applied range
  const [draft, setDraft] = useState(range);          // what the date inputs show
  const st = useLoad(async () => {
    const [views, users] = await Promise.all([db.views(range.from, range.to), db.users()]);
    const by = {};
    views.forEach(v => { const o = by[v.curator] || (by[v.curator] = { id: v.curator, n: 0, uniq: new Set() }); o.n++; o.uniq.add(v.viewer); });
    const rows = Object.values(by).sort((a, b) => b.n - a.n).map((r, i) => {
      const u = users.find(x => same(x.id, r.id));
      return { rank: i + 1, id: r.id, name: u ? u.name : 'Unknown', known: !!u, views: r.n, unique: r.uniq.size };
    });
    return { rows, max: rows.length ? rows[0].views : 1 };
  }, [range.from, range.to]);

  const show = () => {
    if (!draft.from || !draft.to) return toast('Pick both dates.');
    if (draft.from > draft.to) return toast('The start date must be before the end date.');
    setRange(draft);
  };
  const exportCsv = rows => {
    const q = v => `"${String(v).replace(/"/g, '""')}"`;
    const csv = ['Rank,Curator,Views,Unique viewers', ...rows.map(r => [r.rank, q(r.name), r.views, r.unique].join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `curator-views-${range.from}-to-${range.to}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  return (<>
    <h1>Curator views report</h1>
    <p className="sub">Most viewed curator profiles in the date range you choose.</p>
    <div className="card">
      <div className="filters">
        <div><label htmlFor="df">From</label><input id="df" type="date" value={draft.from} onChange={e => setDraft({ ...draft, from: e.target.value })} /></div>
        <div><label htmlFor="dt">To</label><input id="dt" type="date" value={draft.to} onChange={e => setDraft({ ...draft, to: e.target.value })} /></div>
        <button className="abtn abtn-primary" type="button" onClick={show}>Show report</button>
        <button className="abtn" type="button" disabled={!st.data || !st.data.rows.length} onClick={() => exportCsv(st.data.rows)}>Download CSV</button>
      </div>
      <PageState st={st}>{({ rows, max }) => rows.length ? (
        <div className="table-wrap"><table className="data">
          <thead><tr><th>Rank</th><th>Curator</th><th className="num">Views</th><th className="num">Unique viewers</th><th></th></tr></thead>
          <tbody>{rows.map(r => (
            <tr key={r.id}>
              <td>{r.rank}</td>
              <td>{r.known ? <Link className="link" to={`${CONFIG.BASE}/users/${encodeURIComponent(r.id)}`}>{r.name}</Link> : 'Unknown'}</td>
              <td className="num">{r.views}</td><td className="num">{r.unique}</td>
              <td style={{ width: '30%' }}><div className="bar" role="img" aria-label={`${r.views} views`}><i style={{ width: Math.round(r.views / max * 100) + '%' }} /></div></td>
            </tr>))}
          </tbody></table></div>
      ) : <Empty>No profile views in this date range. Try a wider range.</Empty>}</PageState>
    </div>
  </>);
}
