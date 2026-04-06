import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Cooling Benefit Calculator',
  description: 'Dark current reduction and SNR improvement from thermoelectric (TEC) or cryogenic cooling.'
};

export default function Page() {
  return <PageClient />;
}
