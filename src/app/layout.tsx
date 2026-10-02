import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "SynapseMD — Clinical Intelligence for High-Stakes Patient Transitions",
  description:
    "A synthetic-data research prototype that traces what changed in a patient's record, why it might matter, and what evidence supports that reading.",
  openGraph: {
    title: "SynapseMD — Clinical Intelligence for High-Stakes Patient Transitions",
    description:
      "See what changed, trace why it matters, and check the evidence behind it. Synthetic data, research prototype.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SynapseMD",
    description: "Clinical Intelligence for High-Stakes Patient Transitions — synthetic data research prototype.",
  },
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
      <body>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
