import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/snr-averaging' },
    title: 'SNR Improvement with Co-Adding',
  description: 'SNR improves as N where N is the number of co-added scans. Signal adds linearly, noise as N.'
};
const jsonLd = generateCalculatorJsonLd(
  `SNR Improvement with Co-Adding',
  description: 'SNR improves as N where N is the number of co-added scans. Signal adds linearly, noise as N.'
};


const jsonLd = generateCalculatorJsonLd(
  'SNR Improvement with Co-Adding',
  'SNR improves as N where N is the number of co-added scans. Signal adds linearly, noise as N.',
  'https://photonics-calculators.vercel.app/spectroscopy/snr-averaging',
  { category: 'Spectroscopy`,
  `SNR improves as N where N is the number of co-added scans. Signal adds linearly, noise as N.'
};


const jsonLd = generateCalculatorJsonLd(
  'SNR Improvement with Co-Adding',
  'SNR improves as N where N is the number of co-added scans. Signal adds linearly, noise as N.',
  'https://photonics-calculators.vercel.app/spectroscopy/snr-averaging',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/snr-averaging`,
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
