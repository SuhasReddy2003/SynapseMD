const BEAT =
  "M0,20 L17,20 L22,13 L27,23 L32,2 L37,35 L42,20 L58,20 L64,13 L70,20 L100,20";

function Row() {
  return (
    <div className="flex h-full shrink-0">
      {Array.from({ length: 8 }, (_, i) => (
        <svg key={i} viewBox="0 0 100 40" className="h-full w-20 shrink-0" preserveAspectRatio="none">
          <path
            d={BEAT}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

/**
 * A continuously scrolling EKG trace — two identical rows placed back to
 * back; `translateX(-50%)` (a percentage of the wrapper's OWN width, not
 * the parent's) always shifts by exactly one row, so the loop is seamless
 * regardless of container size. This is the page's single orchestrated
 * motion moment; nothing else on the page animates on its own.
 */
export function EkgWaveform({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex h-full w-fit animate-ekg-scroll">
        <Row />
        <Row />
      </div>
    </div>
  );
}
