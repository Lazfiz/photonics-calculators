import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/mode-locked-laser' },
    title: 'Mode-Locked Laser',
  description: 'Ultrashort pulse generation through passive or active mode-locking.'
};

export default function Page() {
  return <PageClient />;
}
