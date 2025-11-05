// utils/object.util.ts

/**
 * Safe JSON stringify function that ensures proper serialization.
 * Catches circular references and other stringification errors.
 * 
 * @param data - The object to stringify.
 * @returns A stringified JSON, or an error message if stringification fails.
 */
export const jsonStringify = (data: object): string => {
    try {
      return JSON.stringify(data, null, 2); // Pretty-print with 2 spaces
    } catch (error) {
      // Handle circular references or other errors in JSON.stringify
      return `JSON stringify error: ${(error as Error).message}`;
    }
  };
  