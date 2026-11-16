import { STATUS } from '../lib/plants';

export default function StatusBadge({ status }) {
  const s = STATUS[status] ?? STATUS.draft;
  return <span className={`badge ${s.className}`}>{s.label}</span>;
}
