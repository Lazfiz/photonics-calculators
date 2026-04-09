import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/free-space-comms/pointing-error",
    title: 'Pointing Error Loss',
  description: 'Calculate pointing loss from beam jitter for FSO links.'
};

export default function Page() {
  return <PageClient />;
}
