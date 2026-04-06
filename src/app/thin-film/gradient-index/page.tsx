import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Gradient Index Coating',
  description: 'Continuously graded refractive index coating — broadband AR with no sharp interfaces.'
};

export default function Page() {
  return <PageClient />;
}
