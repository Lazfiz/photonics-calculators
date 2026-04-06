import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Confocal Pinhole Size',
  description: 'Optimal pinhole 1 Airy unit (dAU/M). Trade-off: resolution vs signal.'
};

export default function Page() {
  return <PageClient />;
}
