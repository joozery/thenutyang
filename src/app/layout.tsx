import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "นัททายางยนต์ - ครบ จบ เรื่องยาง และบริการรถยนต์",
  description: "จำหน่ายยางรถยนต์คุณภาพจากแบรนด์ชั้นนำ พร้อมบริการติดตั้ง ตั้งศูนย์ ถ่วงล้อ โดยช่างมืออาชีพ",
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
      </body>
    </html>
  );
}
