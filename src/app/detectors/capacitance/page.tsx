import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Junction Capacitance',
  description: 'Photodiode junction capacitance vs reverse bias, doping profile, and RC bandwidth impact.'
};

export default function Page() {
  return <PageClient />;
}
