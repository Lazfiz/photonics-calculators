import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Blue Light Hazard',
  description: 'Interactive Blue Light Hazard calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
