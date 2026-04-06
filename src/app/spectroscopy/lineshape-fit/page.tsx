import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Lineshape Fitting',
  description: 'Voigt, Gaussian, and Lorentzian line profiles — compare convolution effects on spectral lines.'
};

export default function Page() {
  return <PageClient />;
}
