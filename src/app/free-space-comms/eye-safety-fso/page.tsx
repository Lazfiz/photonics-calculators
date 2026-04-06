import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Eye Safety Fso',
  description: 'Interactive Eye Safety Fso calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
