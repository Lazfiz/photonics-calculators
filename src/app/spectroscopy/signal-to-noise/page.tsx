import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Signal-to-Noise Ratio',
  description: 'Detailed SNR model: shot noise, dark current, read noise, and detector noise contributions.'
};

export default function Page() {
  return <PageClient />;
}
