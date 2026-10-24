"use client";
import Image from "next/image";
import type { GrowingTask } from "@/lib/growing-calendar";

const art = [
  {
    src: "/planting-now/kale.webp",
    name: "Winter kale",
    note: "A quiet season for planning",
  },
  {
    src: "/calendar/spring-lettuce.webp",
    name: "Spring lettuce",
    note: "Make room for fresh beginnings",
  },
  {
    src: "/planting-now/tomato.webp",
    name: "Summer tomatoes",
    note: "A little tending, a little gathering",
  },
  {
    src: "/planting-now/garlic.webp",
    name: "Fall garlic",
    note: "Gather today, plant for tomorrow",
  },
];
export default function BotanicalCalendar({
  month,
  today,
  tasks,
  selectedDay,
  onSelect,
  onMonth,
}: {
  month: string;
  today: string;
  tasks: GrowingTask[];
  selectedDay: string | null;
  onSelect: (date: string) => void;
  onMonth: (month: string) => void;
}) {
  const [year, number] = month.split("-").map(Number);
  const illustration =
    art[
      number >= 3 && number <= 5
        ? 1
        : number >= 6 && number <= 8
          ? 2
          : number >= 9 && number <= 11
            ? 3
            : 0
    ];
  const first = new Date(`${month}-01T12:00:00Z`);
  const offset = (first.getUTCDay() + 6) % 7;
  const length = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const grouped = new Map<string, GrowingTask[]>();
  for (const task of tasks)
    if (!task.status)
      grouped.set(task.date, [...(grouped.get(task.date) || []), task]);
  function move(delta: number) {
    const d = new Date(Date.UTC(year, number - 1 + delta, 1));
    onMonth(d.toISOString().slice(0, 7));
  }
  return (
    <section
      className="botanical-calendar"
      aria-label="Monthly garden calendar"
    >
      <header className="botanical-calendar-header">
        <div className="botanical-calendar-copy">
          <p className="modern-eyebrow">Your garden, day by day</p>
          <h2>
            {first.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            })}
          </h2>
          <p>{illustration.note}</p>
        </div>
        <Image
          className="calendar-season-art"
          src={illustration.src}
          alt={`Botanical watercolor of ${illustration.name.toLowerCase()}`}
          width={700}
          height={700}
          sizes="(max-width:600px) 140px, 220px"
        />
      </header>
      <div className="calendar-month-navigation">
        <button
          type="button"
          className="seasonal-outline"
          aria-label="Previous month"
          onClick={() => move(-1)}
        >
          ←
        </button>
        <button
          type="button"
          className="seasonal-link"
          onClick={() => {
            onMonth(today.slice(0, 7));
            onSelect(today);
          }}
        >
          Today
        </button>
        <button
          type="button"
          className="seasonal-outline"
          aria-label="Next month"
          onClick={() => move(1)}
        >
          →
        </button>
      </div>
      <div className="botanical-month-grid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <span className="calendar-weekday" key={day}>
            {day}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <div
            className="calendar-empty-day"
            key={`before-${i}`}
            aria-hidden="true"
          />
        ))}
        {Array.from({ length }, (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, "0")}`;
          const items = grouped.get(date) || [];
          const label = new Date(`${date}T12:00:00Z`).toLocaleDateString(
            "en-US",
            {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
              timeZone: "UTC",
            },
          );
          return (
            <button
              type="button"
              className={`calendar-date${date === today ? " is-today" : ""}`}
              key={date}
              aria-pressed={selectedDay === date}
              data-date={date}
              aria-current={date === today ? "date" : undefined}
              onClick={() => onSelect(date)}
            >
              <span className="sr-only">
                {label}: {items.length} {items.length === 1 ? "task" : "tasks"}
                .{" "}
              </span>
              <span className="calendar-date-number">{i + 1}</span>
              <span className="calendar-date-tasks">
                {items.slice(0, 2).map((t) => (
                  <span
                    className={`calendar-task-chip ${t.id.startsWith("custom|") ? "is-personal" : ""}`}
                    key={t.id}
                  >
                    {t.plant} · {t.title}
                  </span>
                ))}
                {items.length > 2 && (
                  <span className="calendar-task-more">
                    +{items.length - 2} more
                  </span>
                )}
              </span>
              {!!items.length && (
                <span className="calendar-mobile-count">
                  {items.length} {items.length === 1 ? "task" : "tasks"}
                </span>
              )}
            </button>
          );
        })}
        {Array.from({ length: (7 - ((offset + length) % 7)) % 7 }, (_, i) => (
          <div
            className="calendar-empty-day"
            key={`after-${i}`}
            aria-hidden="true"
          />
        ))}
      </div>
    </section>
  );
}
