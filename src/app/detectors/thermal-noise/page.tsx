import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Johnson (Thermal) Noise',
  description: 'vn = (4kBTRf). Thermal noise voltage across a resistor.'
};

export default function Page() {
  return <PageClient />;
}
