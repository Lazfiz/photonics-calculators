import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Laser Classification',
  description: 'Simplified laser classification per IEC 60825-1. For educational use only.'
};

export default function Page() {
  return <PageClient />;
}
