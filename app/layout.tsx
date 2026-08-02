import type { Metadata, Viewport } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";

const rajdhani = Rajdhani({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://schlxcht.github.io/dactylion-web/"),
  title: "Dactylion Network | SkyBlock Oyuncu Portalı",
  description: "Dactylion Network resmi SkyBlock portalı. Haberleri takip et, kredini yükle, destek ve başvuru kaydı aç.",
  applicationName: "Dactylion SkyBlock",
  keywords: ["Dactylion", "Minecraft", "SkyBlock", "Türkiye", "Minecraft sunucusu"],
  openGraph: {
    title: "Dactylion SkyBlock",
    description: "Modern Türk SkyBlock deneyimi ve güvenli oyuncu portalı.",
    url: "https://schlxcht.github.io/dactylion-web/",
    siteName: "Dactylion SkyBlock",
    locale: "tr_TR",
    type: "website",
    images: [{ url: "og.png", width: 1536, height: 1024, alt: "Dactylion SkyBlock" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dactylion SkyBlock",
    description: "Modern Türk SkyBlock deneyimi ve güvenli oyuncu portalı.",
    images: ["og.png"],
  },
  icons: { icon: "dactylion-logo.png", apple: "dactylion-logo.png" },
};

export const viewport: Viewport = { themeColor: "#8e111b", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body className={`${rajdhani.variable} ${inter.variable}`}>{children}</body></html>;
}
