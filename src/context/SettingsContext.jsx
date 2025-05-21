"use client";

import { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext();

export const themes = {
  default: {
    name: "Default Theme",
    colors: {
      primary: "#071D2C",
      main: "#031322",
      accent: "#446171",
      "accent-secondary": "#0A2737",
      error: "#dc2626",
      success: "#16a34a"
    }
  },
  dev: {
    name: "Dev Theme",
    colors: {
      primary: "#1A1A1A",
      main: "#1A1A1A",
      accent: "#FFD93D",
      "accent-secondary": "#0A2737",
      error: "#FF6B6B",
      success: "#16a34a"
    }
  }
};

export function SettingsProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState("default");
  const [badgeSettings, setBadgeSettings] = useState({
    showRegionBadges: true,
    showNetworkBadges: true,
    showLocalBadges: true,
    showImageSourceBadges: true
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedTheme = localStorage.getItem("theme");
    const savedBadgeSettings = localStorage.getItem("badgeSettings");
    
    if (savedTheme) setCurrentTheme(savedTheme);
    if (savedBadgeSettings) setBadgeSettings(JSON.parse(savedBadgeSettings));
  }, []);

  const updateTheme = (themeName) => {
    setCurrentTheme(themeName);
    localStorage.setItem("theme", themeName);
  };

  const updateBadgeSetting = (setting, value) => {
    const newSettings = { ...badgeSettings, [setting]: value };
    setBadgeSettings(newSettings);
    localStorage.setItem("badgeSettings", JSON.stringify(newSettings));
  };

  return (
    <SettingsContext.Provider
      value={{
        currentTheme,
        themes,
        updateTheme,
        badgeSettings,
        updateBadgeSetting
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
} 