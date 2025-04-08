"use client";
import { useState } from "react";
import { HomeIcon, CubeIcon, DeviceTabletIcon, PhotoIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from 'next/link';
import { usePathname } from "next/navigation";
import { SiNintendo, SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt } from 'react-icons/fa';
import { FiImage, FiDatabase, FiSettings, FiBookOpen } from 'react-icons/fi';

export default function SideBarNav({ categoryMenu }) {
  const activeSegment = usePathname();
  
  // State for collapsible sections
  const [menuOpen, setMenuOpen] = useState(true);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [apiPagesOpen, setApiPagesOpen] = useState(false);
  
  // State for console groups
  const [nintendoOpen, setNintendoOpen] = useState(true);
  const [segaOpen, setSegaOpen] = useState(true);
  const [sonyOpen, setSonyOpen] = useState(true);
  const [otherOpen, setOtherOpen] = useState(true);

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
        return <SiNintendo size={iconSize} />;
      case 'n64':
        return <SiNintendo size={iconSize} />;
      case 'gb':
      case 'gbc':
      case 'gba':
        return <FaMobileAlt size={iconSize} />;
      case 'nds':
        return <SiNintendo size={iconSize} />;
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
    <>
      {/* MENU Section */}
      <div 
        className="text-accent text-xs mb-2 flex justify-between items-center cursor-pointer"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span>MENU</span>
        {menuOpen ? 
          <ChevronDownIcon className="w-4 h-4" /> : 
          <ChevronRightIcon className="w-4 h-4" />
        }
      </div>
      
      {menuOpen && (
        <ul className="bg-muted flex flex-col gap-2 mb-6">
          {mainMenuItems.map((item, i) => (
            <li key={i}>
              <a
                href={item.slug}
                className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                  activeSegment === `${item.slug}`
                    ? "active bg-primary rounded-md"
                    : "incative hover:bg-primary rounded-md"
                }`}
              >
                <item.icon className="h-6 w-6 text-accent" />
                {item.name}
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* CATEGORIES Section */}
      <div 
        className="text-accent text-xs mb-2 flex justify-between items-center cursor-pointer"
        onClick={() => setCategoriesOpen(!categoriesOpen)}
      >
        <span>CATEGORIES</span>
        {categoriesOpen ? 
          <ChevronDownIcon className="w-4 h-4" /> : 
          <ChevronRightIcon className="w-4 h-4" />
        }
      </div>
      
      {categoriesOpen && (
        <div className="mb-6">
          {/* Nintendo Categories */}
          {groupedCategories.nintendo.length > 0 && (
            <div className="mb-3">
              <div 
                className="flex items-center gap-2 p-1 text-sm font-medium cursor-pointer"
                onClick={() => setNintendoOpen(!nintendoOpen)}
              >
                <SiNintendo className="text-accent" />
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
                      <a
                        href={`/category/${item.slug}`}
                        className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                          activeSegment === `/category/${item.slug}`
                            ? "active bg-primary rounded-md"
                            : "incative hover:bg-primary rounded-md"
                        }`}
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
                      <a
                        href={`/category/${item.slug}`}
                        className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                          activeSegment === `/category/${item.slug}`
                            ? "active bg-primary rounded-md"
                            : "incative hover:bg-primary rounded-md"
                        }`}
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
                      <a
                        href={`/category/${item.slug}`}
                        className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                          activeSegment === `/category/${item.slug}`
                            ? "active bg-primary rounded-md"
                            : "incative hover:bg-primary rounded-md"
                        }`}
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
                className="flex items-center gap-2 p-1 text-sm font-medium cursor-pointer"
                onClick={() => setOtherOpen(!otherOpen)}
              >
                <FaGamepad className="text-accent" />
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
                      <a
                        href={`/category/${item.slug}`}
                        className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                          activeSegment === `/category/${item.slug}`
                            ? "active bg-primary rounded-md"
                            : "incative hover:bg-primary rounded-md"
                        }`}
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
        className="text-accent text-xs mb-2 flex justify-between items-center cursor-pointer"
        onClick={() => setApiPagesOpen(!apiPagesOpen)}
      >
        <span>API TEST PAGES</span>
        {apiPagesOpen ? 
          <ChevronDownIcon className="w-4 h-4" /> : 
          <ChevronRightIcon className="w-4 h-4" />
        }
      </div>
      
      {apiPagesOpen && (
        <ul className="bg-muted flex flex-col gap-2 mb-6">
          <li>
            <a
              href="/test-screenscraper"
              className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                activeSegment === "/test-screenscraper"
                  ? "active bg-primary rounded-md"
                  : "incative hover:bg-primary rounded-md"
              }`}
            >
              <FiImage className="w-5 h-5 text-accent" />
              ScreenScraper Test
            </a>
          </li>
          <li>
            <a
              href="/wikipedia-test"
              className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                activeSegment === "/wikipedia-test"
                  ? "active bg-primary rounded-md"
                  : "incative hover:bg-primary rounded-md"
              }`}
            >
              <FiBookOpen className="w-5 h-5 text-accent" />
              Wikipedia Test
            </a>
          </li>
        </ul>
      )}
    </>
  );
}
