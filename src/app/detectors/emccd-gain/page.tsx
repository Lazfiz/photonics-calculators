import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'EMCCD Gain Calculator',
  description: 'EM gain stages, excess noise (F=2), and SNR advantage over conventional CCD.'
};

export default function Page() {
  return <PageClient />;
}
