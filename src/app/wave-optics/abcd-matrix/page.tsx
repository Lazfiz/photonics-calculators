import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'ABCD Matrix Calculator',
  description: 'Build an optical system from sequential elements and compute the ray transfer matrix.'
};

export default function Page() {
  return <PageClient />;
}
