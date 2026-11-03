// Stand-in for the pages the README lists as "not built yet".
// Replace each route's element in App.jsx as you build the real page.
export default function ComingSoon({ title }) {
  return (
    <>
      <h2>{title}</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>This page hasn't been built yet.</p>
    </>
  );
}
