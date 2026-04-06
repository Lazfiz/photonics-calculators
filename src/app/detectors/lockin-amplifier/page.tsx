import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Lockin Amplifier',
  description: 'Interactive Lockin Amplifier calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
