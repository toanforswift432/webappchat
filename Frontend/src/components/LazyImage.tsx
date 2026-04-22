import React, { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, onClick }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setActive(false);
    setLoaded(false);
    setError(false);
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  if (error) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-xs">
        <ImageOff className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative overflow-hidden rounded-md">
      {!loaded && (
        <div className={`${className} min-h-[80px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md`} />
      )}
      {active && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0 absolute inset-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          onClick={onClick}
          draggable={false}
        />
      )}
    </div>
  );
};
