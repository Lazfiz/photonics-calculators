import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Short Pass Filter',
  description: 'Quarter-wave stack (LH)N short-pass filter. Transmits < edge, reflects longer wavelengths.',
};

export default function Page() {
  return <PageClient />;
}
