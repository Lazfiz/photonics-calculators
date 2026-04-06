import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Jones Matrix Chain',
  description: 'Chain Jones matrices to transform input polarization states and visualize the output ellipse.'
};

export default function Page() {
  return <PageClient />;
}
