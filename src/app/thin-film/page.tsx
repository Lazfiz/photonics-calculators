import CategoryIndex, { categoryMetadata } from "../../components/category-index";

export const metadata = categoryMetadata("thin-film");

export default function ThinFilmPage() {
  return <CategoryIndex id="thin-film" />;
}
