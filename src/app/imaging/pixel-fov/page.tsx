import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Pixel Field of View',
  description: 'Calculate the angular field of view per pixel from pixel size and focal length.'
};

export default function Page() {
  return <PageClient />;
}
