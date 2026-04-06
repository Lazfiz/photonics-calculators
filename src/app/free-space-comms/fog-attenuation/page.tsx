import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fog Attenuation',
  description: 'Interactive Fog Attenuation calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
