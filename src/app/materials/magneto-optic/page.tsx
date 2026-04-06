import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Magneto-Optic Materials',
  description: 'Faraday rotation, Verdet constants, and isolator design calculations',
};

export default function Page() {
  return <PageClient />;
}
