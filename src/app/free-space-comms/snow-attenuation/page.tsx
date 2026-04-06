import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Snow Attenuation',
  description: 'Interactive Snow Attenuation calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
