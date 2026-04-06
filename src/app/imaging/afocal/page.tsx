import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Afocal System Calculator',
  description: 'Design and analyze afocal (telescopic) relay systems — Keplerian and Galilean configurations.'
};

export default function Page() {
  return <PageClient />;
}
