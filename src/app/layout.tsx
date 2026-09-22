import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SynapseMD — Clinical Intelligence for High-Stakes Patient Transitions",
  description:
    "A synthetic-data research prototype that traces what changed in a patient's record, why it might matter, and what evidence supports that reading.",
};

export const viewport: Viewport = {
  themeColor: "#05070A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
