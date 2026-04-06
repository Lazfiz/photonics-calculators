import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Working Distance Calculator',
  description: 'Calculate working distance from objective focal length and magnification.'
};

export default function Page() {
  return <PageClient />;
}
