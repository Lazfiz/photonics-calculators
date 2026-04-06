import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Noise Equivalent Power (NEP) & Detectivity (D*)',
  description: 'Calculate NEP and specific detectivity D* from detector noise sources: shot noise, thermal (Johnson) noise, and dark current.'
};

export default function Page() {
  return <PageClient />;
}
