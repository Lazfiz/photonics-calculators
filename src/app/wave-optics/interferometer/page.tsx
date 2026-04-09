import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/interferometer' },
    title: 'Interferometer Visibility',
  description: 'Michelson / Mach-Zehnder interferometer intensity vs path difference. Visibility limited by mirror reflectivity.'
};

export default function Page() {
  return <PageClient />;
}
