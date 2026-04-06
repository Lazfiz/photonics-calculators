import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Apodization Functions',
  description: 'Window functions and their instrument line shapes (ILS). Trade-off: resolution vs sidelobe suppression.'
};

export default function Page() {
  return <PageClient />;
}
