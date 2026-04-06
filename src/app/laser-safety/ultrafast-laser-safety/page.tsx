import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Ultrafast Laser Safety Calculator',
  description: 'Evaluate single-pulse, average-power, and PRF-corrected MPE for femtosecond/picosecond laser systems.'
};

export default function Page() {
  return <PageClient />;
}
