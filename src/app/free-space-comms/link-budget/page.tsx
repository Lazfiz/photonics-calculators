import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/free-space-comms/link-budget",
    title: 'FSO Link Budget',
  description: 'Interactive free-space optical link budget with sliders, presets, and received-power versus range view.'
};

export default function Page() {
  return <PageClient />;
}
