import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Optical Parametric Amplifier',
  description: 'Interactive Optical Parametric Amplifier calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
