import { useEffect, useState } from 'react';

export default function useDebouncedValue(
  value,
  delay = 400,
) {
  const [debouncedValue, setDebouncedValue] =
    useState(value);

  useEffect(() => {
    if (delay <= 0) {
      setDebouncedValue(value);
      return undefined;
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}