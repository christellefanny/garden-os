"use client";
import { useState } from 'react';
import { taskTiming } from '@/lib/calendar-focus';
import type { CalendarOptions, GrowingTask } from '@/lib/growing-calendar';

export default function CalendarTaskCards({ tasks, onOpen, selected, onSelect, options }: {
  options: CalendarOptions; tasks: GrowingTask[]; onOpen: (id: string) => void;
  selected?: string[]; onSelect?: (id: string, checked: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return <div className="space-y-3">
    {(expanded ? tasks : tasks.slice(0, 3)).map(task => <article key={task.id} className="seasonal-outline rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="seasonal-muted text-xs">{task.status === 'done' ? 'Completed' : task.status === 'skipped' ? 'Not needed' : task.id.startsWith('custom|') ? 'Saved reminder' : 'Suggested task'} · <time dateTime={task.date}>{task.date}</time></span>
        {onSelect && <label className="flex min-h-11 items-center gap-2 text-xs"><input type="checkbox" checked={selected?.includes(task.id) || false} onChange={e => onSelect(task.id, e.target.checked)} aria-label={`Select ${task.title} for ${task.plant}`} />Select</label>}
      </div>
      <button type="button" className="min-h-11 text-left text-base font-semibold underline decoration-dotted underline-offset-4" onClick={() => onOpen(task.id)}>{task.title}</button>
      <p className="seasonal-muted text-sm">{task.plant}</p>
      {taskTiming(task, options).deadline && <p className="mt-2 text-sm font-semibold">By {taskTiming(task, options).deadline} · your deadline</p>}
      {options.tasks[task.id]?.minutes && <p className="seasonal-muted mt-1 text-xs">{taskTiming(task, options).duration}</p>}
      <button type="button" className="seasonal-link mt-2 min-h-11 text-sm" onClick={() => onOpen(task.id)}>Instructions & timing →</button>
    </article>)}
    {tasks.length > 3 && <button type="button" className="seasonal-outline min-h-11 rounded-lg border px-4 py-2 text-sm" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Show fewer tasks' : `Show all ${tasks.length} tasks`}</button>}
  </div>;
}
