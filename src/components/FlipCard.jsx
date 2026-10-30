import { useState } from 'react';

export default function FlipCard({ className, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`loc ${className}${open ? ' is-open' : ''}`}
      onClick={() => setOpen((o) => !o)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
    </div>
  );
}
