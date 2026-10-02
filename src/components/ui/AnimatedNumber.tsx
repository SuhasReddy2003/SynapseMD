"use client";

import { useEffect, useRef, useState } from "react";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A number that tweens to its new value instead of snapping, and briefly
 * flashes when it changes — so a tick of live data is visible as a *change*,
 * not just a different digit. Reduced-motion users get the plain value.
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  duration = 650,
  flash = true,
  className,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  flash?: boolean;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const [flashKey, setFlashKey] = useState(0);
  const fromRef = useRef(value);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (fromRef.current === value) return;
    if (flash) setFlashKey((k) => k + 1);
    if (prefersReducedMotion()) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (value - from) * eased;
      fromRef.current = current;
      setDisplay(current);
      if (t < 1) frame = requestAnimationFrame(step);
      else fromRef.current = value;
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, flash]);

  return (
    <span key={flashKey} className={`${flashKey > 0 && flash ? "animate-value-flash" : ""} ${className ?? ""}`}>
      {display.toFixed(decimals)}
    </span>
  );
}
