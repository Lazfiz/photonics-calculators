import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fiber Laser Resonator',
  description: 'Interactive Fiber Laser Resonator calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
