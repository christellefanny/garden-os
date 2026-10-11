export function groupReminders<T extends { title: string; plant: string }>(tasks: T[]) {
  const groups = new Map<string, {title: string; tasks: T[]}>();
  for (const task of tasks) {
    const key = task.title.trim().toLowerCase();
    const group = groups.get(key) || {title: task.title.trim(), tasks: []};
    group.tasks.push(task);
    groups.set(key, group);
  }
  return [...groups.values()];
}
