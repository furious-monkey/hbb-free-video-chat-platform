"use-client";

import React, { useCallback, useEffect, useState } from "react";
import { shallow } from "zustand/shallow";
import { useNoAuthStore } from "../../store/no-authStore";

interface IImageDetails {
  key: string;
  url: string;
  Location: string | null;
}

interface Category {
  id: string;
  name: string;
  imageUrl: string;
  imageDetails: IImageDetails;
}

interface CategoryCardProps {
  selectedCategories: string[]; // New prop for selected category IDs
  onCategorySelect: (categoryIds: string[]) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ selectedCategories, onCategorySelect }) => {
  const { fetchCategories, categories, loading } = useNoAuthStore(
    (state: any) => ({
      fetchCategories: state.fetchCategories,
      categories: state.categories,
      loading: state.loading,
    }),
    shallow
  );

  const [localSelectedCategories, setLocalSelectedCategories] = useState<Category[]>([]);

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

  useEffect(() => {
    if (categories) {
      console.log("Categories fetched:", categories);
    }
  }, [categories]);

  useEffect(() => {
    const preSelectedCategories = categories?.data?.filter((category: Category) =>
      selectedCategories.includes(category.id)
    );
    setLocalSelectedCategories(preSelectedCategories || []);
  }, [categories, selectedCategories]);

  const handleCategoryClick = (category: Category) => {
    const isSelected = localSelectedCategories.some(
      (selected) => selected.id === category.id
    );

    let updatedCategories;
    if (isSelected) {
      updatedCategories = localSelectedCategories?.filter(
        (selected) => selected.id !== category.id
      );
    } else if (localSelectedCategories.length < 3) {
      updatedCategories = [...localSelectedCategories, category];
    } else {
      updatedCategories = localSelectedCategories;
    }

    setLocalSelectedCategories(updatedCategories);

    const selectedCategoryIds = updatedCategories.map((cat) => cat.id);
    onCategorySelect(selectedCategoryIds);
  };

  const categoriesData = categories?.data;

  return (
    <div className="flex flex-wrap bg-white p-4 rounded-lg mt-1 gap-y-1">
      {Array.isArray(categoriesData) && categoriesData.length > 0 ? (
        categoriesData.map((category: Category) => {
          const isSelected = localSelectedCategories.some(
            (selected) => selected.id === category.id
          );
          return (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className={`flex items-center p-2 m-1 cursor-pointer rounded-3xl transition-colors duration-100 text-xs
              ${isSelected ? "bg-pink text-white" : "bg-[#FDF0F3] text-black"}`}
            >
              <img
                src={category?.imageUrl}
                alt={category.name}
                className="h-4 mr-1"
              />
              <span>{category.name}</span>
            </div>
          );
        })
      ) : (
        <p>Loading categories...</p>
      )}
    </div>
  );
};

export default CategoryCard;
