import Link from 'next/link';
import { User, Package, Calendar, Car, LogOut, ChevronRight, Bell } from 'lucide-react';
import { cookies } from 'next/headers';
import { verifyCustomerToken, CUSTOMER_COOKIE } from '@/lib/customer-session';
import { logoutCustomer } from '@/app/actions/customer-auth';
import { getCustomerProfile } from '@/lib/customer-profile';
import { ProfileForm } from '@/components/account/profile-form';

export const metadata = { title: 'บัญชีของฉัน | THENUTTIRE' };

export default async function AccountPage() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  const session = token ? await verifyCustomerToken(token) : null;

  const isLoggedIn = !!session;

  if (isLoggedIn && session) {
    const profile = await getCustomerProfile(session.lineUserId);
    // ใช้ข้อมูลจาก LINE Session
    const customer = {
      name: session.displayName,
      avatar: session.pictureUrl || 'https://i.pravatar.cc/150?img=32',
      car: 'ยังไม่ได้เพิ่มข้อมูลรถ',
      points: 0,
    };

    return (
      <div className="bg-slate-50 min-h-screen py-6 md:py-10">
        <div className="container mx-auto px-4 md:px-8 max-w-2xl">
          {/* Header Profile */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6 flex items-center gap-5">
            <div className="w-20 h-20 rounded-full border-4 border-green-50 shadow-sm overflow-hidden shrink-0">
              <img src={customer.avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-slate-900 truncate">{customer.name}</h1>
            </div>
            <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors relative">
              <Bell size={20} />
            </button>
          </div>

          <ProfileForm profile={profile} />

          {/* Menus */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6">
            <Link href="/account/orders" className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Package size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">ประวัติการสั่งซื้อ</h3>
                <p className="text-xs text-slate-500 mt-0.5">ติดตามสถานะและดูประวัติการซื้อยาง</p>
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </Link>
          </div>

          <form action={logoutCustomer}>
            <button type="submit" className="w-full py-4 text-slate-500 font-bold bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-colors flex items-center justify-center gap-2">
              <LogOut size={18} />
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Not logged in UI (LINE Login)
  return (
    <div className="bg-slate-50 min-h-screen py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-8 max-w-xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-slate-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">บัญชีของฉัน</h1>
          <p className="text-slate-500">กรุณาเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อและนัดหมาย</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-12 flex flex-col items-center">
          <div className="w-20 h-20 bg-[#00B900]/10 rounded-3xl flex items-center justify-center mb-8">
            <span className="text-[#00B900] font-black text-3xl">LINE</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3 text-center">เข้าสู่ระบบด้วย LINE</h2>
          <p className="text-slate-500 text-center mb-10 leading-relaxed">
            สะดวก รวดเร็ว ไม่ต้องจำรหัสผ่าน สามารถดูประวัติการสั่งซื้อ และรับการแจ้งเตือนสถานะต่างๆ ได้ทันทีผ่านแชท
          </p>
          
          <Link href="/api/auth/line" className="w-full max-w-sm bg-[#00B900] hover:bg-[#009900] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#00B900]/30 hover:shadow-xl hover:-translate-y-1 transform duration-200">
            <span className="text-xl font-black leading-none">LINE</span> <span className="text-lg">เข้าสู่ระบบเลย</span>
          </Link>
          
          <p className="text-xs text-slate-400 mt-8 text-center">
            การเข้าสู่ระบบถือว่าท่านยอมรับ <a href="#" className="underline hover:text-slate-600">เงื่อนไขการให้บริการ</a> และ <a href="#" className="underline hover:text-slate-600">นโยบายความเป็นส่วนตัว</a>
          </p>
        </div>
      </div>
    </div>
  );
}
