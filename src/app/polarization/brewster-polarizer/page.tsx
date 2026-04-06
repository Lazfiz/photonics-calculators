import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Brewster Polarizer Design',
  description: 'Design Brewster-angle polarizers using tilted glass plates. At Brewster\',s angle, p-polarized light has zero reflection.'
};

export default function Page() {
  return <PageClient />;
}
