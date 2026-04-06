import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Connector Insertion Loss',
  description: 'Calculate connector insertion loss from misalignment parameters and build link budgets for different connector types.'
};

export default function Page() {
  return <PageClient />;
}
