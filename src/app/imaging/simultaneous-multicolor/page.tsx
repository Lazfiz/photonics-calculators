import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Simultaneous Multicolor Imaging',
  description: 'Calculate spectral separation, crosstalk, timing budgets, and SNR for multi-channel fluorescence imaging.'
};

export default function Page() {
  return <PageClient />;
}
