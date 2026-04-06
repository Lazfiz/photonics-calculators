import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Polymer (Sheet) Polarizer',
  description: 'Model iodine-doped PVA film polarizers (e.g., H-sheet). Absorption-based dichroic polarizers with selectable dichroic ratio and film thickness.'
};

export default function Page() {
  return <PageClient />;
}
