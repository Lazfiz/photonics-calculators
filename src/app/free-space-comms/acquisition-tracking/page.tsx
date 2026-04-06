import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Acquisition Tracking',
  description: 'Interactive Acquisition Tracking calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
