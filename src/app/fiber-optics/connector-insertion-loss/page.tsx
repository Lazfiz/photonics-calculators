import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/fiber-optics/connector-insertion-loss",
    title: 'Connector Insertion Loss',
  description: 'Calculate connector insertion loss from misalignment parameters and build link budgets for different connector types.'
};

export default function Page() {
  return <PageClient />;
}
