"use client";

import { useSettings } from "@/context/SettingsContext";
import { useState } from "react";
import { FaDesktop, FaGlobeAmericas } from 'react-icons/fa';
import { HiPhotograph } from 'react-icons/hi';
import { TbWifi } from 'react-icons/tb';

// Badge preview component
const BadgePreview = ({ children, color, title, description, isEnabled, onToggle }) => {
  return (
    <div className="flex items-start justify-between border-b border-accent-secondary pb-4 mb-4">
      <div className="flex-1">
        <div className="flex items-center mb-2">
          <span className={`flex items-center justify-center px-2 py-0.5 rounded-full ${color} text-white text-xs mr-3`}>
            {children}
          </span>
          <h3 className="font-medium">{title}</h3>
        </div>
        <p className="text-xs text-accent mb-1">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full shrink-0 ml-4 ${
          isEnabled ? "bg-accent" : "bg-accent-secondary"
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
            isEnabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
};

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
            <p className="text-accent mb-6">Badges appear on game cards to provide additional information about games.</p>
            
            <BadgePreview 
              color="bg-green-500" 
              title="Cached Badge" 
              description="Shows in the top-left of the game cover when an image is loaded from cache. This means the image was previously downloaded and stored locally."
              isEnabled={badgeSettings.showNetworkBadges}
              onToggle={() => updateBadgeSetting("showNetworkBadges", !badgeSettings.showNetworkBadges)}
            >
              <span className="flex items-center">
                Cached
              </span>
            </BadgePreview>
            
            <BadgePreview 
              color="bg-pink-500" 
              title="Fresh Badge" 
              description="Shows in the top-right of the game cover when an image is newly downloaded from an external API (like Wikipedia)."
              isEnabled={badgeSettings.showNetworkBadges}
              onToggle={() => updateBadgeSetting("showNetworkBadges", !badgeSettings.showNetworkBadges)}
            >
              <span className="flex items-center">
                <TbWifi className="mr-0.5" size={12} />
                Fresh
              </span>
            </BadgePreview>
            
            <BadgePreview 
              color="bg-blue-600" 
              title="Local Badge" 
              description="Appears when a game is stored locally on your device rather than being streamed or downloaded."
              isEnabled={badgeSettings.showLocalBadges}
              onToggle={() => updateBadgeSetting("showLocalBadges", !badgeSettings.showLocalBadges)}
            >
              <span className="flex items-center">
                <FaDesktop className="mr-0.5" size={12} />
                Local
              </span>
            </BadgePreview>
            
            <BadgePreview 
              color="bg-blue-600" 
              title="Region Badges" 
              description="Shows the game's region (USA, Japan, Europe, etc.). Different regions are color-coded: USA (blue), Japan (red), Europe (yellow), etc."
              isEnabled={badgeSettings.showRegionBadges}
              onToggle={() => updateBadgeSetting("showRegionBadges", !badgeSettings.showRegionBadges)}
            >
              <span className="flex items-center">
                <FaGlobeAmericas className="mr-0.5" size={12} />
                USA
              </span>
            </BadgePreview>
            
            <BadgePreview 
              color="bg-purple-600" 
              title="Image Source Badge" 
              description="Shows where the game cover image was sourced from (Wiki, TGDB, ScreenScraper, etc.)."
              isEnabled={badgeSettings.showImageSourceBadges}
              onToggle={() => updateBadgeSetting("showImageSourceBadges", !badgeSettings.showImageSourceBadges)}
            >
              <span className="flex items-center">
                <HiPhotograph className="mr-0.5" size={12} />
                Wiki
              </span>
            </BadgePreview>
          </div>
        )}
      </div>
    </div>
  );
} 