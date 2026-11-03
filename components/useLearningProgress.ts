"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { learningProgressKey, parseLearningChecks, saveLearningCheck } from '@/lib/learning-progress';

const changeEvent = 'garden-learning-progress-change';
const unavailable = '__storage_unavailable__';
const serverSnapshot = () => null;

export function useLearningProgress(userId: string) {
  const key = learningProgressKey(userId);
  const [saveError, setSaveError] = useState('');
  const subscribe = useCallback((notify: () => void) => {
    const storageChanged = (event: StorageEvent) => { if (event.key === key || event.key === null) notify(); };
    window.addEventListener('storage', storageChanged);
    window.addEventListener(changeEvent, notify);
    return () => {
      window.removeEventListener('storage', storageChanged);
      window.removeEventListener(changeEvent, notify);
    };
  }, [key]);
  const snapshot = useCallback(() => {
    try { return localStorage.getItem(key); } catch { return unavailable; }
  }, [key]);
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const progress = useMemo(() => {
    try { return { checks: parseLearningChecks(raw), error: '' }; }
    catch { return { checks: {}, error: raw === unavailable
      ? 'Browser storage is unavailable. Checklist changes cannot be saved here.'
      : 'Saved checklist progress could not be read. Your browser copy has been kept unchanged.' }; }
  }, [raw]);
  function setCheck(item: string, checked: boolean) {
    try {
      saveLearningCheck(localStorage, userId, item, checked);
      setSaveError('');
      window.dispatchEvent(new Event(changeEvent));
    } catch {
      setSaveError('This checklist change could not be saved. Your previous progress is unchanged.');
    }
  }
  return { checks: progress.checks, error: progress.error || saveError, setCheck, disabled: Boolean(progress.error) };
}
