import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Dispersion Map Calculator',
  description: 'Design a dispersion map for a fiber link using SMF and DCF segments.'
};

export default function Page() {
  return <PageClient />;
}
