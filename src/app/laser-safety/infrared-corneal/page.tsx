import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'IR Corneal Exposure',
  description: 'Interactive IR Corneal Exposure calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
