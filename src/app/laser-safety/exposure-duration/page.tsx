import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Maximum Safe Exposure Duration',
  description: 'Calculate the maximum safe exposure time for a CW laser beam based on MPE limits.'
};

export default function Page() {
  return <PageClient />;
}
