import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Thermal vs Photochemical MPE',
  description: 'Interactive Thermal vs Photochemical MPE calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
