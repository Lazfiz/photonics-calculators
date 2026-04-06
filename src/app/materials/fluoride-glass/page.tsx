import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fluoride Glass (ZBLAN)',
  description: 'Heavy-metal fluoride glasses for mid-IR fiber optics and low-loss transmission',
};

export default function Page() {
  return <PageClient />;
}
