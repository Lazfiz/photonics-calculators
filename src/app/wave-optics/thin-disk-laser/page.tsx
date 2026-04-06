import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Thin Disk Laser',
  description: 'Interactive Thin Disk Laser calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
