import React, { useEffect, useRef, useState } from "react";

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

  useEffect(() => {
    setActive(false);
    setLoaded(false);
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" }, // start loading 400px before entering view
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  return (
    <div ref={wrapperRef} className="relative overflow-hidden rounded-md">
      {/* Skeleton shown while not yet loaded */}
      {!loaded && (
        <div className={`${className} min-h-[120px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md`} />
      )}
      {active && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0 absolute inset-0"}`}
          onLoad={() => setLoaded(true)}
          onClick={onClick}
          draggable={false}
        />
      )}
    </div>
  );
};
