import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Channel Capacity',
  description: 'Interactive Channel Capacity calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
