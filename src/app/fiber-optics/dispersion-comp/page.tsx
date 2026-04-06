import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Dispersion Compensation',
  description: 'Calculates chromatic dispersion limits and DCF (dispersion-compensating fiber) requirements.',
};

export default function Page() {
  return <PageClient />;
}
