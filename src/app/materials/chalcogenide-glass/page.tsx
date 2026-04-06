import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Chalcogenide Glass Properties',
  description: 'IR-transparent glasses for thermal imaging, sensing, and nonlinear optics',
};

export default function Page() {
  return <PageClient />;
}
