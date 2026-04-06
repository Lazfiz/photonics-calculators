import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Extinction Ratio',
  description: 'Calculate polarizer extinction ratio, transmission, and cascaded performance.'
};

export default function Page() {
  return <PageClient />;
}
