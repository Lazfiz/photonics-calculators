import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'FSO Link Budget',
  description: 'Interactive free-space optical link budget with sliders, presets, and received-power versus range view.'
};

export default function Page() {
  return <PageClient />;
}
