export const themes = ["light", "dark", "spider-man"] as const;

export type Theme = (typeof themes)[number];

export const themeStorageKey = "document-first.theme";
export const themeChangeEvent = "document-first:theme-change";

const isTheme = (value: string | null): value is Theme =>
  themes.some((theme) => theme === value);

export const readStoredTheme = (): Theme => {
  const storedTheme = window.localStorage.getItem(themeStorageKey);
  return isTheme(storedTheme) ? storedTheme : "light";
};

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;

  root.dataset.theme = theme;
  root.classList.toggle("dark", theme !== "light");
  root.classList.toggle("spider-man", theme === "spider-man");
};

export const saveTheme = (theme: Theme) => {
  window.localStorage.setItem(themeStorageKey, theme);
  applyTheme(theme);
  window.dispatchEvent(
    new CustomEvent<Theme>(themeChangeEvent, { detail: theme }),
  );
};

export const initializeTheme = () => applyTheme(readStoredTheme());
