import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calendarFocus, taskTiming } from '../lib/calendar-focus.ts';
const task = (id, date, status) => ({ id, date, status, title: 'Check soil', plant: 'Basil', detail: 'Check before watering.' });
test('focus respects rest days, completed work and a seven-day window across years', () => {
  const pending = task('next', '2027-01-01');
  const result = calendarFocus([pending, pending, task('old', '2026-12-29'), task('done', '2026-12-30', 'done'), task('skip', '2026-12-30', 'skipped'), task('later', '2027-01-06')], '2026-12-30', '2027-01-05');
  assert.equal(result.today.length, 0);
  assert.deepEqual(result.upcoming.map(t => t.id), ['next']);
  assert.deepEqual(result.review.map(t => t.id), ['old']);
});
test('timing does not invent durations or deadlines', () => {
  const t = task('saved', '2026-11-02');
  assert.deepEqual(taskTiming(t, { tasks: {} }), { deadline: '', duration: 'Not estimated yet' });
  assert.deepEqual(taskTiming(t, { tasks: { saved: { minutes: 15, dueDate: '2026-11-04' } } }), { deadline: '2026-11-04', duration: 'About 15 minutes (your estimate)' });
  assert.equal(taskTiming(t, { tasks: { saved: { minutes: -10 } } }).duration, 'Not estimated yet');
});
