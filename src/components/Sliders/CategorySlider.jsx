"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

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

  return (
    <div className="mb-6">
      <div className="flex justify-between gap-4">
        <h2 className="font-display mb-4 items-center">Categories</h2>
        <a
          href="/category"
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
        {categories.map((item, i) => (
          item && item.title && (
            <SwiperSlide key={i} className="group">
              <a href={`/category/${item.slug}`} className="group">
                <div className="overflow-hidden rounded-lg border-accent-secondary border mb-2">
                  <Image
                    src={`/category/${item.image || 'default-image.png'}`}
                    width={300}
                    height={300}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h1>{item.title}</h1>
              </a>
            </SwiperSlide>
          )
        ))}
      </Swiper>
    </div>
  );
}
