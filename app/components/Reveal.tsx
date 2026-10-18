"use client";

import { useEffect, useRef } from "react";
import type { ElementType, ReactNode } from "react";

type RevealProps = {
  as?: ElementType;
  delay?: 0 | 1 | 2 | 3 | 4 | 5;
  className?: string;
  children: ReactNode;
  once?: boolean;
};

export default function Reveal({
  as,
  delay = 0,
  className = "",
  children,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  const Tag = (as ?? "div") as ElementType;
  const delayClass = delay > 0 ? `reveal-delay-${delay}` : "";

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      className={`reveal ${delayClass} ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}
