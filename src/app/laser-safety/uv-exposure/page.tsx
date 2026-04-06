import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'UV Exposure Limits',
  description: 'Interactive UV Exposure Limits calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
