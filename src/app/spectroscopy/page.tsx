import CategoryIndex, { categoryMetadata } from "../../components/category-index";

export const metadata = categoryMetadata("spectroscopy");

export default function SpectroscopyPage() {
  return <CategoryIndex id="spectroscopy" />;
}
