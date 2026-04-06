import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Environmental Stability',
  description: 'Environmental factors shift thin film spectral performance. Temperature changes refractive index',
};

export default function Page() {
  return <PageClient />;
}
