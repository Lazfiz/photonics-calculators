import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Denoising Algorithms',
  description: 'Compare denoising methods: noise reduction, detail preservation, and SNR improvement tradeoffs.'
};

export default function Page() {
  return <PageClient />;
}
