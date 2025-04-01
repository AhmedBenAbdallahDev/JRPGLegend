"use client";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CubeIcon,
  DeviceTabletIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

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
        </div>
      )}
    </>
  );
}
