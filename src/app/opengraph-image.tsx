import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SynapseMD — Clinical Intelligence for High-Stakes Patient Transitions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0A0D12",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#12161D",
              border: "1px solid #1F2733",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2FD08A",
              fontSize: 22,
            }}
          >
            +
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, color: "#E9EDF3" }}>SynapseMD</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 920 }}>
          <div style={{ fontSize: 56, fontWeight: 600, color: "#E9EDF3", lineHeight: 1.15 }}>
            Clinical Intelligence for High-Stakes Patient Transitions
          </div>
          <div style={{ fontSize: 26, color: "#9AA5B4", lineHeight: 1.4 }}>
            See what changed, trace why it matters, and check the evidence behind it.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, fontSize: 20, color: "#5F6A79" }}>
          <span>Synthetic data</span>
          <span>·</span>
          <span>Research prototype</span>
          <span>·</span>
          <span>Not for clinical decision-making</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
