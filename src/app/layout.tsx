import { Poppins } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BILL_RECEIPT_STYLES } from "@/lib/bill-receipt-styles";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-brand",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://lk-studio-1.onrender.com";

export const metadata: Metadata = {
  title: "LK Studio",
  description: "Grow your business with less effort",
  manifest: "/manifest.json",
  metadataBase: new URL(siteUrl),
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LK Studio",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#1b3022",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} min-h-dvh antialiased font-[family-name:var(--font-brand)]`}>
        <style dangerouslySetInnerHTML={{ __html: BILL_RECEIPT_STYLES }} />
        {children}
      </body>
    </html>
  );
}
