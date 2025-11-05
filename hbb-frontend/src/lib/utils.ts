// lib/utils.ts - Utility functions for handling utility functions
import { type ClassValue, clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const onSubmitError = (errors: any) => {
  const getFirstErrorMessage: any = (errorObject: any) => {
    const firstErrorKey = Object.keys(errorObject)[0];
    const firstErrorValue = errorObject[firstErrorKey];

    if (
      firstErrorValue &&
      typeof firstErrorValue === "object" &&
      !firstErrorValue.message
    ) {
      // If the error value is an object and doesn't have a 'message' property, it's a nested error
      return getFirstErrorMessage(firstErrorValue);
    } else {
      // If it's a direct error or the nested error with a 'message' property
      return { key: firstErrorKey, message: firstErrorValue.message };
    }
  };
  const firstError = getFirstErrorMessage(errors);
  const firstErrorKey = Object.keys(errors)?.[0];

  toast.error(` ${firstError.message}`);
};

// src/lib/utils/currency.ts

/**
 * Formats a raw currency input string into a display-friendly format
 * @param value - The raw input string (e.g., "1234.56" or "1,234.56")
 * @returns Formatted currency string (e.g., "1,234.56")
 */
export const formatCurrencyInput = (value: string): string => {
  // Remove all non-digit characters except decimal point
  const sanitizedValue = value.replace(/[^\d.]/g, '');

  // Split into whole and decimal parts
  const [wholePart = '', decimalPart = ''] = sanitizedValue.split('.');

  // Format whole number part with commas
  const formattedWhole = wholePart
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    .substring(0, 12); // Limit to 12 digits to prevent overflow

  // Limit decimal places to 2 and remove extra digits
  const formattedDecimal = decimalPart.substring(0, 2);

  // Combine parts (only include decimal if user has typed it)
  return decimalPart 
    ? `${formattedWhole}.${formattedDecimal}`
    : formattedWhole;
};

/**
 * Parses a formatted currency string into a number
 * @param value - Formatted currency string (e.g., "1,234.56")
 * @returns Parsed number (e.g., 1234.56) or NaN if invalid
 */
export const parseCurrencyInput = (value: string): number => {
  if (!value) return NaN;

  // Remove all non-digit characters except decimal point
  const numericString = value.replace(/[^\d.]/g, '');

  // Parse to float and round to 2 decimal places to avoid floating point issues
  const parsedValue = parseFloat(numericString);
  return isNaN(parsedValue) ? NaN : Math.round(parsedValue * 100) / 100;
};

/**
 * Validates if a string is a valid currency amount
 * @param value - The input string to validate
 * @returns Boolean indicating if the input is valid
 */
export const validateCurrencyInput = (value: string): boolean => {
  if (!value) return false;
  
  // Test for valid currency format (optional $, commas, decimal with 2 places)
  return /^\$?\d{1,3}(,\d{3})*(\.\d{0,2})?$/.test(value) && 
    parseCurrencyInput(value) > 0;
};

// Optional: Currency display formatter using Intl API
export const formatCurrencyDisplay = (
  value: number,
  locale: string = 'en-US',
  currency: string = 'USD'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};