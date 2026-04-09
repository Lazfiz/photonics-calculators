import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/laser-safety/industrial-laser-safety",
    title: 'Industrial Laser Safety Calculator',
  description: 'Assess direct beam, specular/diffuse reflections, NOHD, and OD for industrial cutting/welding lasers.'
};

export default function Page() {
  return <PageClient />;
}
