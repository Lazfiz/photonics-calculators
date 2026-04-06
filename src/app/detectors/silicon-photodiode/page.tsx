import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Silicon Photodiode',
  description: 'Interactive Silicon Photodiode calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
