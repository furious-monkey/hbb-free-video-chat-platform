import * as React from "react";
import { cn } from "@/src/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  numberOnly?: boolean;
  eyeToggleColor?: string;
  benefits?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, numberOnly, benefits, value, onChange, eyeToggleColor, ...props },
    ref
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const [inputValue, setInputValue] = React.useState<string>(
      (value as string) || ""
    );

    const togglePasswordVisibility = () => {
      setIsPasswordVisible(!isPasswordVisible);
    };

    const formatNumber = (value: string) => {
      // Remove any non-numeric characters except for the period (.)
      const cleanedValue = value.replace(/[^\d.]/g, "");

      // Format the number with commas
      const parts = cleanedValue.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let formattedValue = e.target.value;

      if (numberOnly) {
        formattedValue = formatNumber(formattedValue);
        setInputValue(formattedValue);
      }

      // Pass the formatted value to the parent component if onChange is provided
      if (onChange) {
        const event = {
          ...e,
          target: { ...e.target, value: formattedValue },
        };
        onChange(event as React.ChangeEvent<HTMLInputElement>);
      }
    };

    // Sync internal state with value prop changes (for controlled components)
    React.useEffect(() => {
      if (value !== undefined) {
        setInputValue(value as string);
      }
    }, [value]);

    return (
      <div className="relative flex items-center w-full">
        <input
          type={type === "password" && isPasswordVisible ? "text" : type}
          value={inputValue}
          className={cn(
            `"flex !h-11 w-full rounded-md  bg-transparent ${
              benefits
                ? "px-3 py-6"
                : "px-3 py-2 border border-placeholderText2 file:border-0 "
            } text-xs ring-offset-placeholderText2 file:bg-transparent file:text-sm file:font-medium placeholder:text-placeholderText2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            ${className}`
          )}
          ref={ref}
          onChange={handleChange}
          {...props}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-placeholderText2 focus:outline-none"
          >
            {isPasswordVisible ? <EyeOff color={eyeToggleColor ? eyeToggleColor: "#F3F3F3"} size={16} /> : <Eye size={16} color={eyeToggleColor ? eyeToggleColor: "#F3F3F3"} />}
          </button>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
