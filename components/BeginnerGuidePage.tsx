'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import BeginnerGuideArticle from '@/components/BeginnerGuideArticle';
import type { GardenGuide } from '@/lib/garden-learning';
import { supabase } from '@/lib/supabase';
import styles from '@/components/BeginnerGuidePage.module.css';

/** Reading is public. Resolve identity before exposing any writable checklist. */
export default function BeginnerGuidePage({ guide }: { guide: GardenGuide }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [identityError, setIdentityError] = useState(false);
  useEffect(() => {
    let alive = true;
    let authChanged = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authChanged = true;
      if (alive) { setUserId(session?.user.id ?? 'guest'); setIdentityError(false); }
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive || authChanged) return;
      if (error) { setIdentityError(true); return; }
      setUserId(data.session?.user.id ?? 'guest');
    }).catch(() => { if (alive && !authChanged) setIdentityError(true); });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  function returnToWorkspace() {
    // An explicit return can open the existing guest workspace; reading never creates garden records.
    if (userId === 'guest') {
      try { localStorage.setItem('garden-os-guest-active', 'true'); } catch { /* The workspace reports inaccessible storage itself. */ }
    }
  }
  return <div className={styles.page}>
    <nav aria-label="Beginner guide navigation" className={styles.backNav}>
      <Link className="seasonal-outline inline-flex min-h-11 items-center rounded-xl border px-4 py-3" href="/?view=beginners-guide" onClick={returnToWorkspace}>← Back to Beginner’s Guide</Link>
    </nav>
    <BeginnerGuideArticle guide={guide} userId={userId} mode="page" onWorkspaceNavigate={returnToWorkspace} identityMessage={identityError ? 'Could not check your checklist account. Refresh to try again; saved progress is unchanged. You can keep reading.' : undefined} />
  </div>;
}
