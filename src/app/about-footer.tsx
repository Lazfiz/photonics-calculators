import Link from "next/link";

export default function AboutFooter() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 px-6 py-8 text-center text-gray-500 text-sm">
      <Link href="/about" className="hover:text-blue-400 transition-colors">
        About & References
      </Link>
      <span className="mx-2">·</span>
      <span>Photonics Calculators — Free & Open Source</span>
    </footer>
  );
}
