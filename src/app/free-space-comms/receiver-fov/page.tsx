import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Receiver FOV vs Background Noise',
  description: 'Analyze receiver field of view trade-offs against background radiation noise.'
};

export default function Page() {
  return <PageClient />;
}
