import React, { useEffect, useRef, useState } from "react";
import Glide from "@glidejs/glide";
import "@glidejs/glide/dist/css/glide.core.min.css";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export interface GlideSlideItem {
  id: string | number;
  src: string;
  alt: string;
  title?: string;
  caption?: string;
  tag?: string;
}

interface GlideCarouselProps {
  slides: GlideSlideItem[];
  onSelectSlide?: (slide: GlideSlideItem) => void;
}

export function GlideCarousel({ slides, onSelectSlide }: GlideCarouselProps) {
  const glideRef = useRef<HTMLDivElement>(null);
  const glideInstanceRef = useRef<Glide | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!glideRef.current) return;

    // Initialize Glide.js with center-focus peeking carousel settings (Glide.js signature style)
    const glide = new Glide(glideRef.current, {
      type: "carousel",
      focusAt: "center",
      startAt: 0,
      perView: 3,
      gap: 24,
      peek: { before: 70, after: 70 },
      autoplay: 3800,
      hoverpause: true,
      animationDuration: 650,
      animationTimingFunc: "cubic-bezier(0.25, 1, 0.5, 1)",
      breakpoints: {
        1200: {
          perView: 2,
          peek: { before: 60, after: 60 },
          gap: 20,
        },
        768: {
          perView: 1,
          peek: { before: 36, after: 36 },
          gap: 16,
        },
        480: {
          perView: 1,
          peek: { before: 16, after: 16 },
          gap: 12,
        },
      },
    });

    glide.on("run.after", () => {
      setActiveIndex(glide.index);
    });

    glide.mount();
    glideInstanceRef.current = glide;

    return () => {
      try {
        glide.destroy();
      } catch {
        // cleanup safety
      }
    };
  }, [slides.length]);

  return (
    <div className="relative w-full mx-auto text-center">
      {/* Outer Glide Container */}
      <div ref={glideRef} className="glide group relative w-full overflow-hidden py-4">
        
        {/* Track & Slides */}
        <div className="glide__track overflow-hidden" data-glide-el="track">
          <ul className="glide__slides flex items-center py-6">
            {slides.map((slide, index) => {
              const isActive = index === activeIndex;
              return (
                <li
                  key={slide.id}
                  className="glide__slide transition-all duration-500 ease-out flex justify-center"
                  onClick={() => {
                    if (onSelectSlide) onSelectSlide(slide);
                    glideInstanceRef.current?.go(`=${index}`);
                  }}
                >
                  <div
                    className={`group/card relative w-full max-w-md overflow-hidden rounded-3xl border transition-all duration-500 cursor-pointer ${
                      isActive
                        ? "scale-105 border-[#1A43BF]/40 bg-white shadow-[0_24px_50px_rgba(0,7,45,0.14)] z-20"
                        : "scale-95 border-slate-200/80 bg-white/70 opacity-70 shadow-sm hover:opacity-90 hover:scale-[0.98] z-10"
                    }`}
                  >
                    {/* Slide Image */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <img
                        src={slide.src}
                        alt={slide.alt}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#00072D]/90 via-[#00072D]/25 to-transparent" />

                      {/* Tag Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0A2472] shadow-sm backdrop-blur-md">
                          <Sparkles className="h-3 w-3 text-[#1A43BF]" />
                          {slide.tag}
                        </span>
                      </div>

                      {/* Content Overlay */}
                      {slide.title && (
                        <div className="absolute bottom-4 left-4 right-4 text-center text-white">
                          <h4 className="font-cinzel text-lg sm:text-xl font-bold tracking-wide text-white drop-shadow-sm">
                            {slide.title}
                          </h4>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Glide Arrow Controls */}
        <div className="glide__arrows pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 sm:px-6 z-30" data-glide-el="controls">
          <button
            className="glide__arrow glide__arrow--left pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/90 bg-white/90 text-[#00072D] shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-[#1A43BF]/40 hover:bg-white active:scale-95 cursor-pointer"
            data-glide-dir="<"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="h-5 w-5 text-[#0A2472]" />
          </button>

          <button
            className="glide__arrow glide__arrow--right pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/90 bg-white/90 text-[#00072D] shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-[#1A43BF]/40 hover:bg-white active:scale-95 cursor-pointer"
            data-glide-dir=">"
            aria-label="Next Slide"
          >
            <ChevronRight className="h-5 w-5 text-[#0A2472]" />
          </button>
        </div>

        {/* Glide Bullets Pagination (Minimalist pill indicator) */}
        <div
          className="glide__bullets mt-4 flex items-center justify-center gap-2"
          data-glide-el="controls[nav]"
        >
          {slides.map((_, i) => (
            <button
              key={i}
              className={`glide__bullet h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === activeIndex
                  ? "w-8 bg-gradient-to-r from-[#00072D] via-[#0A2472] to-[#1A43BF] shadow-sm"
                  : "w-2.5 bg-slate-200 hover:bg-slate-400"
              }`}
              data-glide-dir={`=${i}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}

export default GlideCarousel;
