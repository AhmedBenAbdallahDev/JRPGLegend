"use client";
import { useState, useEffect } from "react";
import { HomeIcon, CubeIcon, DeviceTabletIcon, PhotoIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from 'next/link';
import { usePathname } from "next/navigation";
import { SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt, FaDice } from 'react-icons/fa';
import { FiImage, FiDatabase, FiSettings, FiBookOpen } from 'react-icons/fi';

export default function SideBarNav({ categoryMenu }) {
  const pathname = usePathname();
  
  // Initialize state with default values
  const [menuOpen, setMenuOpen] = useState(true);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [apiTestsOpen, setApiTestsOpen] = useState(true);
  const [nintendoOpen, setNintendoOpen] = useState(true);
  const [segaOpen, setSegaOpen] = useState(true);
  const [sonyOpen, setSonyOpen] = useState(true);
  const [otherOpen, setOtherOpen] = useState(true);
  const [isClient, setIsClient] = useState(false);
  
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
        if (typeof states.categoriesOpen === 'boolean') setCategoriesOpen(states.categoriesOpen);
        if (typeof states.nintendoOpen === 'boolean') setNintendoOpen(states.nintendoOpen);
        if (typeof states.segaOpen === 'boolean') setSegaOpen(states.segaOpen);
        if (typeof states.sonyOpen === 'boolean') setSonyOpen(states.sonyOpen);
        if (typeof states.otherOpen === 'boolean') setOtherOpen(states.otherOpen);
        if (typeof states.apiTestsOpen === 'boolean') setApiTestsOpen(states.apiTestsOpen);
      }
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
        categoriesOpen,
        nintendoOpen,
        segaOpen,
        sonyOpen,
        otherOpen,
        apiTestsOpen
      };
      localStorage.setItem('sidebarStates', JSON.stringify(states));
    } catch (error) {
      console.error("Error saving sidebar states:", error);
    }
  }, [isClient, menuOpen, categoriesOpen, nintendoOpen, segaOpen, sonyOpen, otherOpen, apiTestsOpen]);

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
    
    switch (slug) {
      case 'nes':
      case 'snes':
        return <FaGamepad size={iconSize} />;
      case 'n64':
        return <FaGamepad size={iconSize} />;
      case 'gb':
      case 'gbc':
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
        return <FaGamepad size={iconSize} />;
      default:
        return <FaGamepad size={iconSize} />;
    }
  };

  // Group categories by console type
  const groupCategories = (categories) => {
    if (!categories) return { nintendo: [], sega: [], sony: [], other: [] };
    
    const nintendo = [];
    const sega = [];
    const sony = [];
    const other = [];
    
    // Define the order for each console group
    const nintendoOrder = ['nes', 'snes', 'n64', 'gb', 'gbc', 'gba', 'nds'];
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
    
    categories.forEach(category => {
      switch (category.slug) {
        case 'nes':
        case 'snes':
        case 'n64':
        case 'gb':
        case 'gbc':
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
    });
    
    // Sort each group
    return {
      nintendo: sortByOrder(nintendo, nintendoOrder),
      sega: sortByOrder(sega, segaOrder),
      sony: sortByOrder(sony, sonyOrder),
      other
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
          <div className="ml-6 mt-1">
            {mainMenuItems.map((item, i) => (
              <Link
                key={i}
                href={item.slug}
                className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                  pathname === item.slug
                    ? "active bg-primary rounded-md"
                    : "incative hover:bg-primary rounded-md"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="mb-3">
        <div 
          className="flex items-center gap-2 p-1 text-sm font-medium cursor-pointer"
          onClick={() => setCategoriesOpen(!categoriesOpen)}
        >
          <DeviceTabletIcon className="w-5 h-5 text-accent" />
          <span>Categories</span>
          {categoriesOpen ? 
            <ChevronDownIcon className="w-3 h-3 ml-auto" /> : 
            <ChevronRightIcon className="w-3 h-3 ml-auto" />
          }
        </div>
        {categoriesOpen && (
          <div className="ml-6 mt-1">
            {/* Nintendo Categories */}
            {groupedCategories.nintendo.length > 0 && (
              <div className="mb-3">
                <div 
                  className="flex items-center gap-2 p-1 text-sm font-medium cursor-pointer"
                  onClick={() => setNintendoOpen(!nintendoOpen)}
                >
                  <FaGamepad className="text-accent" />
                  <span>Nintendo</span>
                  {nintendoOpen ? 
                    <ChevronDownIcon className="w-3 h-3 ml-auto" /> : 
                    <ChevronRightIcon className="w-3 h-3 ml-auto" />
                  }
                </div>
                
                {nintendoOpen && (
                  <ul className="bg-muted flex flex-col gap-1 ml-6 mt-1">
                    {groupedCategories.nintendo.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/category/${item.slug}`}
                          className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                            pathname === `/category/${item.slug}`
                              ? "active bg-primary rounded-md"
                              : "incative hover:bg-primary rounded-md"
                          }`}
                        >
                          <div className="text-accent">
                            {getCategoryIcon(item.slug)}
                          </div>
                          {item.title}{" "}
                          <span className="text-accent text-xs ml-auto">({item?.games?.length || 0})</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {/* Sega Categories */}
            {groupedCategories.sega.length > 0 && (
              <div className="mb-3">
                <div 
                  className="flex items-center gap-2 p-1 text-sm font-medium cursor-pointer"
                  onClick={() => setSegaOpen(!segaOpen)}
                >
                  <SiSega className="text-accent" />
                  <span>Sega</span>
                  {segaOpen ? 
                    <ChevronDownIcon className="w-3 h-3 ml-auto" /> : 
                    <ChevronRightIcon className="w-3 h-3 ml-auto" />
                  }
                </div>
                
                {segaOpen && (
                  <ul className="bg-muted flex flex-col gap-1 ml-6 mt-1">
                    {groupedCategories.sega.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/category/${item.slug}`}
                          className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                            pathname === `/category/${item.slug}`
                              ? "active bg-primary rounded-md"
                              : "incative hover:bg-primary rounded-md"
                          }`}
                        >
                          <div className="text-accent">
                            {getCategoryIcon(item.slug)}
                          </div>
                          {item.title}{" "}
                          <span className="text-accent text-xs ml-auto">({item?.games?.length || 0})</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {/* Sony Categories */}
            {groupedCategories.sony.length > 0 && (
              <div className="mb-3">
                <div 
                  className="flex items-center gap-2 p-1 text-sm font-medium cursor-pointer"
                  onClick={() => setSonyOpen(!sonyOpen)}
                >
                  <SiPlaystation className="text-accent" />
                  <span>Sony</span>
                  {sonyOpen ? 
                    <ChevronDownIcon className="w-3 h-3 ml-auto" /> : 
                    <ChevronRightIcon className="w-3 h-3 ml-auto" />
                  }
                </div>
                
                {sonyOpen && (
                  <ul className="bg-muted flex flex-col gap-1 ml-6 mt-1">
                    {groupedCategories.sony.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/category/${item.slug}`}
                          className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                            pathname === `/category/${item.slug}`
                              ? "active bg-primary rounded-md"
                              : "incative hover:bg-primary rounded-md"
                          }`}
                        >
                          <div className="text-accent">
                            {getCategoryIcon(item.slug)}
                          </div>
                          {item.title}{" "}
                          <span className="text-accent text-xs ml-auto">({item?.games?.length || 0})</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {/* Other Categories */}
            {groupedCategories.other.length > 0 && (
              <div className="mb-3">
                <div 
                  className="flex items-center gap-2 p-1 text-sm font-medium cursor-pointer"
                  onClick={() => setOtherOpen(!otherOpen)}
                >
                  <FaDice className="text-accent" />
                  <span>Other</span>
                  {otherOpen ? 
                    <ChevronDownIcon className="w-3 h-3 ml-auto" /> : 
                    <ChevronRightIcon className="w-3 h-3 ml-auto" />
                  }
                </div>
                
                {otherOpen && (
                  <ul className="bg-muted flex flex-col gap-1 ml-6 mt-1">
                    {groupedCategories.other.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/category/${item.slug}`}
                          className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                            pathname === `/category/${item.slug}`
                              ? "active bg-primary rounded-md"
                              : "incative hover:bg-primary rounded-md"
                          }`}
                        >
                          <div className="text-accent">
                            {getCategoryIcon(item.slug)}
                          </div>
                          {item.title}{" "}
                          <span className="text-accent text-xs ml-auto">({item?.games?.length || 0})</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* API Test Pages */}
      <div className="mb-3">
        <div 
          className="flex items-center gap-2 p-1 text-sm font-medium cursor-pointer"
          onClick={() => setApiTestsOpen(!apiTestsOpen)}
        >
          <FiSettings className="w-5 h-5 text-accent" />
          <span>API Tests</span>
          {apiTestsOpen ? 
            <ChevronDownIcon className="w-3 h-3 ml-auto" /> : 
            <ChevronRightIcon className="w-3 h-3 ml-auto" />
          }
        </div>
        {apiTestsOpen && (
          <div className="ml-6 mt-1">
            <Link
              href="/test-screenscraper"
              className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                pathname === "/test-screenscraper"
                  ? "active bg-primary rounded-md"
                  : "incative hover:bg-primary rounded-md"
              }`}
            >
              <FiImage className="w-4 h-4" />
              <span>ScreenScraper Test</span>
            </Link>
            <Link
              href="/test-wiki-image-extraction"
              className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                pathname === "/test-wiki-image-extraction"
                  ? "active bg-primary rounded-md"
                  : "incative hover:bg-primary rounded-md"
              }`}
            >
              <FiImage className="w-4 h-4" />
              <span>Wiki Image Test</span>
            </Link>
            <Link
              href="/thegamesdb-test"
              className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                pathname === "/thegamesdb-test"
                  ? "active bg-primary rounded-md"
                  : "incative hover:bg-primary rounded-md"
              }`}
            >
              <FiDatabase className="w-4 h-4" />
              <span>TheGamesDB Test</span>
            </Link>
            <Link
              href="/wikipedia-test"
              className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                pathname === "/wikipedia-test"
                  ? "active bg-primary rounded-md"
                  : "incative hover:bg-primary rounded-md"
              }`}
            >
              <FiBookOpen className="w-4 h-4" />
              <span>Wikipedia Test</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
