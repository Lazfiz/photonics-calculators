import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Injection Locking',
  description: 'Phase-locking a slave laser to a master laser through optical injection.'
};

export default function Page() {
  return <PageClient />;
}
