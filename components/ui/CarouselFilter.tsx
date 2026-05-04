import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CarouselFilterItem = {
  id: string | number;
  name: string;
  icon?: React.ReactNode;
};

type CarouselFilterProps = {
  items: CarouselFilterItem[];
  selectedItems: (string | number)[];
  onSelectionChange: (selectedIds: (string | number)[]) => void;
  multiSelect?: boolean;
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
};

const CarouselFilter = ({
  items,
  selectedItems,
  onSelectionChange,
  multiSelect = true,
  showIcon = true,
  showText = true,
  className = "",
}: CarouselFilterProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    container?.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      container?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [items]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleItemClick = (itemId: string | number) => {
    if (multiSelect) {
      const newSelected = selectedItems.includes(itemId)
        ? selectedItems.filter((id) => id !== itemId)
        : [...selectedItems, itemId];
      onSelectionChange(newSelected);
    } else {
      const newSelected = selectedItems.includes(itemId) ? [] : [itemId];
      onSelectionChange(newSelected);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Left Scroll Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scroll-smooth py-4 px-8"
        style={{ scrollBehavior: "smooth" }}
      >
        {items.map((item) => {
          const isSelected = selectedItems.includes(item.id);

          return (
            <button
              type="button"
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              {showIcon && item.icon && (
                <div className="w-8 h-8 flex items-center justify-center text-orange-600">
                  {item.icon}
                </div>
              )}
              {showText && (
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Scroll Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default CarouselFilter;
