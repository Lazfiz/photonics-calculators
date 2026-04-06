import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'ANSI vs IEC MPE Comparison',
  description: 'Compares Maximum Permissible Exposure (ANSI Z136.1) with Accessible Emission Limits (IEC 60825-1) across wavelengths.'
};

export default function Page() {
  return <PageClient />;
}
