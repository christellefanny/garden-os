type GardenHeaderProps = {
  season: number;
};

export default function GardenHeader({ season }: GardenHeaderProps) {
  return (
    <header className="flex flex-col gap-6 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--primary)]">
          Your garden&apos;s operating system
        </p>

        <div className="mt-2 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-2xl shadow-sm"
          >
            🌻
          </span>

          <h1 className="text-4xl font-black text-[var(--primary-dark)] sm:text-5xl">
            Garden OS
          </h1>
        </div>

        <p className="mt-3 text-lg font-semibold text-[var(--muted)]">
          Grow Smarter. Harvest Better.
        </p>
      </div>

      <div className="seasonal-card rounded-2xl border px-5 py-4 shadow-sm">
        <p className="text-sm text-[var(--muted)]">Current season</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🌻</span>
          <p className="text-sm font-black uppercase tracking-widest text-[var(--accent-2)]">
            Summer
          </p>
        </div>
        <p className="mt-1 text-2xl font-bold text-[var(--primary)]">{season}</p>
      </div>
    </header>
  );
}
