import { useLayoutEffect, useRef } from "react";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * FLIP (First, Last, Invert, Play) reorder animation for a list whose order
 * changes over time — e.g. hypotheses re-ranking as new evidence arrives.
 * Attach `registerRef(id)` as the ref callback on each row's DOM node; pass
 * the current order (array of ids) as `order`. Rows that moved get an
 * inverted transform applied instantly, then animated back to identity.
 */
export function useFlipReorder(order: string[], duration = 480) {
  const nodes = useRef<Map<string, HTMLElement>>(new Map());
  const prevRects = useRef<Map<string, DOMRect>>(new Map());
  const orderKey = order.join("|");

  useLayoutEffect(() => {
    if (prefersReducedMotion()) {
      prevRects.current.clear();
      nodes.current.forEach((el, id) => prevRects.current.set(id, el.getBoundingClientRect()));
      return;
    }

    const nextRects = new Map<string, DOMRect>();
    nodes.current.forEach((el, id) => nextRects.set(id, el.getBoundingClientRect()));

    nodes.current.forEach((el, id) => {
      const prev = prevRects.current.get(id);
      const next = nextRects.get(id);
      if (!prev || !next) return;
      const dy = prev.top - next.top;
      if (Math.abs(dy) < 1) return;
      el.style.transition = "none";
      el.style.transform = `translateY(${dy}px)`;
      // Force layout so the browser commits the starting transform before we animate away from it.
      void el.offsetHeight;
      requestAnimationFrame(() => {
        el.style.transition = `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
        el.style.transform = "";
      });
    });

    prevRects.current = nextRects;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderKey]);

  function registerRef(id: string) {
    return (el: HTMLElement | null) => {
      if (el) nodes.current.set(id, el);
      else nodes.current.delete(id);
    };
  }

  return { registerRef };
}
