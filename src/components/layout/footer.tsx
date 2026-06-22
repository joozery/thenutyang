import Link from "next/link";
import { Phone, Mail, MapPin, Truck, ShieldCheck, RefreshCw, Shield, ArrowUp } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full font-sans">
      {/* Top Pink/Green Bar */}
      <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white py-6">
        <div className="container mx-auto px-2 md:px-8">
          <div className="grid grid-cols-3 gap-2 md:gap-6 md:divide-x divide-green-500/50">
            <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-4 justify-start text-center md:text-left">
              <Truck className="w-5 h-5 md:w-8 md:h-8 opacity-90" strokeWidth={1.5} />
              <div>
                <h4 className="font-bold text-[10px] md:text-sm leading-tight">จัดส่งฟรี</h4>
                <p className="text-[10px] md:text-xs text-green-100 mt-0.5">ทั่วประเทศ</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-4 justify-start text-center md:text-left md:pl-8">
              <ShieldCheck className="w-5 h-5 md:w-8 md:h-8 opacity-90" strokeWidth={1.5} />
              <div>
                <h4 className="font-bold text-[10px] md:text-sm leading-tight">รับประกันยาง</h4>
                <p className="text-[10px] md:text-xs text-green-100 mt-0.5">ขาด บวม แตก</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-4 justify-start text-center md:text-left md:pl-8">
              <Shield className="w-5 h-5 md:w-8 md:h-8 opacity-90" strokeWidth={1.5} />
              <div>
                <h4 className="font-bold text-[10px] md:text-sm leading-tight">ปลอดภัย 100%</h4>
                <p className="text-[10px] md:text-xs text-green-100 mt-0.5">ชำระเงินปลอดภัย</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="bg-black text-white pt-10 md:pt-16 pb-8 relative">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8 pb-10 border-b border-white/10">
            
            {/* Brand & Social */}
            <div className="lg:col-span-2 space-y-6 flex flex-col items-center md:items-start text-center md:text-left">
              <Link href="/" className="inline-block mb-2">
                <img 
                  src="/เดอะนัท1.png" 
                  alt="เดอะนัททายางยนต์" 
                  className="h-10 md:h-12 w-auto object-contain"
                />
              </Link>
              
              <div className="text-slate-300 text-xs leading-relaxed space-y-1">
                <p>ครบ จบ เรื่องยาง และบริการรถยนต์</p>
                <p>ศูนย์บริการยางรถยนต์ครบวงจร</p>
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <Link href="#" className="w-8 h-8 rounded-full border border-slate-500 flex items-center justify-center hover:bg-green-600 hover:border-green-600 transition-colors">
                  <span className="text-[10px] font-bold text-white">fb</span>
                </Link>
                <Link href="#" className="w-8 h-8 rounded-full border border-slate-500 flex items-center justify-center hover:bg-green-600 hover:border-green-600 transition-colors">
                  <span className="text-[10px] font-bold text-white">line</span>
                </Link>
                <Link href="#" className="w-8 h-8 rounded-full border border-slate-500 flex items-center justify-center hover:bg-green-600 hover:border-green-600 transition-colors">
                  <span className="text-[10px] font-bold text-white">yt</span>
                </Link>
              </div>
            </div>
            
            {/* Menu 1 (Desktop Only) */}
            <div className="hidden md:block">
              <h3 className="text-sm font-bold mb-6 text-white">เมนูหลัก</h3>
              <ul className="space-y-3">
                <li><Link href="/" className="text-slate-400 hover:text-white transition-colors text-xs">หน้าหลัก</Link></li>
                <li><Link href="/tires" className="text-slate-400 hover:text-white transition-colors text-xs">ยางรถยนต์</Link></li>
                <li><Link href="/wheels" className="text-slate-400 hover:text-white transition-colors text-xs">แม็ก & ล้อ</Link></li>
              </ul>
            </div>
            
            {/* Menu 2 (Desktop Only) */}
            <div className="hidden md:block">
              <h3 className="text-sm font-bold mb-6 text-white">บริการของเรา</h3>
              <ul className="space-y-3">
                <li><Link href="/services" className="text-slate-400 hover:text-white transition-colors text-xs">เปลี่ยนยาง</Link></li>
                <li><Link href="/services" className="text-slate-400 hover:text-white transition-colors text-xs">ตั้งศูนย์ - ถ่วงล้อ</Link></li>
                <li><Link href="/services" className="text-slate-400 hover:text-white transition-colors text-xs">ปะยาง - ซ่อมยาง</Link></li>
              </ul>
            </div>

            {/* Menu 3 (Desktop Only) */}
            <div className="hidden md:block">
              <h3 className="text-sm font-bold mb-6 text-white">ช่วยเหลือ</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-xs">วิธีการสั่งซื้อ</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-xs">การชำระเงิน</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-xs">การจัดส่ง</Link></li>
              </ul>
            </div>
            
            {/* Contact (Visible on Mobile & Desktop) */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h3 className="text-sm font-bold mb-4 md:mb-6 text-white">ติดต่อเรา</h3>
              <ul className="space-y-4 inline-block text-left">
                <li className="flex items-center gap-3">
                  <span className="text-white"><Phone className="w-4 h-4" /></span>
                  <span className="text-slate-400 text-xs">02-123-4567</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-white font-bold text-xs w-4 h-4 flex items-center justify-center">L</span>
                  <span className="text-slate-400 text-xs">@thenutyangyont</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white mt-0.5"><MapPin className="w-4 h-4" /></span>
                  <span className="text-slate-400 text-xs leading-relaxed">123 ถนนกาญจนาภิเษก<br/>กรุงเทพฯ 10160</span>
                </li>
              </ul>
            </div>
            
          </div>
          
          {/* Bottom */}
          <div className="pt-6 flex flex-col md:flex-row justify-center items-center text-[10px] text-slate-500 gap-4 text-center">
            <p>© 2024 เดอะนัททายางยนต์. สงวนลิขสิทธิ์ทุกประการ</p>
            <div className="flex gap-2">
              <Link href="/privacy" className="hover:text-white transition-colors">ความเป็นส่วนตัว</Link>
              <span>|</span>
              <Link href="/terms" className="hover:text-white transition-colors">เงื่อนไขการใช้บริการ</Link>
            </div>
          </div>

          {/* Scroll to Top Button */}
          <a 
            href="#"
            className="absolute right-4 md:right-8 bottom-[80px] md:bottom-6 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors shadow-lg z-40"
          >
            <ArrowUp className="w-5 h-5 text-white" />
          </a>
        </div>
      </div>
    </footer>
  );
}
