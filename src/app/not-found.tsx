import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-blue-400">404</h1>
        <h2 className="text-2xl font-semibold mt-4">Calculator Not Found</h2>
        <p className="text-gray-400 mt-2">This calculator may have been moved or renamed.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-3 text-sm font-medium hover:bg-blue-500 transition">
          Browse all calculators →
        </Link>
      </div>
    </main>
  );
}
