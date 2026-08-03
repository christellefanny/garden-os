import GardenHeader

from "@/components/gardenHeader";
const growingSpaces = [
  {
    id: 1,
    name: "Tomato Bed",
    type: "Raised Bed",
    size: "6 × 3 × 1 ft",
    plants: 7,
    capacity: 78,
    icon: "🍅",
  },
  {
    id: 2,
    name: "Pepper Bed",
    type: "Raised Bed",
    size: "5 × 2.5 × 1 ft",
    plants: 0,
    capacity: 0,
    icon: "🌶️",
  },
  {
    id: 3,
    name: "Blueberry Pot",
    type: "Container",
    size: "20-inch pot",
    plants: 1,
    capacity: 65,
    icon: "🫐",
  },
  {
    id: 4,
    name: "Strawberry Planter",
    type: "Container",
    size: "20-inch planter",
    plants: 5,
    capacity: 82,
    icon: "🍓",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f1e8] text-slate-900">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <GardenHeader season={2026} />

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl bg-[#245c42] p-7 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-widest text-green-100">
              Backyard Garden
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Good afternoon, Christelle
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-green-50">
              Your garden currently has {growingSpaces.length} growing spaces.
              Add beds, containers, plants, and seasonal plans as your garden
              grows.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <GardenStat label="Spaces" value="4" />
              <GardenStat label="Plants" value="13" />
              <GardenStat label="Warnings" value="1" />
              <GardenStat label="Season" value="2026" />
            </div>
          </div>

          <aside className="rounded-3xl border border-[#cbd8c5] bg-[#e3ecde] p-7">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌿</span>

              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-[#4f6e59]">
                  Sage
                </p>

                <h2 className="text-xl font-bold text-[#173d2b]">
                  Garden guidance
                </h2>
              </div>
            </div>

            <p className="mt-5 leading-7 text-[#3f5547]">
              Your strawberry planter is nearing its recommended capacity.
              Avoid adding more plants unless you increase the container size.
            </p>

            <button className="mt-5 font-bold text-[#245c42] hover:underline">
              Why? →
            </button>
          </aside>
        </section>

        <section className="mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-[#5c725f]">
                My garden
              </p>

              <h2 className="mt-1 text-3xl font-black text-[#173d2b]">
                Growing Spaces
              </h2>
            </div>

            <button className="rounded-xl bg-[#245c42] px-5 py-3 font-bold text-white shadow-sm transition hover:bg-[#1c4935]">
              + Add Growing Space
            </button>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {growingSpaces.map((space) => (
              <GrowingSpaceCard key={space.id} space={space} />
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-stone-300 bg-white p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-[#5c725f]">
                Planning tool
              </p>

              <h2 className="mt-1 text-2xl font-black text-[#173d2b]">
                Not sure how many plants will fit?
              </h2>

              <p className="mt-2 text-stone-600">
                Open the Plant Planner to test bed sizes and plant quantities
                before adding them to your garden.
              </p>
            </div>

            <button className="shrink-0 rounded-xl border-2 border-[#245c42] px-5 py-3 font-bold text-[#245c42] transition hover:bg-green-50">
              Open Plant Planner
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

type GrowingSpace = {
  id: number;
  name: string;
  type: string;
  size: string;
  plants: number;
  capacity: number;
  icon: string;
};

function GrowingSpaceCard({ space }: { space: GrowingSpace }) {
  const isWarning = space.capacity >= 80;

  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e3ecde] text-3xl">
            {space.icon}
          </span>

          <div>
            <p className="text-sm font-semibold text-stone-500">{space.type}</p>
            <h3 className="text-xl font-black text-[#173d2b]">{space.name}</h3>
          </div>
        </div>

        {isWarning && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            Check capacity
          </span>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-sm text-stone-500">Size</p>
          <p className="mt-1 font-bold">{space.size}</p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-sm text-stone-500">Plants</p>
          <p className="mt-1 font-bold">
            {space.plants === 0 ? "Empty" : space.plants}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-stone-600">Capacity</p>
          <p
            className={`text-sm font-bold ${
              isWarning ? "text-amber-700" : "text-[#245c42]"
            }`}
          >
            {space.capacity}%
          </p>
        </div>

        <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-200">
          <div
            className={`h-full rounded-full ${
              isWarning ? "bg-amber-500" : "bg-[#5f8f64]"
            }`}
            style={{ width: `${Math.min(space.capacity, 100)}%` }}
          />
        </div>
      </div>

      <button className="mt-6 font-bold text-[#245c42] hover:underline">
        Open Space →
      </button>
    </article>
  );
}

function GardenStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-sm text-green-100">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}