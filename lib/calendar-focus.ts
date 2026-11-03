import type { GrowingTask, CalendarOptions } from './growing-calendar';

export function calendarFocus(tasks: GrowingTask[], today: string, end: string) {
  const pending = [...new Map(tasks.filter(t => !t.status).map(t => [t.id, t])).values()]
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  return {
    today: pending.filter(t => t.date === today),
    upcoming: pending.filter(t => t.date > today && t.date <= end),
    review: pending.filter(t => t.date < today),
  };
}
export function taskTiming(task: GrowingTask, options: CalendarOptions) {
  const saved = options.tasks[task.id];
  return {
    deadline: saved?.dueDate || '',
    duration: saved?.minutes && Number.isFinite(saved.minutes) && saved.minutes > 0
      ? `About ${saved.minutes} minutes (your estimate)` : 'Not estimated yet',
  };
}
