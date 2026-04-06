import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Kerr Lens Mode Locking',
  description: 'Self-focusing and Kerr-lens effect in nonlinear media for ultrashort pulse generation.'
};

export default function Page() {
  return <PageClient />;
}
