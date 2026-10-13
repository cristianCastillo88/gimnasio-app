import { useState, useEffect, useCallback } from "react";

export type Theme = "dark" | "light" | "system";

const THEME_STORAGE_KEY = "gymapp_theme";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "dark";
  });

  const getEffectiveTheme = useCallback((currentTheme: Theme): "dark" | "light" => {
    if (currentTheme === "system") {
      if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
      }
      return "dark";
    }
    return currentTheme;
  }, []);

  const [effectiveTheme, setEffectiveTheme] = useState<"dark" | "light">(() => getEffectiveTheme(theme));

  useEffect(() => {
    const calculated = getEffectiveTheme(theme);
    setEffectiveTheme(calculated);

    // Aplicar atributo a la raíz html
    document.documentElement.setAttribute("data-theme", calculated);

    // Sincronizar meta theme-color para la PWA (barra de estado y notch móvil)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const colorValue = calculated === "light" ? "#f8fafc" : "#09090b";
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", colorValue);
    }

    // Persistir preferencia
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignorar si el almacenamiento local está restringido
    }
  }, [theme, getEffectiveTheme]);

  // Listener para cambios de tema en el sistema operativo si está en modo "system"
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => {
      const calculated = mediaQuery.matches ? "light" : "dark";
      setEffectiveTheme(calculated);
      document.documentElement.setAttribute("data-theme", calculated);
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", calculated === "light" ? "#f8fafc" : "#09090b");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const calculated = getEffectiveTheme(prev);
      return calculated === "dark" ? "light" : "dark";
    });
  }, [getEffectiveTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  return {
    theme,
    effectiveTheme,
    isDark: effectiveTheme === "dark",
    toggleTheme,
    setTheme,
  };
}
