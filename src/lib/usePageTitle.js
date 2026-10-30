import { useEffect } from 'react';

// Replaces the per-file <title> tags from the old HTML pages.
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
