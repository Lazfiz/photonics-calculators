import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/fiber-optics/connector-return-loss",
    title: 'Connector Return Loss',
  description: 'Calculate return loss (ORL) from fiber connectors based on polish type and index mismatch.'
};

export default function Page() {
  return <PageClient />;
}
