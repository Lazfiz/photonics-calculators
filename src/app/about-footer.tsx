import Link from "next/link";
import { REPO_URL } from "../lib/site";

export default function AboutFooter() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 px-6 py-8 text-center text-gray-500 text-sm">
      <Link href="/about" className="hover:text-blue-400 transition-colors">
        About & References
      </Link>
      <span className="mx-2">·</span>
      <Link href="/about#report" className="hover:text-blue-400 transition-colors">
        Report a problem
      </Link>
      <span className="mx-2">·</span>
      <a href={REPO_URL} className="hover:text-blue-400 transition-colors">
        Source on GitHub
      </a>
      <span className="mx-2">·</span>
      <span>Photonics Calculators — Free & Open Source (MIT)</span>
    </footer>
  );
}
