import Link from "next/link";

const suiteLinks = [
  { href: "/laser-safety/mpe", label: "MPE", desc: "Bounded direct-beam MPE pre-check" },
  { href: "/laser-safety/nohd", label: "NOHD", desc: "Hazard-distance pre-check" },
  { href: "/laser-safety/optical-density", label: "Optical Density", desc: "OD from bounded MPE branch" },
  { href: "/laser-safety/od-requirements", label: "OD Requirements", desc: "Manual validated-limit OD math" },
  { href: "/laser-safety/viewing-distance", label: "Viewing Distance", desc: "Distance pre-check from same branch" },
];

export default function LaserSafetySuiteLinks({ currentHref }: { currentHref: string }) {
  const links = suiteLinks.filter((item) => item.href !== currentHref);

  return (
    <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900/80 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Related bounded-suite tools</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-lg border border-gray-700 bg-gray-950/70 p-3 transition hover:border-blue-500 hover:bg-gray-950">
            <p className="text-sm font-medium text-white">{item.label}</p>
            <p className="mt-1 text-xs text-gray-400">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
