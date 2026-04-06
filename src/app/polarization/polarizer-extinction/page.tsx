import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Polarizer Extinction Ratio',
  description: 'Analyze extinction ratio, Malus\',s law with imperfect polarizers, and cascaded extinction performance.'
};

export default function Page() {
  return <PageClient />;
}
