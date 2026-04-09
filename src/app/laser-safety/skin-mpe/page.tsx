import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/laser-safety/skin-mpe",
    title: 'Skin MPE Calculator',
  description: 'Maximum permissible exposure for skin (ANSI Z136 simplified). Not for clinical safety decisions.'
};

export default function Page() {
  return <PageClient />;
}
