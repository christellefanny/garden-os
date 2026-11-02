import { beginnerGuides } from './garden-learning.ts';

export type LearningChecks = Record<string, boolean>;
const allowedKeys = new Set(beginnerGuides.flatMap(guide => guide.checklist.map((_, index) => `${guide.id}:${index}`)));
export const learningProgressKey = (userId: string) => `garden-os-learning-checks-v1-${encodeURIComponent(userId)}`;

export function parseLearningChecks(raw: string | null): LearningChecks {
  if (raw === null) return {};
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid checklist data');
  const checks: LearningChecks = {};
  for (const [key, checked] of Object.entries(value)) {
    if (!allowedKeys.has(key) || typeof checked !== 'boolean') throw Error('Invalid checklist entry');
    checks[key] = checked;
  }
  return checks;
}

export function saveLearningCheck(storage: Pick<Storage, 'getItem' | 'setItem'>, userId: string, key: string, checked: boolean) {
  if (!allowedKeys.has(key)) throw Error('Unknown checklist item');
  const storageKey = learningProgressKey(userId);
  // Re-read before writing so another tab's changes are not overwritten.
  // Invalid data is retained for recovery, never silently replaced.
  const checks = parseLearningChecks(storage.getItem(storageKey));
  storage.setItem(storageKey, JSON.stringify({ ...checks, [key]: checked }));
}
