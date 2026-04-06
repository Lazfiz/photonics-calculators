import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Afterpulsing in APDs',
  description: 'Afterpulse probability, trap dynamics, and dead time trade-offs in avalanche photodiodes.'
};

export default function Page() {
  return <PageClient />;
}
