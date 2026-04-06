import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Attosecond Pulse Generation',
  description: 'High-harmonic generation and isolated attosecond pulse parameters.'
};

export default function Page() {
  return <PageClient />;
}
