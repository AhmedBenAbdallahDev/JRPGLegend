"use client";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CubeIcon,
  DeviceTabletIcon,
  PhotoIcon,
  DatabaseIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const activeSegment = usePathname();

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
      name: "Categories",
      path: "/category",
      icon: CubeIcon,
      slug: "category",
    },
    {
      name: "Cover Manager",
      path: "/covers",
      icon: PhotoIcon,
      slug: "covers",
    },
    {
      name: "TheGamesDB Test",
      path: "/thegamesdb-test",
      icon: CubeIcon,
      slug: "thegamesdb-test",
    },
    {
      name: "About",
      path: "/about",
      icon: CubeIcon,
      slug: "about",
    },
    {
      name: "Contact",
      path: "/contact",
      icon: CubeIcon,
      slug: "contact",
    },
    {
      name: "API Config",
      path: "/api-config",
      icon: CubeIcon,
      slug: "api-config",
    },
  ];
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
          className="fixed top-[57px] h-dvh left-0 right-0 z-50 bg-main p-4"
        >
          <ul className="bg-muted flex flex-col mb-6" role="menu">
            {mobileNavItems.map((item) => (
              <li key={item.name} className="border-accent" role="none">
                <a
                  href={item.path}
                  className="text-xl font-medium hover:bg-accent rounderd-md flex gap-4 items-center border-b border-accent py-4 px-6"
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
          <div className="text-accent text-xs mb-2 mt-4">API TEST PAGES</div>
          <ul className="bg-muted flex flex-col gap-2 mb-6">
            <li>
              <a
                href="/thegamesdb-test"
                className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                  activeSegment === "/thegamesdb-test"
                    ? "active bg-primary rounded-md"
                    : "incative hover:bg-primary rounded-md"
                }`}
              >
                <DatabaseIcon className="w-5 h-5 text-accent" />
                TheGamesDB Test
              </a>
            </li>
            <li>
              <a
                href="/screenscraper-test"
                className={`text-sm tracking-wide flex gap-2 items-center p-1 px-2 ${
                  activeSegment === "/screenscraper-test"
                    ? "active bg-primary rounded-md"
                    : "incative hover:bg-primary rounded-md"
                }`}
              >
                <PhotoIcon className="w-5 h-5 text-accent" />
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
                <CubeIcon className="w-5 h-5 text-accent" />
                Wikipedia Test
              </a>
            </li>
          </ul>
        </div>
      )}
    </>
  );
}
