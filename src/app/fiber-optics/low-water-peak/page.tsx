import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/fiber-optics/low-water-peak",
    title: 'Low Water Peak Fiber',
  description: 'Analyze low water peak (LWP) fibers that reduce the OH⁻ absorption peak at 1383 nm, enabling E-band and full CWDM operation.'
};

export default function Page() {
  return <PageClient />;
}
