import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Vacuum Photodiode',
  description: 'Vacuum photodiode calculator. Models photoemission, responsivity, dark current (thermionic emission), and frequency response.'
};

export default function Page() {
  return <PageClient />;
}
