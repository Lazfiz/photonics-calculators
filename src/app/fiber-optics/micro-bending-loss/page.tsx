import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Microbending Loss',
  description: 'Calculate microbending-induced loss from random perturbations, coating properties, and fiber parameters.'
};

export default function Page() {
  return <PageClient />;
}
