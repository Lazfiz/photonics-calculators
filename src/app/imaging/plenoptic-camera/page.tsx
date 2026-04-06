import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Plenoptic Camera Design',
  description: 'Light field camera parameters: spatial-angular tradeoff, refocusing range, and data budgets.'
};

export default function Page() {
  return <PageClient />;
}
