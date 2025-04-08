"use client";
import { HomeIcon, CubeIcon, DeviceTabletIcon, PhotoIcon } from "@heroicons/react/24/outline";
import Link from 'next/link';
import { usePathname } from "next/navigation";
import { SiNintendo, SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt } from 'react-icons/fa';
import { FiImage, FiDatabase, FiSettings, FiBookOpen } from 'react-icons/fi';

export default function SideBarNav({ categoryMenu }) {
  const activeSegment = usePathname();

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

  return (
    <>
      <div className="text-accent text-xs mb-2">MENU</div>
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

      <div className="text-accent text-xs mb-2">CATEGORIES</div>
      <ul className="bg-muted flex flex-col gap-2 mb-6">
        {categoryMenu && categoryMenu.map((item) => (
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
              <span className="text-accent">({item?.games?.length})</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="text-accent text-xs mb-2">API TEST PAGES</div>
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
    </>
  );
}
