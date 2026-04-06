import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Avalanche Photodiode Gain',
  description: 'APD multiplication gain, excess noise factor (McIntyre), and material comparison.'
};

export default function Page() {
  return <PageClient />;
}
