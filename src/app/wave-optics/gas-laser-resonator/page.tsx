import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Gas Laser Resonator',
  description: 'Interactive Gas Laser Resonator calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
