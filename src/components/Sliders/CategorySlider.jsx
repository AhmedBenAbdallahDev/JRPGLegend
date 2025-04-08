"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Scrollbar, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt } from 'react-icons/fa';

export default function CategorySlider({ categories }) {
  if (!categories || !Array.isArray(categories)) {
    return null;
  }

  const breakpoints = {
    320: {
      slidesPerView: 3,
    },
    640: {
      slidesPerView: 4,
    },
    768: {
      slidesPerView: 6,
    },
  };

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

  // Platform-specific styling
  const getPlatformColors = (slug) => {
    const platformStyles = {
      // Nintendo platforms
      'nes': 'bg-red-600',
      'snes': 'bg-purple-600',
      'n64': 'bg-green-600',
      'gb': 'bg-gray-600',
      'gbc': 'bg-yellow-500',
      'gba': 'bg-indigo-600',
      'nds': 'bg-blue-500',
      
      // Sega platforms
      'genesis': 'bg-red-700',
      'segacd': 'bg-red-800',
      'saturn': 'bg-gray-700',
      
      // Sony platforms
      'psx': 'bg-gray-800',
      'psp': 'bg-black',
      
      // Other platforms
      'arcade': 'bg-purple-800',
      
      // Default
      'default': 'bg-gray-600'
    };
    
    return platformStyles[slug] || platformStyles.default;
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between gap-4">
        <h2 className="font-display mb-4 items-center">Categories</h2>
        <a
          href="/platforms"
          className="text-sm font-medium hover:underline underline-offset-4"
        >
          View All{" "}
          <ChevronRightIcon className="h-4 w-4 inline-block text-accent" />
        </a>
      </div>

      <Swiper
        modules={[Navigation, Scrollbar, A11y]}
        spaceBetween={20}
        slidesPerView={6}
        breakpoints={breakpoints}
        navigation
        scrollbar={{ draggable: true }}
        style={{
          "--swiper-pagination-color": "#FFBA08",
          "--swiper-pagination-bullet-incactive-color": "#999999",
          "--swiper-pagination-bullet-incactive-opacity": "1",
          "--swiper-pagination-bullet-size": "0.6em",
          "--swiper-pagination-bullet-horizontal-gap": "6px",
          "--swiper-theme-color": "#FFF",
          "--swiper-navigation-size": "24px",
          "--swiper-navigation-sides-offset": "30px",
        }}
      >
        {categories.map((category) => (
          category && category.title && (
            <SwiperSlide key={category.id} className="group">
              <a href={`/category/${category.slug}`} className="group">
                <div className={`overflow-hidden rounded-lg ${getPlatformColors(category.slug)} aspect-square flex items-center justify-center mb-2`}>
                  {getCategoryIcon(category.slug)}
                </div>
                <h1 className="text-center text-sm mt-2">{category.title}</h1>
                {category.games && (
                  <p className="text-xs text-center text-accent">{category.games.length} games</p>
                )}
              </a>
            </SwiperSlide>
          )
        ))}
      </Swiper>
    </div>
  );
}
