import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Ber',
  description: 'Interactive Ber calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
