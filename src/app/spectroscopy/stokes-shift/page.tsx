import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Stokes Shift Calculator',
  description: '̃ = ̃_abs − ̃_em — energy difference between absorption and emission maxima.'
};

export default function Page() {
  return <PageClient />;
}
