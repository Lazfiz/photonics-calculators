import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Bpsk Qpsk',
  description: 'Interactive Bpsk Qpsk calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
