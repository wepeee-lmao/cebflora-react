// Data layer. Components never talk to Supabase directly, only to `db` (SRS 2.5 Information Hiding).
// With no Supabase env vars it runs in DEMO MODE on sample data.
import { supabase as sb } from '../lib/supabaseClient'; // your project's shared client
import { CONFIG, SCHEMA, ST, parseDocs, same } from './adminConfig';

// URL and key come from your .env through src/lib/supabaseClient.js.
const CONNECTED = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

function makeSupabaseDb() {
  const U = SCHEMA.users, A = SCHEMA.apps, R = SCHEMA.records, V = SCHEMA.views;
  const ok = ({ data, error }) => { if (error) throw error; return data; };
  const toUser = r => ({ id: r[U.id], name: r[U.name] || r[U.email] || 'Unnamed user', email: r[U.email] || '', role: r[U.role] });
  const toApp = r => ({ id: r[A.id], userId: r[A.user], docs: parseDocs(r[A.docs]), status: r[A.status],
    affiliation: r[A.affiliation] || '', submittedAt: r[A.submitted] || null });
  // A table that does not exist yet (like curator_profile_views) should show an empty report, not crash.
  const missing = e => e && (e.code === 'PGRST205' || e.code === '42P01' || /schema cache|does not exist/i.test(e.message || ''));
  const toRec = r => ({ id: r[R.id], sci: r[R.sci], family: r[R.family], genus: r[R.genus], local: r[R.local],
    zone: r[R.zone], status: r[R.status], publisher: r[R.publisher], verified: R.verified ? !!r[R.verified] : null });
  return {
    demo: false,
    async me() {
      const { data } = await sb.auth.getSession();
      const s = data.session; if (!s) return null;
      const rows = ok(await sb.from(U.table).select('*').eq(U.id, s.user.id).limit(1));
      return rows.length ? toUser(rows[0]) : { id: s.user.id, name: s.user.email, email: s.user.email, role: null };
    },
    async signOut() { await sb.auth.signOut(); },
    async users() { return ok(await sb.from(U.table).select('*').order(U.name)).map(toUser); },
    async apps() { return ok(await sb.from(A.table).select('*')).map(toApp); },
    async records() { return ok(await sb.from(R.table).select('*').order(R.sci)).map(toRec); },
    async views(from, to) {
      let q = sb.from(V.table).select(`${V.curator},${V.viewer},${V.at}`).range(0, 9999);
      if (from) q = q.gte(V.at, from + 'T00:00:00');
      if (to) q = q.lte(V.at, to + 'T23:59:59');
      const { data, error } = await q;
      if (error) { if (missing(error)) return []; throw error; }
      return data.map(r => ({ curator: r[V.curator], viewer: r[V.viewer], at: r[V.at] }));
    },
    async viewCount(curatorId) {
      const { count, error } = await sb.from(V.table).select('*', { count: 'exact', head: true }).eq(V.curator, curatorId);
      if (error) { if (missing(error)) return 0; throw error; } return count || 0;
    },
    async setAppStatus(id, status) {
      const { data } = await sb.auth.getSession();
      const patch = { [A.status]: status, [A.reviewedBy]: data.session ? data.session.user.id : null, [A.reviewedAt]: new Date().toISOString() };
      ok(await sb.from(A.table).update(patch).eq(A.id, id));
    },
    async setRole(userId, role) {
      const rows = ok(await sb.from(U.table).update({ [U.role]: role }).eq(U.id, userId).select());
      if (!rows.length) throw new Error('The role was not saved. Check the admin policies in supabase-admin.sql.');
    },
    async setRecordStatus(id, status) { ok(await sb.from(R.table).update({ [R.status]: status }).eq(R.id, id)); },
    async setVerified(id, v) { ok(await sb.from(R.table).update({ [R.verified]: v }).eq(R.id, id)); },
    async deleteRecord(id) { ok(await sb.from(R.table).delete().eq(R.id, id)); },
    async docUrl(path) {
      const { data, error } = await sb.storage.from(CONFIG.DOCS_BUCKET).createSignedUrl(path, 120);
      if (error) throw error; return data.signedUrl;
    }
  };
}

