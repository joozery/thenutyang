import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, Truck, ShieldCheck, RefreshCw, Shield, ArrowUp } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full font-sans">
      {/* Top Pink Bar */}
      <div className="bg-rose-600 text-white py-6">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-rose-500/50">
            <div className="flex items-center gap-4 justify-center md:justify-start pt-4 md:pt-0">
              <Truck className="w-8 h-8 opacity-90" strokeWidth={1.5} />
              <div>
                <h4 className="font-bold text-sm">จัดส่งฟรี</h4>
                <p className="text-xs text-rose-100 mt-0.5">ทั่วประเทศ</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center md:justify-start pt-4 md:pt-0 md:pl-8">
              <ShieldCheck className="w-8 h-8 opacity-90" strokeWidth={1.5} />
              <div>
                <h4 className="font-bold text-sm">รับประกันยาง</h4>
                <p className="text-xs text-rose-100 mt-0.5">ขาด บวม แตก</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center md:justify-start pt-4 md:pt-0 md:pl-8">
              <RefreshCw className="w-8 h-8 opacity-90" strokeWidth={1.5} />
              <div>
                <h4 className="font-bold text-sm">คืนสินค้าภายใน 7 วัน</h4>
                <p className="text-xs text-rose-100 mt-0.5">เงื่อนไขเป็นไปตามที่กำหนด</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center md:justify-start pt-4 md:pt-0 md:pl-8">
              <Shield className="w-8 h-8 opacity-90" strokeWidth={1.5} />
              <div>
                <h4 className="font-bold text-sm">ปลอดภัย 100%</h4>
                <p className="text-xs text-rose-100 mt-0.5">ชำระเงินปลอดภัยทุกช่องทาง</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="bg-[#1e1e1e] text-white pt-16 pb-8 relative">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8 pb-10 border-b border-white/10">
            
            {/* Brand & Social */}
            <div className="lg:col-span-2 space-y-6">
              <Link href="/" className="inline-block mb-2">
                <Image 
                  src="/logo/logothenun.png" 
                  alt="เดอะนัททายางยนต์" 
                  width={200} 
                  height={60} 
                  className="h-16 w-auto object-contain"
                />
              </Link>
              
              <div className="text-slate-300 text-xs leading-relaxed space-y-1">
                <p>ครบ จบ เรื่องยาง และบริการรถยนต์</p>
                <p>ศูนย์บริการยางรถยนต์ครบวงจร</p>
                <p>จำหน่ายยางแท้จากแบรนด์ชั้นนำ</p>
                <p>พร้อมบริการโดยช่างมืออาชีพ</p>
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <Link href="#" className="w-8 h-8 rounded-full border border-slate-500 flex items-center justify-center hover:bg-rose-600 hover:border-rose-600 transition-colors">
                  <span className="text-[10px] font-bold text-white">fb</span>
                </Link>
                <Link href="#" className="w-8 h-8 rounded-full border border-slate-500 flex items-center justify-center hover:bg-rose-600 hover:border-rose-600 transition-colors">
                  <span className="text-[10px] font-bold text-white">line</span>
                </Link>
                <Link href="#" className="w-8 h-8 rounded-full border border-slate-500 flex items-center justify-center hover:bg-rose-600 hover:border-rose-600 transition-colors">
                  <span className="text-[10px] font-bold text-white">yt</span>
                </Link>
                <Link href="#" className="w-8 h-8 rounded-full border border-slate-500 flex items-center justify-center hover:bg-rose-600 hover:border-rose-600 transition-colors">
                  <span className="text-[10px] font-bold text-white">tk</span>
                </Link>
              </div>
            </div>
            
            {/* Menu 1 */}
            <div>
              <h3 className="text-sm font-bold mb-6 text-white">เมนูหลัก</h3>
              <ul className="space-y-3">
                <li><Link href="/" className="text-slate-400 hover:text-white transition-colors text-xs">หน้าหลัก</Link></li>
                <li><Link href="/tires" className="text-slate-400 hover:text-white transition-colors text-xs">ยางรถยนต์</Link></li>
                <li><Link href="/wheels" className="text-slate-400 hover:text-white transition-colors text-xs">แม็ก & ล้อ</Link></li>
                <li><Link href="/battery" className="text-slate-400 hover:text-white transition-colors text-xs">แบตเตอรี่</Link></li>
                <li><Link href="/oil" className="text-slate-400 hover:text-white transition-colors text-xs">น้ำมันเครื่อง</Link></li>
                <li><Link href="/promotions" className="text-slate-400 hover:text-white transition-colors text-xs">โปรโมชั่น</Link></li>
              </ul>
            </div>
            
            {/* Menu 2 */}
            <div>
              <h3 className="text-sm font-bold mb-6 text-white">บริการของเรา</h3>
              <ul className="space-y-3">
                <li><Link href="/services/change-tires" className="text-slate-400 hover:text-white transition-colors text-xs">เปลี่ยนยาง</Link></li>
                <li><Link href="/services/alignment" className="text-slate-400 hover:text-white transition-colors text-xs">ตั้งศูนย์ - ถ่วงล้อ</Link></li>
                <li><Link href="/services/brake" className="text-slate-400 hover:text-white transition-colors text-xs">ปะยาง - ซ่อมยาง</Link></li>
                <li><Link href="/services/oil-change" className="text-slate-400 hover:text-white transition-colors text-xs">เปลี่ยนถ่ายน้ำมันเครื่อง</Link></li>
                <li><Link href="/services/battery" className="text-slate-400 hover:text-white transition-colors text-xs">แบตเตอรี่</Link></li>
                <li><Link href="/services/inspection" className="text-slate-400 hover:text-white transition-colors text-xs">ตรวจเช็คสภาพรถ</Link></li>
              </ul>
            </div>

            {/* Menu 3 */}
            <div>
              <h3 className="text-sm font-bold mb-6 text-white">ช่วยเหลือ</h3>
              <ul className="space-y-3">
                <li><Link href="/help/order" className="text-slate-400 hover:text-white transition-colors text-xs">วิธีการสั่งซื้อ</Link></li>
                <li><Link href="/help/payment" className="text-slate-400 hover:text-white transition-colors text-xs">การชำระเงิน</Link></li>
                <li><Link href="/help/shipping" className="text-slate-400 hover:text-white transition-colors text-xs">การจัดส่ง</Link></li>
                <li><Link href="/help/warranty" className="text-slate-400 hover:text-white transition-colors text-xs">การรับประกัน</Link></li>
                <li><Link href="/faq" className="text-slate-400 hover:text-white transition-colors text-xs">คำถามที่พบบ่อย</Link></li>
                <li><Link href="/contact" className="text-slate-400 hover:text-white transition-colors text-xs">ติดต่อเรา</Link></li>
              </ul>
            </div>
            
            {/* Contact */}
            <div>
              <h3 className="text-sm font-bold mb-6 text-white">ติดต่อเรา</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-white mt-0.5"><Phone className="w-3.5 h-3.5" /></span>
                  <span className="text-slate-400 text-xs">02-123-4567</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white font-bold text-[10px] mt-1 w-3.5 h-3.5 flex items-center justify-center">L</span>
                  <span className="text-slate-400 text-xs">@thenutyangyont</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white mt-0.5"><Mail className="w-3.5 h-3.5" /></span>
                  <span className="text-slate-400 text-xs">info@thenutyangyont.com</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white mt-0.5"><MapPin className="w-3.5 h-3.5" /></span>
                  <span className="text-slate-400 text-xs leading-relaxed">123 ถนนกาญจนาภิเษก<br/>แขวงบางแค เขตบางแค<br/>กรุงเทพฯ 10160</span>
                </li>
              </ul>
            </div>
            
          </div>
          
          {/* Bottom */}
          <div className="pt-6 flex flex-col md:flex-row justify-center items-center text-[10px] text-slate-500 gap-4">
            <p>© 2024 เดอะนัททายางยนต์. สงวนลิขสิทธิ์ทุกประการ</p>
            <div className="hidden md:block">
              <span className="mx-2">|</span>
              <Link href="/privacy" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</Link>
              <span className="mx-2">|</span>
              <Link href="/terms" className="hover:text-white transition-colors">เงื่อนไขการให้บริการ</Link>
            </div>
          </div>

          {/* Scroll to Top Button */}
          <a 
            href="#"
            className="absolute right-4 md:right-8 bottom-6 w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center hover:bg-rose-700 transition-colors shadow-lg z-50"
          >
            <ArrowUp className="w-5 h-5 text-white" />
          </a>
        </div>
      </div>
    </footer>
  );
}
