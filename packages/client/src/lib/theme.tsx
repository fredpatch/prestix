import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
export type DarkVariant = "teal" | "blue" | "purple";
export type LightVariant = "neutral" | "warm" | "cool";

export const DARK_VARIANTS: { value: DarkVariant; label: string }[] = [
  { value: "teal", label: "Teal" },
  { value: "blue", label: "Bleu ardoise" },
  { value: "purple", label: "Violet profond" },
];

export const LIGHT_VARIANTS: { value: LightVariant; label: string }[] = [
  { value: "neutral", label: "Neutre" },
  { value: "warm", label: "Chaleureux" },
  { value: "cool", label: "Frais" },
];

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  darkVariant: DarkVariant;
  setDarkVariant: (variant: DarkVariant) => void;
  lightVariant: LightVariant;
  setLightVariant: (variant: LightVariant) => void;
}

const STORAGE_KEY = "prestix_theme";
const DARK_VARIANT_STORAGE_KEY = "prestix_dark_variant";
const LIGHT_VARIANT_STORAGE_KEY = "prestix_light_variant";

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  darkVariant: "teal",
  setDarkVariant: () => {},
  lightVariant: "neutral",
  setLightVariant: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialDarkVariant(): DarkVariant {
  const stored = localStorage.getItem(DARK_VARIANT_STORAGE_KEY);
  if (stored === "teal" || stored === "blue" || stored === "purple") return stored;
  return "teal";
}

function getInitialLightVariant(): LightVariant {
  const stored = localStorage.getItem(LIGHT_VARIANT_STORAGE_KEY);
  if (stored === "neutral" || stored === "warm" || stored === "cool") return stored;
  return "neutral";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [darkVariant, setDarkVariantState] = useState<DarkVariant>(getInitialDarkVariant);
  const [lightVariant, setLightVariantState] = useState<LightVariant>(getInitialLightVariant);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    // data-theme (dark variant) and data-light-theme (light variant) are
    // independent, both always kept in sync — each only has a visible
    // effect in its own mode (see the compound CSS selectors in
    // styles/index.css: `.dark[data-theme=...]` vs
    // `:root[data-light-theme=...]:not(.dark)`), so switching light/dark
    // never clobbers the other mode's saved preference.
    if (darkVariant === "teal") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = darkVariant;
    }
    localStorage.setItem(DARK_VARIANT_STORAGE_KEY, darkVariant);
  }, [darkVariant]);

  useEffect(() => {
    if (lightVariant === "neutral") {
      delete document.documentElement.dataset.lightTheme;
    } else {
      document.documentElement.dataset.lightTheme = lightVariant;
    }
    localStorage.setItem(LIGHT_VARIANT_STORAGE_KEY, lightVariant);
  }, [lightVariant]);

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  function setDarkVariant(variant: DarkVariant) {
    setDarkVariantState(variant);
  }

  function setLightVariant(variant: LightVariant) {
    setLightVariantState(variant);
  }

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, darkVariant, setDarkVariant, lightVariant, setLightVariant }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