function makeDemoDb() {
  const users = [
    { id: 'u1', name: 'Maria Lourdes Cabahug', email: 'mcabahug@example.com', role: 'admin' },
    { id: 'u2', name: 'Jun Rey Alcoseba', email: 'jalcoseba@example.com', role: 'curator' },
    { id: 'u3', name: 'Princess Kiarra Albano', email: 'palbano@example.com', role: 'curator' },
    { id: 'u4', name: 'Elisha Mae Jocdong', email: 'ejocdong@example.com', role: 'user' },
    { id: 'u5', name: 'Tiffany Mae Cobrado', email: 'tcobrado@example.com', role: 'user' },
    { id: 'u6', name: 'Kim Sagayno', email: 'ksagayno@example.com', role: 'user' },
    { id: 'u7', name: 'Rey Villaflor', email: 'rvillaflor@example.com', role: 'user' },
    { id: 'u8', name: 'University of San Carlos (USC)', email: 'usc@example.com', role: 'institution' },
    { id: 'u9', name: 'Paolo Reyes', email: 'preyes@example.com', role: 'user' },
    { id: 'u10', name: 'Liza Ortega', email: 'lortega@example.com', role: 'curator' }
  ];
  const apps = [
    { id: 'a1', userId: 'u4', docs: ['affiliation_letter.pdf', 'government_id.jpg'], status: ST.pending },
    { id: 'a2', userId: 'u5', docs: ['course_certificate.pdf', 'government_id.jpg'], status: ST.pending },
    { id: 'a3', userId: 'u9', docs: ['enrollment_form.pdf', 'government_id.jpg'], status: ST.pending },
    { id: 'a4', userId: 'u7', docs: ['org_letter.pdf'], status: ST.rejected },
    { id: 'a5', userId: 'u2', docs: ['affiliation_letter.pdf', 'government_id.png'], status: ST.approved },
    { id: 'a6', userId: 'u3', docs: ['course_certificate.pdf', 'government_id.png'], status: ST.approved },
    { id: 'a7', userId: 'u10', docs: ['org_proof.pdf', 'government_id.png'], status: ST.approved }
  ];
  apps.forEach((a, i) => { a.affiliation = 'University of San Carlos - Biology Dept'; a.submittedAt = new Date(Date.now() - (i + 2) * 86400000 * 3).toISOString(); });
  const rec = (id, sci, family, genus, local, zone, status, publisher) => ({ id, sci, family, genus, local, zone, status, publisher, verified: null });
  const records = [
    rec('p1', 'Pterocarpus indicus', 'Fabaceae', 'Pterocarpus', 'Narra', 'Lowland forest', ST.published, 'u2'),
    rec('p2', 'Jasminum sambac', 'Oleaceae', 'Jasminum', 'Sampaguita', 'Urban garden', ST.published, 'u3'),
    rec('p3', 'Lagerstroemia speciosa', 'Lythraceae', 'Lagerstroemia', 'Banaba', 'Lowland forest', ST.published, 'u8'),
    rec('p4', 'Vitex negundo', 'Lamiaceae', 'Vitex', 'Lagundi', 'Upland', ST.draft, 'u10'),
    rec('p5', 'Senna alata', 'Fabaceae', 'Senna', 'Akapulko', 'Creek bank', ST.published, 'u8'),
    rec('p6', 'Cananga odorata', 'Annonaceae', 'Cananga', 'Ylang-ylang', 'Lowland forest', ST.draft, 'u3'),
    rec('p7', 'Moringa oleifera', 'Moringaceae', 'Moringa', 'Malunggay', 'Urban garden', ST.published, 'u8'),
    rec('p8', 'Averrhoa bilimbi', 'Oxalidaceae', 'Averrhoa', 'Kamias', 'Urban garden', ST.published, 'u3')
  ];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const viewers = ['u4', 'u5', 'u6', 'u7', 'u8', 'u9'], pool = ['u2', 'u2', 'u2', 'u3', 'u3', 'u10'];
  const views = Array.from({ length: 140 }, (_, i) => ({
    curator: pool[Math.floor(rnd() * pool.length)], viewer: viewers[Math.floor(rnd() * viewers.length)],
    at: new Date(Date.now() - i * 0.3 * 86400000).toISOString()
  }));
  const wait = v => new Promise(r => setTimeout(() => r(v), 120));
  const clone = a => a.map(x => ({ ...x }));
  return {
    demo: true,
    me: () => wait({ ...users[0] }),
    signOut: () => wait(),
    users: () => wait(clone(users)),
    apps: () => wait(apps.map(a => ({ ...a, docs: [...a.docs] }))),
    records: () => wait(clone(records)),
    views: (from, to) => wait(views.filter(v => (!from || v.at.slice(0, 10) >= from) && (!to || v.at.slice(0, 10) <= to))),
    viewCount: id => wait(views.filter(v => same(v.curator, id)).length),
    setAppStatus: (id, s) => { apps.find(a => same(a.id, id)).status = s; return wait(); },
    setRole: (id, r) => { users.find(u => same(u.id, id)).role = r; return wait(); },
    setRecordStatus: (id, s) => { records.find(r => same(r.id, id)).status = s; return wait(); },
    setVerified: (id, v) => { records.find(r => same(r.id, id)).verified = v; return wait(); },
    deleteRecord: id => { records.splice(records.findIndex(r => same(r.id, id)), 1); return wait(); },
    docUrl: () => Promise.reject(new Error('Documents can be downloaded once Supabase is connected.'))
  };
}

export const db = CONNECTED ? makeSupabaseDb() : makeDemoDb();
