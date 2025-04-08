"use client";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CubeIcon,
  DeviceTabletIcon,
  PhotoIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FiDatabase, FiImage, FiBookOpen, FiSettings } from "react-icons/fi";
import { SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt } from 'react-icons/fa';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [categoryMenu, setCategoryMenu] = useState([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const activeSegment = "/"; // Placeholder - in a real app you would use usePathname() from next/navigation

  // State for collapsible sections
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [apiPagesOpen, setApiPagesOpen] = useState(false);
  
  // State for console groups
  const [nintendoOpen, setNintendoOpen] = useState(false);
  const [segaOpen, setSegaOpen] = useState(false);
  const [sonyOpen, setSonyOpen] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);

  // Fetch categories when the mobile nav is opened
  useEffect(() => {
    if (isOpen && !categoriesLoaded) {
      fetchCategories();
    }
  }, [isOpen, categoriesLoaded]);

  // Function to fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategoryMenu(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoaded(true);
    }
  };

  const mobileNavItems = [
    {
      name: "Home",
      path: "/",
      icon: HomeIcon,
      slug: null,
    },
    {
      name: "New",
      path: "/new-games",
      icon: CubeIcon,
      slug: "new-games",
    },
    {
      name: "Platforms",
      path: "/platforms",
      icon: DeviceTabletIcon,
      slug: "platforms",
    },
    {
      name: "Cover Manager",
      path: "/covers",
      icon: PhotoIcon,
      slug: "covers",
    },
    {
      name: "API Config",
      path: "/api-config",
      icon: FiSettings,
      slug: "api-config",
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
    if (!categories || categories.length === 0) return { nintendo: [], sega: [], sony: [], other: [] };
    
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
    <>
      {!isOpen ? (
        <button
          className="lg:hidden"
          onClick={() => setIsOpen(true)}
          aria-expanded="false"
          aria-controls="mobile-menu"
        >
          <Bars3Icon className="h-6 w-6" aria-label="Open Menu" />
        </button>
      ) : (
        <button
          className="lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-expanded="true"
          aria-controls="mobile-menu"
        >
          <XMarkIcon className="h-6 w-6" aria-label="Close Menu" />
        </button>
      )}

      {isOpen && (
        <div
          id="mobile-menu"
          className="fixed top-[57px] h-dvh left-0 right-0 z-50 bg-main p-4 overflow-auto"
        >
          {/* Main Menu Items */}
          <ul className="bg-muted flex flex-col mb-6" role="menu">
            {mobileNavItems.map((item) => (
              <li key={item.name} className="border-accent" role="none">
                <a
                  href={item.path}
                  className="text-xl font-medium hover:bg-accent rounded-md flex gap-4 items-center border-b border-accent py-4 px-6"
                  role="menuitem"
                >
                  <item.icon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
          
          {/* CATEGORIES Section */}
          <div 
            className="text-accent text-sm mb-2 font-medium flex justify-between items-center cursor-pointer p-2 border-b border-accent"
            onClick={() => setCategoriesOpen(!categoriesOpen)}
          >
            <span>CATEGORIES</span>
            {categoriesOpen ? 
              <ChevronDownIcon className="w-5 h-5" /> : 
              <ChevronRightIcon className="w-5 h-5" />
            }
          </div>
          
          {categoriesOpen && (
            <div className="mb-6 ml-2">
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
                    <ul className="bg-muted flex flex-col gap-1 ml-4 mt-1">
                      {groupedCategories.nintendo.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`/category/${item.slug}`}
                            className="text-sm tracking-wide flex gap-2 items-center p-2 border-b border-accent/30"
                            onClick={() => setIsOpen(false)}
                          >
                            <div className="text-accent">
                              {getCategoryIcon(item.slug)}
                            </div>
                            {item.title}{" "}
                            <span className="text-accent text-xs ml-auto">({item?.games?.length || 0})</span>
                          </a>
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
                    className="flex items-center gap-2 p-2 text-base font-medium cursor-pointer border-b border-accent/50"
                    onClick={() => setSegaOpen(!segaOpen)}
                  >
                    <SiSega className="text-accent" />
                    <span>Sega</span>
                    {segaOpen ? 
                      <ChevronDownIcon className="w-4 h-4 ml-auto" /> : 
                      <ChevronRightIcon className="w-4 h-4 ml-auto" />
                    }
                  </div>
                  
                  {segaOpen && (
                    <ul className="bg-muted flex flex-col gap-1 ml-4 mt-1">
                      {groupedCategories.sega.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`/category/${item.slug}`}
                            className="text-sm tracking-wide flex gap-2 items-center p-2 border-b border-accent/30"
                            onClick={() => setIsOpen(false)}
                          >
                            <div className="text-accent">
                              {getCategoryIcon(item.slug)}
                            </div>
                            {item.title}{" "}
                            <span className="text-accent text-xs ml-auto">({item?.games?.length || 0})</span>
                          </a>
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
                    className="flex items-center gap-2 p-2 text-base font-medium cursor-pointer border-b border-accent/50"
                    onClick={() => setSonyOpen(!sonyOpen)}
                  >
                    <SiPlaystation className="text-accent" />
                    <span>Sony</span>
                    {sonyOpen ? 
                      <ChevronDownIcon className="w-4 h-4 ml-auto" /> : 
                      <ChevronRightIcon className="w-4 h-4 ml-auto" />
                    }
                  </div>
                  
                  {sonyOpen && (
                    <ul className="bg-muted flex flex-col gap-1 ml-4 mt-1">
                      {groupedCategories.sony.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`/category/${item.slug}`}
                            className="text-sm tracking-wide flex gap-2 items-center p-2 border-b border-accent/30"
                            onClick={() => setIsOpen(false)}
                          >
                            <div className="text-accent">
                              {getCategoryIcon(item.slug)}
                            </div>
                            {item.title}{" "}
                            <span className="text-accent text-xs ml-auto">({item?.games?.length || 0})</span>
                          </a>
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
                    className="flex items-center gap-2 p-2 text-base font-medium cursor-pointer border-b border-accent/50"
                    onClick={() => setOtherOpen(!otherOpen)}
                  >
                    <FaGamepad className="text-accent" />
                    <span>Other</span>
                    {otherOpen ? 
                      <ChevronDownIcon className="w-4 h-4 ml-auto" /> : 
                      <ChevronRightIcon className="w-4 h-4 ml-auto" />
                    }
                  </div>
                  
                  {otherOpen && (
                    <ul className="bg-muted flex flex-col gap-1 ml-4 mt-1">
                      {groupedCategories.other.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`/category/${item.slug}`}
                            className="text-sm tracking-wide flex gap-2 items-center p-2 border-b border-accent/30"
                            onClick={() => setIsOpen(false)}
                          >
                            <div className="text-accent">
                              {getCategoryIcon(item.slug)}
                            </div>
                            {item.title}{" "}
                            <span className="text-accent text-xs ml-auto">({item?.games?.length || 0})</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* API TEST PAGES Section */}
          <div 
            className="text-accent text-sm mb-2 font-medium flex justify-between items-center cursor-pointer p-2 border-b border-accent"
            onClick={() => setApiPagesOpen(!apiPagesOpen)}
          >
            <span>API TEST PAGES</span>
            {apiPagesOpen ? 
              <ChevronDownIcon className="w-5 h-5" /> : 
              <ChevronRightIcon className="w-5 h-5" />
            }
          </div>
          
          {apiPagesOpen && (
            <ul className="bg-muted flex flex-col gap-2 mb-6 ml-2">
            <li>
              <a
                href="/thegamesdb-test"
                  className="flex gap-2 items-center p-2 border-b border-accent/30"
                  onClick={() => setIsOpen(false)}
              >
                <FiDatabase className="w-5 h-5 text-accent" />
                TheGamesDB Test
              </a>
            </li>
            <li>
              <a
                href="/test-screenscraper"
                  className="flex gap-2 items-center p-2 border-b border-accent/30"
                  onClick={() => setIsOpen(false)}
              >
                <FiImage className="w-5 h-5 text-accent" />
                ScreenScraper Test
              </a>
            </li>
            <li>
              <a
                href="/wikipedia-test"
                  className="flex gap-2 items-center p-2 border-b border-accent/30"
                  onClick={() => setIsOpen(false)}
              >
                <FiBookOpen className="w-5 h-5 text-accent" />
                Wikipedia Test
              </a>
            </li>
          </ul>
          )}
        </div>
      )}
    </>
  );
}
