import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Wire Grid Polarizer Calculator',
  description: 'Model wire grid polarizers — metallic wires on a substrate that reflect E∥ and transmit E⊥.',
};

export default function Page() {
  return <PageClient />;
}
