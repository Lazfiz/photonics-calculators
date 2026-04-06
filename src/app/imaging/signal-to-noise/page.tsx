import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Imaging Signal-to-Noise Ratio',
  description: 'Comprehensive SNR calculation for microscopy imaging systems.'
};

export default function Page() {
  return <PageClient />;
}
