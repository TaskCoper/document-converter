import * as React from "react";

export const useMediaQuery = (query: string) => {
  return React.useSyncExternalStore(
    (callback) => {
      const result = matchMedia(query);
      result.addEventListener("change", callback);
      return () => result.removeEventListener("change", callback);
    },
    () => matchMedia(query).matches,
    () => false,
  );
};
