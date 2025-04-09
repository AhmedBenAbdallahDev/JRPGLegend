"use client";
import { useState, useEffect } from "react";
import { HomeIcon, CubeIcon, DeviceTabletIcon, PhotoIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from 'next/link';
import { usePathname } from "next/navigation";
import { SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt, FaDice, FaLaptop } from 'react-icons/fa';
import { FiSettings } from 'react-icons/fi';
import { getOfflineCategoriesForMenu } from "@/lib/offlineGames";

export default function SideBarNav({ categoryMenu }) {
  const pathname = usePathname();
  
  // Initialize state with default values
  const [menuOpen, setMenuOpen] = useState(true);
  const [nintendoOpen, setNintendoOpen] = useState(true);
  const [segaOpen, setSegaOpen] = useState(true);
  const [sonyOpen, setSonyOpen] = useState(true);
  const [otherOpen, setOtherOpen] = useState(true);
  const [offlineOpen, setOfflineOpen] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [offlineCategories, setOfflineCategories] = useState([]);
  
  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Load saved states from localStorage on component mount
  useEffect(() => {
    if (!isClient) return;
    
    try {
      const savedStates = localStorage.getItem('sidebarStates');
      if (savedStates) {
        const states = JSON.parse(savedStates);
        
        // Only update if the saved value is a boolean
        if (typeof states.menuOpen === 'boolean') setMenuOpen(states.menuOpen);
        if (typeof states.nintendoOpen === 'boolean') setNintendoOpen(states.nintendoOpen);
        if (typeof states.segaOpen === 'boolean') setSegaOpen(states.segaOpen);
        if (typeof states.sonyOpen === 'boolean') setSonyOpen(states.sonyOpen);
        if (typeof states.otherOpen === 'boolean') setOtherOpen(states.otherOpen);
        if (typeof states.offlineOpen === 'boolean') setOfflineOpen(states.offlineOpen);
      }
      
      // Load offline categories
      const offlineItems = getOfflineCategoriesForMenu();
      setOfflineCategories(offlineItems);
    } catch (error) {
      console.error("Error loading sidebar states:", error);
    }
  }, [isClient]);

  // Save states to localStorage whenever they change
  useEffect(() => {
    if (!isClient) return;
    
    try {
      const states = {
        menuOpen,
        nintendoOpen,
        segaOpen,
        sonyOpen,
        otherOpen,
        offlineOpen
      };
      localStorage.setItem('sidebarStates', JSON.stringify(states));
    } catch (error) {
      console.error("Error saving sidebar states:", error);
    }
  }, [isClient, menuOpen, nintendoOpen, segaOpen, sonyOpen, otherOpen, offlineOpen]);

  const mainMenuItems = [
    {
      name: "Home",
      icon: HomeIcon,
      slug: "/",
    },
    {
      name: "New",
      icon: CubeIcon,
      slug: "/new-games",
    },
    {
      name: "Platforms",
      icon: DeviceTabletIcon,
      slug: "/platforms",
    },
    {
      name: "Local Games",
      icon: FaLaptop,
      slug: "/local-games",
    },
    {
      name: "Cover Manager",
      icon: PhotoIcon,
      slug: "/covers",
    },
    {
      name: "API Config",
      icon: FiSettings,
      slug: "/api-config",
    },
  ];

  // Function to get the appropriate icon for each platform category
  const getCategoryIcon = (slug) => {
    const iconSize = 24;
    
    // Check if this is an offline category
    if (slug && slug.startsWith('offline-')) {
      return <FaLaptop size={iconSize} />;
    }
    
    switch (slug) {
      case 'nes':
      case 'snes':
      case 'n64':
        return <FaGamepad size={iconSize} />;
      case 'gb-gbc': // Combined Game Boy category
      case 'gba':
        return <FaMobileAlt size={iconSize} />;
      case 'nds':
        return <FaGamepad size={iconSize} />;
      case 'genesis':
      case 'segacd':
      case 'saturn':
        return <SiSega size={iconSize} />;
      case 'psx':
      case 'psp':
        return <SiPlaystation size={iconSize} />;
      case 'arcade':
        return <FaDice size={iconSize} />;
      default:
        return <FaGamepad size={iconSize} />;
    }
  };

  // Group categories by console type and combine GB/GBC
  const groupCategories = (categories) => {
    if (!categories) return { nintendo: [], sega: [], sony: [], other: [], offline: [] };
    
    const nintendo = [];
    const sega = [];
    const sony = [];
    const other = [];
    const offline = [];
    
    // Define the order for each console group
    const nintendoOrder = ['nes', 'snes', 'n64', 'gb-gbc', 'gba', 'nds'];
    const segaOrder = ['genesis', 'segacd', 'saturn'];
    const sonyOrder = ['psx', 'psp'];
    
    // Helper function to sort by predefined order
    const sortByOrder = (items, orderArray) => {
      return [...items].sort((a, b) => {
        const indexA = orderArray.indexOf(a.slug);
        const indexB = orderArray.indexOf(b.slug);
        return indexA - indexB;
      });
    };
    
    // Add offline categories from localStorage
    if (isClient && offlineCategories.length > 0) {
      offlineCategories.forEach(category => {
        offline.push(category);
      });
    }
    
    // Combine GB and GBC categories
    let gbCategory = null;
    let gbcCategory = null;
    
    categories.forEach(category => {
      // Skip offline categories (they're already included)
      if (category.isOffline) {
        return;
      }
      
      if (category.slug === 'gb') {
        gbCategory = category;
      } else if (category.slug === 'gbc') {
        gbcCategory = category;
      } else {
        switch (category.slug) {
          case 'nes':
          case 'snes':
          case 'n64':
          case 'gba':
          case 'nds':
            nintendo.push(category);
            break;
          case 'genesis':
          case 'segacd':
          case 'saturn':
            sega.push(category);
            break;
          case 'psx':
          case 'psp':
            sony.push(category);
            break;
          default:
            other.push(category);
        }
      }
    });
    
    // Create combined GB/GBC category if either exists
    if (gbCategory || gbcCategory) {
      const combinedCategory = {
        slug: 'gb-gbc',
        title: 'Game Boy / Color',
        games: [
          ...(gbCategory?.games || []),
          ...(gbcCategory?.games || [])
        ]
      };
      nintendo.push(combinedCategory);
    }
    
    // Sort each group
    return {
      nintendo: sortByOrder(nintendo, nintendoOrder),
      sega: sortByOrder(sega, segaOrder),
      sony: sortByOrder(sony, sonyOrder),
      other,
      offline
    };
  };
  
  const groupedCategories = groupCategories(categoryMenu);

  return (
    <div className="flex flex-col gap-2">
      {/* Main Menu */}
      <div className="mb-3">
        <div 
          className="flex items-center gap-2 p-1 text-sm font-medium cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <HomeIcon className="w-5 h-5 text-accent" />
          <span>Main Menu</span>
          {menuOpen ? 
            <ChevronDownIcon className="w-3 h-3 ml-auto" /> : 
            <ChevronRightIcon className="w-3 h-3 ml-auto" />
          }
        </div>
        
        {menuOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {mainMenuItems.map((item) => (
              <Link
                key={item.slug}
                href={item.slug}
                className={`flex items-center gap-2 p-1 text-sm rounded-md hover:bg-accent/10 ${
                  pathname === item.slug ? "bg-accent/10 text-accent" : "text-gray-400"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Offline Games Section - Show only if there are offline categories */}
      {groupedCategories.offline.length > 0 && (
        <div className="mb-3">
          <div 
            className="flex items-center gap-2 p-1 text-sm font-medium cursor-pointer"
            onClick={() => setOfflineOpen(!offlineOpen)}
          >
            <FaLaptop className="w-5 h-5 text-accent" />
            <span>Offline Games</span>
            {offlineOpen ? 
              <ChevronDownIcon className="w-3 h-3 ml-auto" /> : 
              <ChevronRightIcon className="w-3 h-3 ml-auto" />
            }
          </div>
          
          {offlineOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {groupedCategories.offline.map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className={`flex items-center gap-2 p-1 text-sm rounded-md hover:bg-accent/10 ${
                    pathname === `/category/${category.slug}` ? "bg-accent/10 text-accent" : "text-gray-400"
                  }`}
                >
                  {getCategoryIcon(category.slug)}
                  <span>{category.title}</span>
                  <span className="ml-auto text-xs text-gray-500">({category.games?.length || 0})</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Nintendo Section */}
      <div className="mb-3">
        <div 
          className="flex items-center gap-2 p-1 text-sm font-medium cursor-pointer"
          onClick={() => setNintendoOpen(!nintendoOpen)}
        >
          <FaGamepad className="w-5 h-5 text-accent" />
          <span>Nintendo</span>
          {nintendoOpen ? 
            <ChevronDownIcon className="w-3 h-3 ml-auto" /> : 
            <ChevronRightIcon className="w-3 h-3 ml-auto" />
          }
        </div>
        
        {nintendoOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {groupedCategories.nintendo.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className={`flex items-center gap-2 p-1 text-sm rounded-md hover:bg-accent/10 ${
                  pathname === `/category/${category.slug}` ? "bg-accent/10 text-accent" : "text-gray-400"
                }`}
              >
                {getCategoryIcon(category.slug)}
                <span>{category.title}</span>
                <span className="ml-auto text-xs text-gray-500">({category.games?.length || 0})</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Sega Section */}
      <div className="mb-3">
        <div 
          className="flex items-center gap-2 p-1 text-sm font-medium cursor-pointer"
          onClick={() => setSegaOpen(!segaOpen)}
        >
          <SiSega className="w-5 h-5 text-accent" />
          <span>Sega</span>
          {segaOpen ? 
            <ChevronDownIcon className="w-3 h-3 ml-auto" /> : 
            <ChevronRightIcon className="w-3 h-3 ml-auto" />
          }
        </div>
        
        {segaOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {groupedCategories.sega.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className={`flex items-center gap-2 p-1 text-sm rounded-md hover:bg-accent/10 ${
                  pathname === `/category/${category.slug}` ? "bg-accent/10 text-accent" : "text-gray-400"
                }`}
              >
                {getCategoryIcon(category.slug)}
                <span>{category.title}</span>
                <span className="ml-auto text-xs text-gray-500">({category.games?.length || 0})</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Sony Section */}
      <div className="mb-3">
        <div 
          className="flex items-center gap-2 p-1 text-sm font-medium cursor-pointer"
          onClick={() => setSonyOpen(!sonyOpen)}
        >
          <SiPlaystation className="w-5 h-5 text-accent" />
          <span>Sony</span>
          {sonyOpen ? 
            <ChevronDownIcon className="w-3 h-3 ml-auto" /> : 
            <ChevronRightIcon className="w-3 h-3 ml-auto" />
          }
        </div>
        
        {sonyOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {groupedCategories.sony.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className={`flex items-center gap-2 p-1 text-sm rounded-md hover:bg-accent/10 ${
                  pathname === `/category/${category.slug}` ? "bg-accent/10 text-accent" : "text-gray-400"
                }`}
              >
                {getCategoryIcon(category.slug)}
                <span>{category.title}</span>
                <span className="ml-auto text-xs text-gray-500">({category.games?.length || 0})</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Other Section */}
      {groupedCategories.other.length > 0 && (
        <div className="mb-3">
          <div 
            className="flex items-center gap-2 p-1 text-sm font-medium cursor-pointer"
            onClick={() => setOtherOpen(!otherOpen)}
          >
            <FaDice className="w-5 h-5 text-accent" />
            <span>Other</span>
            {otherOpen ? 
              <ChevronDownIcon className="w-3 h-3 ml-auto" /> : 
              <ChevronRightIcon className="w-3 h-3 ml-auto" />
            }
          </div>
          
          {otherOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {groupedCategories.other.map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className={`flex items-center gap-2 p-1 text-sm rounded-md hover:bg-accent/10 ${
                    pathname === `/category/${category.slug}` ? "bg-accent/10 text-accent" : "text-gray-400"
                  }`}
                >
                  {getCategoryIcon(category.slug)}
                  <span>{category.title}</span>
                  <span className="ml-auto text-xs text-gray-500">({category.games?.length || 0})</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
