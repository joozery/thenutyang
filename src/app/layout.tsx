import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

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
    <html lang="th" className={`${notoSansThai.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
