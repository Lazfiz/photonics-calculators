"use client";

import { useState, useEffect } from "react";
import type { SearchItem } from "./search-index-types";

export function useSearchIndex(): SearchItem[] {
  const [searchIndex, setSearchIndex] = useState<SearchItem[]>([]);
  useEffect(() => {
    fetch("/search-index.json")
      .then(r => r.json())
      .then((data: SearchItem[]) => setSearchIndex(data))
      .catch(() => {});
  }, []);
  return searchIndex;
}
