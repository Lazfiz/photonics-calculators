import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Sputtering Deposition',
  description: 'Calculate sputter yield, deposition rate, thermalization, and film stress for magnetron sputtering processes.'
};

export default function Page() {
  return <PageClient />;
}
