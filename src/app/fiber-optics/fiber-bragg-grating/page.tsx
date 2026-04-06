import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fiber Bragg Grating',
  description: 'Interactive Fiber Bragg Grating calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
