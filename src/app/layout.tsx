import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { template: "%s · WoreIt", default: "WoreIt — your family closet" },
  description:
    "Track your closet, log what you wore, and let your family see (and react to) your outfits.",
  manifest: "/manifest.json",
  applicationName: "WoreIt",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WoreIt",
  },
};

export const viewport: Viewport = {
  themeColor: "#fafaf7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
