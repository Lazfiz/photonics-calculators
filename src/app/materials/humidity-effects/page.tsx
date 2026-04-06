import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Humidity Effects on Optics',
  description: 'Water absorption, refractive index changes, and surface degradation',
};

export default function Page() {
  return <PageClient />;
}
