import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Depolarization',
  description: 'Calculate depolarization effects via Mueller matrix model or spectral averaging.'
};

export default function Page() {
  return <PageClient />;
}
