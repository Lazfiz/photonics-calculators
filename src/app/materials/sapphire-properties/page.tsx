import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Sapphire (AlO₃) Properties',
  description: 'Uniaxial crystal. Sellmeier equations for ordinary and extraordinary rays.'
};

export default function Page() {
  return <PageClient />;
}
