import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Back-Illuminated vs Front-Illuminated',
  description: 'Back-illuminated sensors bypass gate structures for higher QE and better blue/UV response.'
};

export default function Page() {
  return <PageClient />;
}
