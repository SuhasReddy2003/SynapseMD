"use client";

import { useEffect, useRef, useState } from "react";

interface Stat {
  value: string;
  label: string;
}

function parseStat(value: string): { number: number; suffix: string; decimals: number } {
  const match = value.match(/^(\d+(\.\d+)?)/);
  if (!match) return { number: 0, suffix: value, decimals: 0 };
  const numeric = match[1]!;
  return {
    number: parseFloat(numeric),
    suffix: value.slice(numeric.length),
    decimals: numeric.includes(".") ? numeric.split(".")[1]!.length : 0,
  };
}

function CountUpStat({ stat, animate }: { stat: Stat; animate: boolean }) {
  const { number, suffix, decimals } = parseStat(stat.value);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!animate || number === 0) return;
    const duration = 900;
    let start: number | null = null;
    let frame = 0;
    function step(ts: number) {
      if (start === null) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(number * eased);
      if (t < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [animate, number]);

  return (
    <div>
      <p className="tabular text-2xl text-ink-primary">
        {animate ? `${display.toFixed(decimals)}${suffix}` : stat.value}
      </p>
      <p className="mt-1 text-xs text-ink-tertiary">{stat.label}</p>
    </div>
  );
}

/** Counts each stat up from zero, once, the first time the strip enters the viewport. */
export function StatsStrip({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setAnimate(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-8 sm:grid-cols-4">
      {stats.map((s) => (
        <CountUpStat key={s.label} stat={s} animate={animate} />
      ))}
    </div>
  );
}
