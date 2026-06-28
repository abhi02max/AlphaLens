import { useState, useEffect } from 'react';

/**
 * Custom hook to delay the update of a value until after a specified delay has passed.
 * Useful for preventing API spam when a user is typing in a search input.
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timer to update the debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: clears the timer if the value changes before the delay finishes.
    // This is the core mechanic of debouncing.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
