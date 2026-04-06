import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Verdet Constant',
  description: 'Faraday rotation: = V B L, where V ∝ 1/² for paramagnetic materials',
};

export default function Page() {
  return <PageClient />;
}
