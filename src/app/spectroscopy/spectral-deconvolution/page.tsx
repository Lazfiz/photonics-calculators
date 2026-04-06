import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Spectral Deconvolution',
  description: 'Decompose overlapping spectral bands into individual Gaussian components.'
};

export default function Page() {
  return <PageClient />;
}
