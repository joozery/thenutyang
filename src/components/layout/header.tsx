import Link from "next/link";
import Image from "next/image";
import { Search, User, ShoppingCart, Menu, Truck, ShieldCheck, CreditCard, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="w-full border-b bg-white sticky top-0 z-50">
      {/* Top bar */}
      <div className="w-full bg-rose-700 text-white text-xs py-2 px-4 md:px-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="bg-rose-800 rounded-full w-5 h-5 flex items-center justify-center">
              <Truck className="w-3 h-3" />
            </span>
            จัดส่งฟรี ทั่วประเทศ
          </span>
          <span className="hidden md:flex items-center gap-1">
            <span className="bg-rose-800 rounded-full w-5 h-5 flex items-center justify-center">
              <ShieldCheck className="w-3 h-3" />
            </span>
            รับประกันคุณภาพยางแท้ทุกเส้น
          </span>
          <span className="hidden lg:flex items-center gap-1">
            <span className="bg-rose-800 rounded-full w-5 h-5 flex items-center justify-center">
              <CreditCard className="w-3 h-3" />
            </span>
            ผ่อน 0% สูงสุด 10 เดือน
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" /> 02-123-4567
          </span>
          <span className="hidden md:flex items-center gap-1">
            จันทร์ - อาทิตย์ 08:00 - 18:00 น.
          </span>
        </div>
      </div>

      {/* Main Nav */}
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="block">
            <Image 
              src="/logo/logo.png" 
              alt="นัททายางยนต์" 
              width={240} 
              height={60} 
              className="h-10 md:h-12 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700">
          <Link href="/" className="text-rose-600 border-b-2 border-rose-600 pb-1">หน้าหลัก</Link>
          <Link href="/tires" className="hover:text-rose-600 transition">ยางรถยนต์</Link>
          <Link href="/wheels" className="hover:text-rose-600 transition">แม็ก & ล้อ</Link>
          <Link href="/accessories" className="hover:text-rose-600 transition">แบตเตอรี่</Link>
          <Link href="/oil" className="hover:text-rose-600 transition">น้ำมันเครื่อง</Link>
          <Link href="/promotions" className="hover:text-rose-600 transition">โปรโมชั่น</Link>
          <Link href="/services" className="hover:text-rose-600 transition">บริการของเรา</Link>
          <Link href="/articles" className="hover:text-rose-600 transition">บทความ</Link>
          <Link href="/contact" className="hover:text-rose-600 transition">ติดต่อเรา</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button className="hidden md:flex items-center gap-2 text-sm font-medium hover:text-rose-600 transition">
            <User className="w-4 h-4" />
            เข้าสู่ระบบ
          </button>
          <div className="flex items-center gap-3">
            <button className="text-slate-700 hover:text-rose-600 transition">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-slate-700 hover:text-rose-600 transition relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span>
            </button>
            <button className="lg:hidden text-slate-700">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
