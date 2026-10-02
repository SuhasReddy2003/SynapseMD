"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#05070A", color: "#E9EDF3", fontFamily: "sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>SynapseMD failed to load</p>
          <p style={{ fontSize: "0.875rem", color: "#9AA5B4", maxWidth: "26rem" }}>
            This is a research prototype using synthetic data only. Reloading usually resolves it.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#E9EDF3",
              color: "#05070A",
              border: "none",
              borderRadius: "6px",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
