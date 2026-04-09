import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/cep-stabilization",
    title: 'Carrier-Envelope Phase (CEP)',
  description: 'CEP offset effects on few-cycle pulse electric field.'
};

export default function Page() {
  return <PageClient />;
}
