import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Digital Holography',
  description: 'Hologram recording, numerical reconstruction, resolution limits, and sampling criteria.'
};

export default function Page() {
  return <PageClient />;
}
