import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Adaptive Optics Calculator',
  description: 'AO correction performance, Strehl ratio, and deformable mirror requirements.'
};

export default function Page() {
  return <PageClient />;
}
