import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Electro-Optic Coefficients',
  description: 'Pockels effect materials for modulators, Q-switches, and phase shifters',
};

export default function Page() {
  return <PageClient />;
}
