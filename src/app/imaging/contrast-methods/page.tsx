import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Phase Contrast & DIC Calculator',
  description: 'Contrast calculations for phase contrast and differential interference contrast microscopy.'
};

export default function Page() {
  return <PageClient />;
}
