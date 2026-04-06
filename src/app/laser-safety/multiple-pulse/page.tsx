import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Multiple Pulse Correction',
  description: 'Evaluates all three ANSI Z136.1 rules for repetitive pulse exposure and selects the most restrictive MPE.'
};

export default function Page() {
  return <PageClient />;
}
