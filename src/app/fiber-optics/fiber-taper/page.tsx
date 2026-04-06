import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fiber Taper Calculation',
  description: 'Calculate fiber taper waist diameter, evanescent field, and coupling parameters from pull length.'
};

export default function Page() {
  return <PageClient />;
}
