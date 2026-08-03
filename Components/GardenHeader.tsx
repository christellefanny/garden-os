type GardenHeaderProps = {
  season: number;
};

export default function GardenHeader({
  season,
}: GardenHeaderProps) {
  return (
    <header className="flex flex-col gap-6 border-b border-stone-300 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#245c42]">
          Your garden&apos;s operating system
        </p>

        <div className="mt-2 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#245c42] text-2xl shadow-sm"
          >
            🌿
          </span>

          <h1 className="text-4xl font-black text-[#173d2b] sm:text-5xl">
            Garden OS
          </h1>
        </div>

        <p className="mt-3 text-lg font-semibold text-stone-600">
          Grow Smarter. Harvest Better.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-stone-500">Current season</p>
        <p className="text-2xl font-bold text-[#245c42]">{season}</p>
      </div>
    </header>
  );
}