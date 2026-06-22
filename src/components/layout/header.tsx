import Link from "next/link";
import Image from "next/image";
import { Search, Menu, Truck, ShieldCheck, CreditCard, Phone, LogOut } from "lucide-react";
import { cookies } from "next/headers";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customer-session";
import { logoutCustomer } from "@/app/actions/customer-auth";

import { MobileMenu } from "./mobile-menu";
import { CartBadge } from "./cart-badge";
import { DesktopNav } from "./desktop-nav";

export async function Header() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  const customer = token ? await verifyCustomerToken(token) : null;

  return (
    <header className="w-full border-b bg-white sticky top-0 z-50">
      {/* Top bar */}
      <div className="w-full bg-gradient-to-r from-green-800 via-green-700 to-green-600 text-white text-xs py-2 px-4 md:px-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center">
              <Truck className="w-3 h-3" />
            </span>
            จัดส่งฟรี ทั่วประเทศ
          </span>
          <span className="hidden md:flex items-center gap-1">
            <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center">
              <ShieldCheck className="w-3 h-3" />
            </span>
            รับประกันคุณภาพยางแท้ทุกเส้น
          </span>
          <span className="hidden lg:flex items-center gap-1">
            <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center">
              <CreditCard className="w-3 h-3" />
            </span>
            ผ่อน 0% สูงสุด 4 เดือน
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 font-medium">
            <Phone className="w-3 h-3" /> 02-123-4567
          </span>
          <span className="hidden md:flex items-center gap-1 opacity-90">
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
        <DesktopNav />

        {/* Actions */}
        <div className="flex items-center gap-3 md:gap-4">
          {customer ? (
            /* ล็อกอินแล้ว — แสดงชื่อ + ปุ่ม logout */
            <div className="hidden md:flex items-center gap-2">
              <Link href="/account" className="flex items-center gap-2 hover:opacity-80 transition">
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
              </Link>
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
              className="hidden md:flex items-center gap-2 bg-[#06C755] hover:bg-[#05b34a] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <title>LINE</title>
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              เข้าสู่ระบบด้วย LINE
            </a>
          )}

          <div className="flex items-center gap-4 md:gap-5">
            <CartBadge />
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
