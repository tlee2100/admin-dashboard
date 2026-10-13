import { useState, useEffect } from "react";

/**
 * Extracts initial filter value from URL search params formatted by Refine.
 * E.g. filters[0][field]=name&filters[0][value]=John
 */
export function getInitialFilter(
  field: string,
  defaultValue: string = "",
): string {
  if (typeof window === "undefined") return defaultValue;
  const params = new URLSearchParams(window.location.search);
  for (const [key, val] of params.entries()) {
    if (key.includes("[field]") && val === field) {
      const match = key.match(/filters\[(\d+)\]/);
      if (match) {
        return params.get(`filters[${match[1]}][value]`) || defaultValue;
      }
    }
  }
  return defaultValue;
}

/**
 * Hook to manage a search input with debouncing and initial value extracted from URL params.
 */
export function useDebouncedFilter(
  field: string,
  defaultValue: string = "",
  delay: number = 300,
) {
  const [value, setValue] = useState(() =>
    getInitialFilter(field, defaultValue),
  );
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return [value, setValue, debouncedValue] as const;
}
