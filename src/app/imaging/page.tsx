import CategoryIndex, { categoryMetadata } from "../../components/category-index";

export const metadata = categoryMetadata("imaging");

export default function ImagingPage() {
  return <CategoryIndex id="imaging" />;
}
