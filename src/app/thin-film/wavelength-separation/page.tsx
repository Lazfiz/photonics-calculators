import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Wavelength Separation',
  description: 'Wavelength separation coatings combine multiple quarter-wave stacks at different design wavelengths',
};

export default function Page() {
  return <PageClient />;
}
