'use client';

import { useEffect, useState } from 'react';
import AddTaskButton from '@/components/AddTaskButton';
import CloudDataBoundary from '@/components/CloudDataBoundary';
import { supabase } from '@/lib/supabase';

/** Public reading stays public; only the task form resolves private persistence. */
export default function FlowerCornerTasks() {
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    let authChanged = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authChanged = true;
      if (alive) { setUserId(session?.user.id ?? 'guest'); setError(false); }
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive || authChanged) return;
      if (error) { setError(true); return; }
      setUserId(data.session?.user.id ?? 'guest');
    }).catch(() => { if (alive && !authChanged) setError(true); });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);
  if (!userId) return <>
    <button type="button" className="seasonal-button add-task-button floating-add-task" disabled>+ Add task</button>
    <p role="status" className="floating-task-status">{error ? 'Could not check task storage. Refresh to try again; your saved tasks are unchanged.' : 'Checking task storage…'}</p>
  </>;
  return <CloudDataBoundary key={userId} userId={userId}>
    <AddTaskButton userId={userId} floating onSaved={() => {
      // Open the same guest workspace on return, without creating or replacing gardens.
      if (userId === 'guest') {
        try { localStorage.setItem('garden-os-guest-active', 'true'); } catch { /* Task itself already saved. */ }
      }
    }} />
  </CloudDataBoundary>;
}
