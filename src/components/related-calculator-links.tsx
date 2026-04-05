import Link from "next/link";

export type RelatedCalculatorItem = {
  href: string;
  label: string;
  desc: string;
};

export default function RelatedCalculatorLinks({
  title = "Related calculators",
  currentHref,
  items,
}: {
  title?: string;
  currentHref: string;
  items: RelatedCalculatorItem[];
}) {
  const links = items.filter((item) => item.href !== currentHref);
  if (!links.length) return null;

  return (
    <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900/80 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">{title}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-gray-700 bg-gray-950/70 p-3 transition hover:border-blue-500 hover:bg-gray-950"
          >
            <p className="text-sm font-medium text-white">{item.label}</p>
            <p className="mt-1 text-xs text-gray-400">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
