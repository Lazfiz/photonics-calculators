import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/signal-to-noise' },
    title: 'Signal-to-Noise Ratio',
  description: 'Detailed SNR model: shot noise, dark current, read noise, and detector noise contributions.'
};
const jsonLd = generateCalculatorJsonLd(
  `Signal-to-Noise Ratio',
  description: 'Detailed SNR model: shot noise, dark current, read noise, and detector noise contributions.'
};


const jsonLd = generateCalculatorJsonLd(
  'Signal-to-Noise Ratio',
  'Detailed SNR model: shot noise, dark current, read noise, and detector noise contributions.',
  'https://photonics-calculators.vercel.app/spectroscopy/signal-to-noise',
  { category: 'Spectroscopy`,
  `Detailed SNR model: shot noise, dark current, read noise, and detector noise contributions.'
};


const jsonLd = generateCalculatorJsonLd(
  'Signal-to-Noise Ratio',
  'Detailed SNR model: shot noise, dark current, read noise, and detector noise contributions.',
  'https://photonics-calculators.vercel.app/spectroscopy/signal-to-noise',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/signal-to-noise`,
  { category: `Spectroscopy` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
