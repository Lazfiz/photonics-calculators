import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Lasercom Link',
  description: 'Interactive Lasercom Link calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
