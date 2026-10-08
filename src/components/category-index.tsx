import type { Metadata } from "next";
import Link from "next/link";
import { calculatorsIn, displayName, getCategory, type CategoryId } from "../registry";

export function categoryMetadata(id: CategoryId): Metadata {
  const category = getCategory(id);
  return {
    alternates: { canonical: `https://photonics-calculators.vercel.app/${id}` },
    title: category.title,
    description: category.description,
  };
}

/** A category's index page: every calculator in it that isn't hidden, featured ones first. */
export default function CategoryIndex({ id }: { id: CategoryId }) {
  const category = getCategory(id);
  const items = calculatorsIn(id)
    .filter((calculator) => !calculator.hidden)
    .map((calculator) => ({ ...calculator, name: displayName(calculator) }))
    .sort((a, b) => (b.priority ?? 50) - (a.priority ?? 50) || a.name.localeCompare(b.name, "en"));

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">
        ← Back to Calculators
      </Link>
      <h1 className="text-3xl font-bold mb-2">{category.heading}</h1>
      {category.intro && <p className="text-gray-400 mb-2">{category.intro}</p>}
      <p className="text-sm text-gray-400 mb-8">{items.length} calculators</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((calculator) => (
          <Link
            key={calculator.href}
            href={calculator.href}
            className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-blue-500 hover:bg-gray-900/80 transition"
          >
            <h2 className="text-lg font-semibold text-white">{calculator.name}</h2>
            <p className="text-sm text-gray-400 mt-1">{calculator.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
