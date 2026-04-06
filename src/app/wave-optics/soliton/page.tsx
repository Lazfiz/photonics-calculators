import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Soliton Propagation',
  description: 'Fundamental and higher-order soliton dynamics via split-step Fourier simulation.'
};

export default function Page() {
  return <PageClient />;
}
