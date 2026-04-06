import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Thin Film Interference Conditions',
  description: 'Constructive and destructive interference patterns from a single thin film, accounting for phase shifts at boundaries.'
};

export default function Page() {
  return <PageClient />;
}
