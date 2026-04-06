import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Hard Coating Design',
  description: 'Abrasion-resistant optical coating — balance mechanical hardness with optical performance.'
};

export default function Page() {
  return <PageClient />;
}
