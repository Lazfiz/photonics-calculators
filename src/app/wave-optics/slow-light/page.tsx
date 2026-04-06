import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Slow Light Structures',
  description: 'Group velocity reduction in photonic crystals and EIT media.'
};

export default function Page() {
  return <PageClient />;
}
