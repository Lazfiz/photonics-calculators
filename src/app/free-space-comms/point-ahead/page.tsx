import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Point Ahead',
  description: 'Interactive Point Ahead calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
