"use client";

import { useEffect, useState } from "react";
import AddTaskButton from "@/components/AddTaskButton";
import { loadCalendarOptions } from "@/lib/growing-calendar";
import type { Garden } from "@/lib/garden";
import styles from "./FirstGardenSteps.module.css";

export default function FirstGardenSteps({ userId, garden, hasPlants, hasSpaces, onGarden, onPlant, onCalendar }: {
  userId: string;
  garden?: Garden;
  hasPlants: boolean;
  hasSpaces: boolean;
  onGarden: () => void;
  onPlant: () => void;
  onCalendar: () => void;
}) {
  const [hasTask, setHasTask] = useState(() => Boolean(loadCalendarOptions(userId).reminders?.length));
  useEffect(() => {
    const refresh = () => setHasTask(Boolean(loadCalendarOptions(userId).reminders?.length));
    window.addEventListener("garden-os-data-change", refresh);
    return () => window.removeEventListener("garden-os-data-change", refresh);
  }, [userId]);
  if (garden && hasPlants && hasTask) return null;

  const steps = [
    { title: "Your zone", detail: garden?.hardiness_zone ? `Zone ${garden.hardiness_zone}` : "Optional · add it with your garden", done: Boolean(garden?.hardiness_zone) },
    { title: "Your garden", detail: garden?.name || "Give your growing place a name", done: Boolean(garden) },
    { title: "Your first plant", detail: hasPlants ? "A plant is saved" : "Start with one bed or container", done: hasPlants },
    { title: "Your first task", detail: hasTask ? "A task is saved" : "Choose something to remember", done: hasTask },
  ];
  return <section className={styles.card} aria-label="Your first garden steps">
    <p className="modern-eyebrow">A small beginning</p>
    <h2>Your garden, one step at a time</h2>
    <p className={styles.intro}>A pot, a bed, or a whole backyard. Start small and make it yours.</p>
    <ol className={styles.steps}>
      {steps.map((step, index) => <li key={step.title} className={step.done ? styles.done : undefined}>
        <span className={styles.number} aria-label={step.done ? "Complete" : `Step ${index + 1}`}>{step.done ? "✓" : index + 1}</span>
        <div><h3>{step.title}</h3><p>{step.detail}</p></div>
      </li>)}
    </ol>
    <div className={styles.actions}>
      {!garden ? <button type="button" className="seasonal-button" onClick={onGarden}>Start my garden →</button>
        : !hasPlants ? <button type="button" className="seasonal-button" onClick={onPlant}>{hasSpaces ? "Add your first plant" : "Add a bed or container"} →</button>
          : <AddTaskButton userId={userId} label="Add your first task" onSaved={onCalendar} />}
      <p>{!garden ? "Location and zone are optional. You can add them later."
        : !hasPlants ? "Save a growing space, then choose a plant to put in it."
          : "Save a simple task, then see it in your Growing Calendar."}</p>
    </div>
  </section>;
}
