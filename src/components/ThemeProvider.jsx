"use client";

import { useSettings } from "@/context/SettingsContext";
import { themes } from "@/context/SettingsContext";

export default function ThemeProvider({ children }) {
  const { currentTheme } = useSettings();
  const theme = themes[currentTheme] || themes.default;

  if (!theme) {
    return <div className="min-h-screen bg-black">{children}</div>;
  }

  return (
    <div
      style={{
        "--primary": theme.colors.primary,
        "--main": theme.colors.main,
        "--accent": theme.colors.accent,
        "--accent-secondary": theme.colors["accent-secondary"],
        "--error": theme.colors.error,
        "--success": theme.colors.success,
      }}
      className="min-h-screen bg-main transition-colors duration-300"
    >
      {children}
    </div>
  );
} 