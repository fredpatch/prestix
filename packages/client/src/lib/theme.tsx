import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
export type DarkVariant = "teal" | "blue" | "purple";

export const DARK_VARIANTS: { value: DarkVariant; label: string }[] = [
  { value: "teal", label: "Teal" },
  { value: "blue", label: "Bleu ardoise" },
  { value: "purple", label: "Violet profond" },
];

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  darkVariant: DarkVariant;
  setDarkVariant: (variant: DarkVariant) => void;
}

const STORAGE_KEY = "prestix_theme";
const VARIANT_STORAGE_KEY = "prestix_dark_variant";

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  darkVariant: "teal",
  setDarkVariant: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialVariant(): DarkVariant {
  const stored = localStorage.getItem(VARIANT_STORAGE_KEY);
  if (stored === "teal" || stored === "blue" || stored === "purple") return stored;
  return "teal";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [darkVariant, setDarkVariantState] = useState<DarkVariant>(getInitialVariant);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    // Safe to always set — .dark[data-theme="blue"] only takes effect
    // when the .dark class is also present, so this has no visible effect
    // in light mode, just keeps the two pieces of state in sync.
    if (darkVariant === "teal") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = darkVariant;
    }
    localStorage.setItem(VARIANT_STORAGE_KEY, darkVariant);
  }, [darkVariant]);

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  function setDarkVariant(variant: DarkVariant) {
    setDarkVariantState(variant);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, darkVariant, setDarkVariant }}>
      {children}
    </ThemeContext.Provider>
  );
}
