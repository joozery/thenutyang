import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart, Menu, Truck, ShieldCheck, CreditCard, Phone, LogOut } from "lucide-react";
import { cookies } from "next/headers";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customer-session";
import { logoutCustomer } from "@/app/actions/customer-auth";

import { MobileMenu } from "./mobile-menu";

export async function Header() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  const customer = token ? await verifyCustomerToken(token) : null;

  return (
    <header className="w-full border-b bg-white sticky top-0 z-50">
      {/* Top bar */}
      <div className="w-full bg-green-700 text-white text-xs py-2 px-4 md:px-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="bg-green-800 rounded-full w-5 h-5 flex items-center justify-center">
              <Truck className="w-3 h-3" />
            </span>
            จัดส่งฟรี ทั่วประเทศ
          </span>
          <span className="hidden md:flex items-center gap-1">
            <span className="bg-green-800 rounded-full w-5 h-5 flex items-center justify-center">
              <ShieldCheck className="w-3 h-3" />
            </span>
            รับประกันคุณภาพยางแท้ทุกเส้น
          </span>
          <span className="hidden lg:flex items-center gap-1">
            <span className="bg-green-800 rounded-full w-5 h-5 flex items-center justify-center">
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
              src="/เดอะนัท1.png"
              alt="THENUTTIRE เดอะนัทยางยนต์"
              width={280}
              height={80}
              className="h-12 md:h-14 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700">
          <Link href="/" className="text-green-600 border-b-2 border-green-600 pb-1">หน้าหลัก</Link>
          <Link href="/tires" className="hover:text-green-600 transition">ยางรถยนต์</Link>
          <Link href="/promotions" className="hover:text-green-600 transition">โปรโมชั่น</Link>
          <Link href="/services" className="hover:text-green-600 transition">บริการของเรา</Link>
          <Link href="/articles" className="hover:text-green-600 transition">บทความ</Link>
          <Link href="/contact" className="hover:text-green-600 transition">ติดต่อเรา</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3 md:gap-4">
          {customer ? (
            /* ล็อกอินแล้ว — แสดงชื่อ + ปุ่ม logout */
            <div className="hidden md:flex items-center gap-2">
              {customer.pictureUrl && (
                <img
                  src={customer.pictureUrl}
                  alt={customer.displayName}
                  className="w-8 h-8 rounded-full object-cover border-2 border-[#06C755]"
                />
              )}
              <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                {customer.displayName}
              </span>
              <form action={logoutCustomer}>
                <button
                  type="submit"
                  title="ออกจากระบบ"
                  className="text-slate-400 hover:text-green-600 transition p-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            /* ยังไม่ได้ล็อกอิน — แสดงปุ่ม LINE Login */
            <a
              href="/api/auth/line?returnTo=/"
              className="hidden md:flex items-center gap-2 bg-[#06C755] hover:bg-[#05b34a] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M19.952 12.447c0-4.41-4.42-7.997-9.852-7.997S.248 8.037.248 12.447c0 3.95 3.503 7.264 8.236 7.888.32.07.757.21.867.484.1.247.065.634.032.883l-.14.84c-.042.247-.195.966.846.527 1.04-.44 5.613-3.306 7.656-5.659 1.41-1.548 2.207-3.12 2.207-4.963z" />
              </svg>
              เข้าสู่ระบบด้วย LINE
            </a>
          )}

          <div className="flex items-center gap-4 md:gap-5">
            <button className="hidden md:flex text-slate-700 hover:text-green-600 transition">
              <Search className="w-5 h-5" />
            </button>
            <Link href="/cart" className="text-slate-700 hover:text-green-600 transition relative">
              <ShoppingCart className="w-6 h-6 md:w-5 md:h-5" />
              <span className="absolute -top-2 -right-2 bg-green-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">0</span>
            </Link>
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
