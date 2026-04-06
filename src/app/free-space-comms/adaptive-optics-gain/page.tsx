import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Adaptive Optics Gain',
  description: 'Interactive Adaptive Optics Gain calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
