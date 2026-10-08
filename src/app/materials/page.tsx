import CategoryIndex, { categoryMetadata } from "../../components/category-index";

export const metadata = categoryMetadata("materials");

export default function MaterialsPage() {
  return <CategoryIndex id="materials" />;
}
