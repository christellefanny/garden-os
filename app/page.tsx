export default function Home() {
  return (
    <main className="min-h-screen bg-green-50 flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-green-800">
        🌱 Garden OS
      </h1>

      <p className="mt-6 text-xl text-gray-700">
        Your personal garden operating system
      </p>

      <button className="mt-10 rounded-xl bg-green-700 px-6 py-3 text-white hover:bg-green-800">
        Create My Garden
      </button>
    </main>
  );
}
