import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/thin-film/emissivity-control",
    title: 'Emissivity Control',
  description: 'Low-emissivity (Low-E) coating for thermal insulation — Kirchhoff',
};

export default function Page() {
  return <PageClient />;
}
