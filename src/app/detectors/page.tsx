import CategoryIndex, { categoryMetadata } from "../../components/category-index";

export const metadata = categoryMetadata("detectors");

export default function DetectorsPage() {
  return <CategoryIndex id="detectors" />;
}
