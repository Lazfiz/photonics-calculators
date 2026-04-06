import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'EMCCD Gain Calculator',
  description: 'EM gain — noise analysis, optimal gain, and SNR comparison.'
};

export default function Page() {
  return <PageClient />;
}
