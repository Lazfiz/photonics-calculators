import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/pointing-error' },
    title: 'Pointing Error Loss',
  description: 'Calculate pointing loss from beam jitter for FSO links.'
};
const jsonLd = generateCalculatorJsonLd(
  `Pointing Error Loss',
  description: 'Calculate pointing loss from beam jitter for FSO links.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pointing Error Loss',
  'Calculate pointing loss from beam jitter for FSO links.',
  'https://photonics-calculators.vercel.app/free-space-comms/pointing-error',
  { category: 'Free Space Comms`,
  `Calculate pointing loss from beam jitter for FSO links.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pointing Error Loss',
  'Calculate pointing loss from beam jitter for FSO links.',
  'https://photonics-calculators.vercel.app/free-space-comms/pointing-error',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/pointing-error`,
  { category: `Free Space Comms` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
