import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Free Electron Laser',
  description: 'Interactive Free Electron Laser calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
