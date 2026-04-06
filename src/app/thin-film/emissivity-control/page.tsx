import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Emissivity Control',
  description: 'Low-emissivity (Low-E) coating for thermal insulation — Kirchhoff',
};

export default function Page() {
  return <PageClient />;
}
