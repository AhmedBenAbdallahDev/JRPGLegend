"use client";

import { useSettings } from "@/context/SettingsContext";
import { useState } from "react";

export default function SettingsPage() {
  const { currentTheme, themes, updateTheme, badgeSettings, updateBadgeSetting } = useSettings();
  const [activeTab, setActiveTab] = useState("appearance");

  return (
    <div className="min-h-screen bg-main p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-heading mb-6">Settings</h1>
        
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("appearance")}
            className={`px-4 py-2 rounded ${
              activeTab === "appearance"
                ? "bg-accent text-white"
                : "bg-accent-secondary text-gray-300"
            }`}
          >
            Appearance
          </button>
          <button
            onClick={() => setActiveTab("gameCards")}
            className={`px-4 py-2 rounded ${
              activeTab === "gameCards"
                ? "bg-accent text-white"
                : "bg-accent-secondary text-gray-300"
            }`}
          >
            Game Cards
          </button>
        </div>

        {/* Appearance Settings */}
        {activeTab === "appearance" && (
          <div className="bg-primary p-6 rounded-lg">
            <h2 className="text-xl font-heading mb-4">Theme</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => updateTheme(key)}
                  className={`p-4 rounded-lg border-2 transition-colors duration-300 ${
                    currentTheme === key
                      ? "border-accent bg-accent-secondary"
                      : "border-accent-secondary hover:bg-accent-secondary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-heading">{theme.name}</span>
                    {currentTheme === key && (
                      <span className="text-accent">✓</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: theme.colors.main }}
                    />
                  </div>
                  <div className="mt-4 p-4 rounded bg-main">
                    <h3 className="text-accent font-heading mb-2">Preview</h3>
                    <div className="space-y-2">
                      <div className="p-2 bg-primary rounded">Primary Background</div>
                      <div className="p-2 bg-accent text-black rounded">Accent Color</div>
                      <div className="p-2 bg-accent-secondary rounded">Secondary Accent</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Game Card Settings */}
        {activeTab === "gameCards" && (
          <div className="bg-primary p-6 rounded-lg">
            <h2 className="text-xl font-heading mb-4">Badge Visibility</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Region Badges</span>
                <button
                  onClick={() => updateBadgeSetting("showRegion", !badgeSettings.showRegion)}
                  className={`w-12 h-6 rounded-full ${
                    badgeSettings.showRegion ? "bg-accent" : "bg-accent-secondary"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                      badgeSettings.showRegion ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span>Cache Badges</span>
                <button
                  onClick={() => updateBadgeSetting("showCache", !badgeSettings.showCache)}
                  className={`w-12 h-6 rounded-full ${
                    badgeSettings.showCache ? "bg-accent" : "bg-accent-secondary"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                      badgeSettings.showCache ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span>Local Game Badges</span>
                <button
                  onClick={() => updateBadgeSetting("showLocal", !badgeSettings.showLocal)}
                  className={`w-12 h-6 rounded-full ${
                    badgeSettings.showLocal ? "bg-accent" : "bg-accent-secondary"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                      badgeSettings.showLocal ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span>Image Source Badges</span>
                <button
                  onClick={() => updateBadgeSetting("showImageSource", !badgeSettings.showImageSource)}
                  className={`w-12 h-6 rounded-full ${
                    badgeSettings.showImageSource ? "bg-accent" : "bg-accent-secondary"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                      badgeSettings.showImageSource ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 