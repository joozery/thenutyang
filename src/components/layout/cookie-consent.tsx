"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem("thenutyang_cookie_consent_v1");
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("thenutyang_cookie_consent_v1", "true");
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem("thenutyang_cookie_consent_v1", "false");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:right-auto md:w-[420px] z-[100] bg-white rounded-2xl border border-slate-200 shadow-2xl transform transition-all duration-500 ease-out translate-y-0 opacity-100">
      <div className="p-5 md:p-6 relative">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 pr-6">
            <div className="bg-green-50 p-2.5 rounded-xl shrink-0 mt-0.5">
              <span className="text-xl leading-none">🍪</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base mb-1.5">
                การตั้งค่าคุกกี้
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                เราใช้คุกกี้เพื่อมอบประสบการณ์การใช้งานที่ดีที่สุดบนเว็บไซต์ของเรา อ่านรายละเอียดเพิ่มเติมได้ที่{" "}
                <Link href="/privacy" className="text-green-600 hover:text-green-700 font-semibold underline underline-offset-2 transition-colors">
                  นโยบายความเป็นส่วนตัว
                </Link>
              </p>
            </div>
          </div>
          
          <div className="flex flex-row gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1 border-slate-200 hover:bg-slate-50 text-slate-600 font-medium h-11 rounded-xl transition-all"
              onClick={declineCookies}
            >
              ปฏิเสธ
            </Button>
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20 font-medium h-11 rounded-xl transition-all"
              onClick={acceptCookies}
            >
              ยอมรับทั้งหมด
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
