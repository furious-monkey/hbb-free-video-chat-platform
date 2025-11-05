import * as React from "react";
import { Input, InputProps } from "./input"

interface SearchInputProps extends InputProps {
  icon?: string; // Optional: Search icon path
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ icon = "/icons/search.svg" , ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full bg-white border border-[#E687A3] rounded-[6px]">
        <Input
          {...props}
          ref={ref}
          className={`pr-12 ${props.className} !border-none placeholder:!text-placeholderText2 !h-8 lg:!h-10`} 
        />
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2 h-6 w-[1px] bg-[#E687A3]"></div>
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
        >
          <img
            src={icon}
            alt="Search Icon"
            className="w-4 h-4 text-[#E687A3] hover:text-[#d96b89]"
          />
        </button>
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
