// frontend/src/app/(dashboard)/dashboard/explorer/live/Categories.tsx - Categories component for handling live streaming
"use client";

import React, { useState, useCallback, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SearchCategoryCard from "@/src/components/app-reusables/SearchCategoryCard";

const CategoriesComponent: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  const initialCategories = searchParams.get("categories")?.split(",") || [];
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);

  const updateQueryParams = useCallback(
    (categories: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (categories.length > 0) {
        params.set("categories", categories.join(","));
      } else {
        params.delete("categories");
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleCategorySelect = (categoryIds: string[]) => {
    setSelectedCategories(categoryIds);
    updateQueryParams(categoryIds);
  };



  return (
    <div className="relative w-full flex items-center">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide w-full mb-4"
      >
        <SearchCategoryCard onCategorySelect={handleCategorySelect} />
      </div>

     
    </div>
  );
};

export default CategoriesComponent;
