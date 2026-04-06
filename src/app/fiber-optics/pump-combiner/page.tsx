import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Pump Combiner',
  description: 'Interactive Pump Combiner calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
