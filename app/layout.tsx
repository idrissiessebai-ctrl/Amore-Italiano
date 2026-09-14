import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { getPublicImageUrl } from "@/lib/utils/image";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://amoreitaliano-safi.com"),
  title: {
    default: "Amore Italiano — Safi",
    template: "%s — Amore Italiano Safi",
  },
  description: "Pizza, café, gelato et cuisine italienne depuis 2013 à Safi.",
  openGraph: {
    title: "Amore Italiano — Safi",
    description: "Pizza, café, gelato et cuisine italienne depuis 2013 à Safi.",
    type: "website",
    images: [getPublicImageUrl("/images/amore-21-png.webp")],
  },
  alternates: { canonical: "/" },
  icons: { icon: getPublicImageUrl("/images/amore-33-png.webp") },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body
        className={`${dmSans.variable} ${playfairDisplay.variable}`}
        suppressHydrationWarning
      >
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
