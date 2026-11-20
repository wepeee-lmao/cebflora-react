import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from '../context/AuthContext';

// Keeps a Set of the plant ids the signed-in user has bookmarked,
// and a toggle() that updates the screen first, then the database.
export default function useBookmarks() {
  const { session } = useAuth();
  const uid = session?.user?.id;
  const [ids, setIds] = useState(() => new Set());

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    supabase.from('bookmarks').select('plant_id').eq('user_id', uid).then(({ data }) => {
      if (!cancelled) setIds(new Set((data ?? []).map((r) => r.plant_id)));
    });
    return () => { cancelled = true; };
  }, [uid]);

  const toggle = useCallback(async (plantId) => {
    if (!uid) return;
    const had = ids.has(plantId);
    const flip = (add) =>
      setIds((prev) => {
        const next = new Set(prev);
        if (add) next.add(plantId); else next.delete(plantId);
        return next;
      });

    flip(!had); // instant feedback
    const { error } = had
      ? await supabase.from('bookmarks').delete().eq('user_id', uid).eq('plant_id', plantId)
      : await supabase.from('bookmarks').insert({ user_id: uid, plant_id: plantId });
    if (error) flip(had); // put it back if the database said no
  }, [ids, uid]);

  return { ids, toggle };
}
