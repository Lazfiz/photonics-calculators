import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Pulse Compression',
  description: 'Transform-limited pulse compression via chirp compensation.'
};

export default function Page() {
  return <PageClient />;
}
