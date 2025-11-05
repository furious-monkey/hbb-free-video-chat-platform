"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useNoAuthStore } from "@/src/store/no-authStore";
import { shallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  imageUrl: string;
}

interface SearchCategoryCardProps {
  onCategorySelect: (categoryIds: string[]) => void;
}

const SearchCategoryCard: React.FC<SearchCategoryCardProps> = ({
  onCategorySelect,
}) => {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState({
    left: false,
    right: false,
  });

  // Fetch categories from API
  const { fetchCategories, categories, loading } = useNoAuthStore(
    (state: any) => ({
      fetchCategories: state.fetchCategories,
      categories: state.categories?.data || [], // Accessing data field
      loading: state.loading,
    }),
    shallow
  );

  const memoizedFetchCategories = useCallback(async () => {
    try {
      await fetchCategories();
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, [fetchCategories]);

  useEffect(() => {
    memoizedFetchCategories();
  }, [memoizedFetchCategories]);

  // Check if scrollable and update arrow visibility
  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowArrows({
        left: scrollLeft > 0,
        right: scrollLeft < scrollWidth - clientWidth,
      });
    }
  }, []);

  useEffect(() => {
    const currentRef = scrollRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", checkScroll);
      // Initial check
      checkScroll();
      // Add resize observer
      const resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(currentRef);
      return () => {
        currentRef.removeEventListener("scroll", checkScroll);
        resizeObserver.unobserve(currentRef);
      };
    }
  }, [checkScroll, categories]);

  const handleCategoryClick = (category: Category) => {
    const isAllCategory = category.name === "ALL";
    let updatedCategories;

    if (isAllCategory) {
      updatedCategories =
        selectedCategories.length === categories.length ? [] : categories;
    } else {
      const isSelected = selectedCategories.some(
        (selected) => selected.id === category.id
      );
      updatedCategories = isSelected
        ? selectedCategories.filter((selected) => selected.id !== category.id)
        : [...selectedCategories, category];
    }

    setSelectedCategories(updatedCategories);
    const selectedCategoryIds = updatedCategories.map((cat) => cat.id);
    onCategorySelect(selectedCategoryIds);
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "right" ? 200 : -200;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full">
      <div
        ref={scrollRef}
        className="flex items-center gap-x-4 overflow-x-auto scrollbar-hide pr-20 no-scrollbar pb-3 w-[96%]"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : categories.length > 0 ? (
          [
            { id: "all", name: "ALL", imageDetails: { url: "" } },
            ...categories,
          ].map((category: Category) => {
            if (!category.id || !category.name) {
              console.warn("Invalid category data:", category);
              return null;
            }

            const isSelected =
              (category.name === "ALL" && selectedCategories.length === categories.length) ||
              selectedCategories.some((selected) => selected.id === category.id);

            return (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={`inline-flex items-center justify-center cursor-pointer rounded-3xl mt-3 transition-colors duration-100 px-4 py-2 text-xs 
                ${
                  isSelected ? "bg-pink text-white" : "bg-[#FDF0F3] text-black"
                }`}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    handleCategoryClick(category);
                }}
              >
                {category.imageUrl && (
                  <img
                    src={category.imageUrl}
                    alt={category.name || "Category"}
                    className="w-4 h-4 mr-2"
                  />
                )}
                <span className="whitespace-nowrap lg:text-sm">
                  {category.name}
                </span>
              </div>
            );
          })
        ) : (
          <p>No categories available.</p>
        )}
      </div>

      {/* Desktop Arrows */}
      <div className="hidden lg:block">
        {showArrows.left && (
          <button
            onClick={() => scroll("left")}
            className="bg-[#447386] absolute left-0 top-1/2 transform -translate-y-1/2 bg-pink-500 text-white p-2 rounded-full shadow-md hover:bg-pink-600 transition-all duration-200"
          >
            <img src="/icons/right-arrow.svg" alt="Previous" className="w-6 h-6 rotate-180" />
          </button>
        )}
        {showArrows.right && (
          <button
            onClick={() => scroll("right")}
            className="bg-[#447386] absolute right-0 top-1/2 transform -translate-y-1/2 bg-pink-500 text-white p-2 rounded-full shadow-md hover:bg-pink-600 transition-all duration-200"
          >
            <img src="/icons/right-arrow.svg" alt="Next" className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchCategoryCard;