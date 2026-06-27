import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "@/components/layout/cookie-consent";
const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "นัททายางยนต์ - ครบ จบ เรื่องยาง และบริการรถยนต์",
  description: "จำหน่ายยางรถยนต์คุณภาพจากแบรนด์ชั้นนำ พร้อมบริการติดตั้ง ตั้งศูนย์ ถ่วงล้อ โดยช่างมืออาชีพ",
  icons: {
    icon: "/logo11.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable} font-sans h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-50" suppressHydrationWarning>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
