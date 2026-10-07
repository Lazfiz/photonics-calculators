import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/channel-capacity' },
    title: 'FSO Channel Capacity',
  description: 'Shannon capacity, achievable rate of OOK, PSK and 16-QAM after FEC overhead, gap to Shannon and required SNR for a given bandwidth and SNR.'
};

const jsonLd = generateCalculatorJsonLd(
  'FSO Channel Capacity',
  'Shannon capacity, achievable rate of OOK, PSK and 16-QAM after FEC overhead, gap to Shannon and required SNR for a given bandwidth and SNR.',
  'https://photonics-calculators.vercel.app/free-space-comms/channel-capacity',
  { category: 'Free Space Comms' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
