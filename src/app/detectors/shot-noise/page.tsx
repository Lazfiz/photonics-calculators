import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Shot Noise',
  description: 'Interactive Shot Noise calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
