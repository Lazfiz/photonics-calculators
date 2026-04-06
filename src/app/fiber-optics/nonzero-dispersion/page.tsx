import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Non-Zero Dispersion Shifted Fiber (NZ-DSF)',
  description: 'Design NZ-DSF fibers (G.655) with optimized dispersion for DWDM systems — balancing dispersion and nonlinearity.'
};

export default function Page() {
  return <PageClient />;
}
