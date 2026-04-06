import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Transparency Range',
  description: 'UV cutoff to IR cutoff for common optical materials',
};

export default function Page() {
  return <PageClient />;
}
