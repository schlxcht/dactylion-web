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
  title: "Dactylion SkyBlock | Adanı Kur, Ekonomini Büyüt",
  description: "Dactylion SkyBlock resmi oyuncu portalı. Kredini yükle, bakiyeni kontrol et ve destek talebi aç.",
  applicationName: "Dactylion SkyBlock",
  keywords: ["Dactylion", "Minecraft", "SkyBlock", "Türkiye", "Minecraft sunucusu"],
  openGraph: {
    title: "Dactylion SkyBlock",
    description: "Adanı kur. Ekonomini büyüt.",
    url: "https://schlxcht.github.io/dactylion-web/",
    siteName: "Dactylion SkyBlock",
    locale: "tr_TR",
    type: "website",
    images: [{ url: "og.png", width: 1536, height: 1024, alt: "Dactylion SkyBlock" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dactylion SkyBlock",
    description: "Adanı kur. Ekonomini büyüt.",
    images: ["og.png"],
  },
  icons: { icon: "og.png" },
};

export const viewport: Viewport = { themeColor: "#120709", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body className={`${rajdhani.variable} ${inter.variable}`}>{children}</body></html>;
}
