"use client";
import Link from 'next/link';
import { Bell, Shield, Printer, CreditCard, Truck, MessageSquare, ChevronRight } from 'lucide-react';

const settingGroups = [
  {
    title: "ร้านค้า",
    items: [
      { label: "ข้อมูลร้านค้า", desc: "ชื่อร้าน, ที่อยู่, เบอร์โทร, โลโก้", icon: <Shield size={18} /> },
      { label: "การพิมพ์ใบเสร็จ", desc: "หัวกระดาษ, ลายเซ็น, ตราประทับสำหรับเอกสาร", icon: <Printer size={18} />, href: "/admin/documents/settings" },
      { label: "ช่องทางการชำระเงิน", desc: "เงินสด, บัตรเครดิต, QR Code, โอน", icon: <CreditCard size={18} />, href: "/admin/payments" },
    ],
  },
  {
    title: "การแจ้งเตือน",
    items: [
      { label: "การแจ้งเตือน", desc: "ตั้งค่าการแจ้งเตือนสต๊อก, บิล, นัดหมาย", icon: <Bell size={18} /> },
      { label: "LINE Notify", desc: "เชื่อมต่อ LINE เพื่อแจ้งเตือนอัตโนมัติ", icon: <MessageSquare size={18} /> },
    ],
  },
  {
    title: "ซัพพลายเออร์",
    items: [
      { label: "จัดการซัพพลายเออร์", desc: "รายชื่อและข้อมูลติดต่อซัพพลายเออร์", icon: <Truck size={18} /> },
    ],
  },
];

const toggleItems = [
  { label: "แจ้งเตือนเมื่อสต๊อกต่ำกว่าขั้นต่ำ", checked: true },
  { label: "แจ้งเตือนบิลค้างชำระเกิน 7 วัน", checked: true },
  { label: "ส่ง SMS ยืนยันนัดหมายให้ลูกค้า", checked: false },
  { label: "สำรองข้อมูลอัตโนมัติทุกวัน", checked: true },
  { label: "แสดงราคาทุนในรายงาน", checked: false },
];

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">การตั้งค่า</h1>
        <p className="text-sm text-slate-500 mt-1">ตั้งค่าการทำงานของระบบ</p>
      </div>

      {/* Shop Info Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0">
          <img src="/logo/logothenun.png" alt="logo" className="h-10 object-contain" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-900 text-lg">เดอะนัทยางยนต์</p>
          <p className="text-sm text-slate-500">123 ถ.รัชดา แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400</p>
          <p className="text-sm text-slate-500">โทร: 02-123-4567</p>
        </div>
        <button className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 shrink-0">
          แก้ไข
        </button>
      </div>

      {/* Setting Groups */}
      {settingGroups.map((group) => (
        <div key={group.title} className="mb-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">{group.title}</h2>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
            {group.items.map((item) => {
              const content = (
                <>
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 shrink-0" />
                </>
              );
              return item.href ? (
                <Link key={item.label} href={item.href} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left">
                  {content}
                </Link>
              ) : (
                <button key={item.label} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left">
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Toggles */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">การทำงานอัตโนมัติ</h2>
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
          {toggleItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between px-5 py-4">
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
              <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.checked ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${item.checked ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
