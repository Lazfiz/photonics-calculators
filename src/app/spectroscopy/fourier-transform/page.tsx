import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fourier Transform Basics',
  description: 'Decompose a composite time-domain signal into its frequency components via DFT.'
};

export default function Page() {
  return <PageClient />;
}
