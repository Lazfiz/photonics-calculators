import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Pmt',
  description: 'Interactive Pmt calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
