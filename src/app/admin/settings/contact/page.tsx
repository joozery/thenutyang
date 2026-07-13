'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, MapPin, Phone, MessageSquare, Mail, Clock, RefreshCw, CheckCircle, AlertCircle, X, UploadCloud, Share2 } from 'lucide-react';
import { uploadImage } from '@/app/actions/upload';

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] text-sm font-bold text-white transition-all transform animate-in slide-in-from-bottom-5 ${type === 'success' ? 'bg-slate-900' : 'bg-red-500'}`}>
      {type === 'success' ? <CheckCircle size={20} className="text-green-400" /> : <AlertCircle size={20} />}
      {msg}
      <button onClick={onClose} className="ml-3 opacity-70 hover:opacity-100 bg-white/10 p-1 rounded-lg transition-colors"><X size={16} /></button>
    </div>
  );
}

export default function ContactSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // อัปโหลดโลโก้โซเชียลรายช่องทาง — จำว่ากำลังอัปช่องไหนอยู่
  const iconInputRef = useRef<HTMLInputElement>(null);
  const [uploadingIconField, setUploadingIconField] = useState<string | null>(null);
  // ช่องทางโซเชียลที่เพิ่มเอง (ชื่อ + ลิงก์ + โลโก้)
  const [customSocials, setCustomSocials] = useState<{ name: string; url: string; icon: string }[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    address: '',
    phoneMain: '',
    phoneMainLabel: '',
    phoneSale: '',
    phoneSaleLabel: '',
    lineId: '',
    lineLabel: '',
    lineUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    tiktokUrl: '',
    shopeeUrl: '',
    thaimartUrl: '',
    lineIcon: '',
    facebookIcon: '',
    instagramIcon: '',
    tiktokIcon: '',
    shopeeIcon: '',
    thaimartIcon: '',
    email: '',
    workingHours: '',
    workingDays: '',
    workingHours2: '',
    workingDays2: '',
    googleMapUrl: '',
    heroTitle: '',
    heroSubtitle: '',
    heroDesc: '',
    heroImage: ''
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings/contact');
      if (res.ok) {
        const data = await res.json();
        setFormData({
          address: data.address || '',
          phoneMain: data.phoneMain || '',
          phoneMainLabel: data.phoneMainLabel || '',
          phoneSale: data.phoneSale || '',
          phoneSaleLabel: data.phoneSaleLabel || '',
          lineId: data.lineId || '',
          lineLabel: data.lineLabel || '',
          lineUrl: data.lineUrl || '',
          facebookUrl: data.facebookUrl || '',
          instagramUrl: data.instagramUrl || '',
          tiktokUrl: data.tiktokUrl || '',
          shopeeUrl: data.shopeeUrl || '',
          thaimartUrl: data.thaimartUrl || '',
          lineIcon: data.lineIcon || '',
          facebookIcon: data.facebookIcon || '',
          instagramIcon: data.instagramIcon || '',
          tiktokIcon: data.tiktokIcon || '',
          shopeeIcon: data.shopeeIcon || '',
          thaimartIcon: data.thaimartIcon || '',
          email: data.email || '',
          workingHours: data.workingHours || '',
          workingDays: data.workingDays || '',
          workingHours2: data.workingHours2 || '',
          workingDays2: data.workingDays2 || '',
          googleMapUrl: data.googleMapUrl || '',
          heroTitle: data.heroTitle || 'ติดต่อเรา',
          heroSubtitle: data.heroSubtitle || 'THE NUT TIRE',
          heroDesc: data.heroDesc || 'สอบถามข้อมูลเพิ่มเติม จองคิวเปลี่ยนยาง\\nหรือปรึกษาปัญหาเรื่องรถยนต์ เราพร้อมดูแลคุณ',
          heroImage: data.heroImage || '/yang.png'
        });
        setCustomSocials(Array.isArray(data.customSocials) ? data.customSocials : []);
      }
    } catch (error) {
      console.error('Error fetching contact settings:', error);
      showToast('ไม่สามารถโหลดข้อมูลการติดต่อได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await uploadImage(fd, 'settings');
      setFormData(prev => ({ ...prev, heroImage: res.url }));
      showToast('อัปโหลดรูปภาพสำเร็จ', 'success');
    } catch (err: any) {
      showToast(err.message || 'อัปโหลดล้มเหลว', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const field = uploadingIconField;
    if (!file || !field) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await uploadImage(fd, 'settings');
      if (field.startsWith('custom:')) {
        const idx = Number(field.split(':')[1]);
        setCustomSocials(prev => prev.map((c, i) => i === idx ? { ...c, icon: res.url } : c));
      } else {
        setFormData(prev => ({ ...prev, [field]: res.url }));
      }
      showToast('อัปโหลดโลโก้สำเร็จ', 'success');
    } catch (err: any) {
      showToast(err.message || 'อัปโหลดล้มเหลว', 'error');
    } finally {
      setIsUploading(false);
      setUploadingIconField(null);
      if (iconInputRef.current) iconInputRef.current.value = '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Automatically extract src if user pasted a full iframe tag for Google Maps
    if (name === 'googleMapUrl' && value.includes('<iframe') && value.includes('src="')) {
      const match = value.match(/src="([^"]+)"/);
      if (match && match[1]) {
        setFormData(prev => ({ ...prev, [name]: match[1] }));
        return;
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch('/api/admin/settings/contact', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, customSocials: customSocials.filter(c => c.name.trim() && c.url.trim()) }),
      });

      if (res.ok) {
        showToast('บันทึกข้อมูลการติดต่อเรียบร้อยแล้ว', 'success');
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Error updating contact settings:', error);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">ตั้งค่าข้อมูลการติดต่อ</h1>
          <p className="text-sm text-slate-500 mt-1">
            แก้ไขข้อมูลที่อยู่, เบอร์โทรศัพท์, และแผนที่ ที่แสดงบนหน้าติดต่อเรา
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">ส่วนหัวข้อหน้าติดต่อเรา (Hero Section)</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">หัวข้อหลัก (Title)</label>
              <input
                type="text"
                name="heroTitle"
                value={formData.heroTitle}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
                placeholder="เช่น ติดต่อเรา"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">หัวข้อรอง (Subtitle)</label>
              <input
                type="text"
                name="heroSubtitle"
                value={formData.heroSubtitle}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
                placeholder="เช่น THE NUT TIRE"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">รายละเอียด (Description)</label>
            <textarea
              name="heroDesc"
              value={formData.heroDesc}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
              placeholder="กรอกรายละเอียด..."
            />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">รูปภาพพื้นหลัง (Background Image)</label>
            <div className="flex gap-3 items-center">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleUpload}
                className="hidden"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <UploadCloud size={18} />
                {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปใหม่'}
              </button>
              <input
                value={formData.heroImage}
                onChange={(e) => setFormData(prev => ({ ...prev, heroImage: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
                placeholder="หรือวาง URL รูปภาพ (เช่น /yang.png)"
              />
              {formData.heroImage && (
                <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  <img src={formData.heroImage} alt="Hero background preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2">อัปโหลดรูปภาพใหม่ หรือใส่ URL รูปภาพที่มีอยู่แล้ว (ค่าเริ่มต้น: `/yang.png`)</p>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <MapPin size={16} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">ที่ตั้งร้าน</h2>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ที่อยู่แบบเต็ม</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
              placeholder="กรอกที่อยู่..."
            />
            <p className="text-xs text-slate-400">ใช้การขึ้นบรรทัดใหม่เพื่อให้สวยงามบนหน้าเว็บ</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Phone size={16} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">ช่องทางการติดต่ออื่นๆ</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">เบอร์โทรศัพท์ 1 (หลัก)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="phoneMain"
                    value={formData.phoneMain}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
                    placeholder="เบอร์โทร"
                  />
                  <input
                    type="text"
                    name="phoneMainLabel"
                    value={formData.phoneMainLabel}
                    onChange={handleChange}
                    className="w-1/3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
                    placeholder="(ป้ายกำกับ)"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">เบอร์โทรศัพท์ 2</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="phoneSale"
                    value={formData.phoneSale}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
                    placeholder="เบอร์โทร"
                  />
                  <input
                    type="text"
                    name="phoneSaleLabel"
                    value={formData.phoneSaleLabel}
                    onChange={handleChange}
                    className="w-1/3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
                    placeholder="(ป้ายกำกับ)"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">LINE Official</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="lineId"
                    value={formData.lineId}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
                    placeholder="@thenuttire"
                  />
                  <input
                    type="text"
                    name="lineLabel"
                    value={formData.lineLabel}
                    onChange={handleChange}
                    className="w-1/3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
                    placeholder="(มี @ ด้วย)"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">อีเมล</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
                  placeholder="contact@example.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center">
              <Share2 size={16} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">ลิงก์โซเชียล / ช่องทางออนไลน์</h2>
          </div>
          <p className="text-xs text-slate-400 mb-6">วางลิงก์เต็ม (ขึ้นต้นด้วย https://) ช่องไหนเว้นว่าง ปุ่มนั้นจะไม่แสดงบนหน้าติดต่อเรา · กดปุ่มสี่เหลี่ยมหน้าช่องเพื่ออัปโหลดโลโก้เอง (ไม่อัปโหลด = ใช้ไอคอนมาตรฐาน)</p>

          <input type="file" accept="image/*" ref={iconInputRef} onChange={handleIconUpload} className="hidden" />
          <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
            {([
              { name: 'lineUrl',      icon: 'lineIcon',      label: 'ลิงก์ LINE',       placeholder: 'https://line.me/R/ti/p/%40thenuttire (เว้นว่าง = สร้างจาก LINE ID อัตโนมัติ)' },
              { name: 'facebookUrl',  icon: 'facebookIcon',  label: 'เพจ Facebook',     placeholder: 'https://www.facebook.com/thenuttire' },
              { name: 'instagramUrl', icon: 'instagramIcon', label: 'Instagram (ไอจี)', placeholder: 'https://www.instagram.com/thenuttire' },
              { name: 'tiktokUrl',    icon: 'tiktokIcon',    label: 'TikTok (ติ๊กต๊อก)', placeholder: 'https://www.tiktok.com/@thenuttire' },
              { name: 'shopeeUrl',    icon: 'shopeeIcon',    label: 'Shopee (ช้อปปี้)',  placeholder: 'https://shopee.co.th/thenuttire' },
              { name: 'thaimartUrl',  icon: 'thaimartIcon',  label: 'ไทยมาร์ท',          placeholder: 'https://... ลิงก์ร้านบนไทยมาร์ท' },
            ] as const).map(f => (
              <div key={f.name}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{f.label}</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => { setUploadingIconField(f.icon); iconInputRef.current?.click(); }}
                    title={formData[f.icon] ? 'เปลี่ยนโลโก้' : 'อัปโหลดโลโก้ (ไม่บังคับ)'}
                    className="shrink-0 w-11 h-11 rounded-xl border border-slate-200 bg-slate-50 hover:border-green-300 hover:bg-green-50 flex items-center justify-center overflow-hidden transition-colors disabled:opacity-50"
                  >
                    {formData[f.icon] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={formData[f.icon]} alt={f.label} className="w-7 h-7 object-contain" />
                    ) : (
                      <UploadCloud size={15} className="text-slate-400" />
                    )}
                  </button>
                  <input
                    type="url"
                    name={f.name}
                    value={formData[f.name]}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
                    placeholder={f.placeholder}
                  />
                  {formData[f.icon] && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, [f.icon]: '' }))}
                      title="ลบโลโก้ กลับไปใช้ไอคอนมาตรฐาน"
                      className="shrink-0 w-11 h-11 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ช่องทางเพิ่มเติมที่กำหนดเอง */}
          <div className="mt-6 pt-5 border-t border-dashed border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-slate-700">ช่องทางเพิ่มเติม (กำหนดเอง)</p>
                <p className="text-xs text-slate-400 mt-0.5">เพิ่มช่องทางอื่นๆ ได้เอง เช่น Lazada, YouTube, X — ตั้งชื่อ วางลิงก์ และอัปโหลดโลโก้</p>
              </div>
              <button
                type="button"
                onClick={() => setCustomSocials(prev => [...prev, { name: '', url: '', icon: '' }])}
                className="shrink-0 px-4 py-2 rounded-xl border border-green-600 text-xs font-bold text-green-700 hover:bg-green-50 transition-colors"
              >
                + เพิ่มช่องทาง
              </button>
            </div>

            {customSocials.length === 0 ? (
              <p className="text-xs text-slate-300 text-center py-3">ยังไม่มีช่องทางเพิ่มเติม — กด "+ เพิ่มช่องทาง" เพื่อเริ่ม</p>
            ) : (
              <div className="space-y-3">
                {customSocials.map((c, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => { setUploadingIconField(`custom:${idx}`); iconInputRef.current?.click(); }}
                      title={c.icon ? 'เปลี่ยนโลโก้' : 'อัปโหลดโลโก้'}
                      className="shrink-0 w-11 h-11 rounded-xl border border-slate-200 bg-slate-50 hover:border-green-300 hover:bg-green-50 flex items-center justify-center overflow-hidden transition-colors disabled:opacity-50"
                    >
                      {c.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.icon} alt={c.name} className="w-7 h-7 object-contain" />
                      ) : (
                        <UploadCloud size={15} className="text-slate-400" />
                      )}
                    </button>
                    <input
                      value={c.name}
                      onChange={e => setCustomSocials(prev => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                      placeholder="ชื่อช่องทาง เช่น Lazada"
                      className="w-1/3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
                    />
                    <input
                      type="url"
                      value={c.url}
                      onChange={e => setCustomSocials(prev => prev.map((x, i) => i === idx ? { ...x, url: e.target.value } : x))}
                      placeholder="https://..."
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomSocials(prev => prev.filter((_, i) => i !== idx))}
                      title="ลบช่องทางนี้"
                      className="shrink-0 w-11 h-11 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <Clock size={16} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">เวลาทำการ</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ช่วงที่ 1</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">วันทำการ</label>
                  <input
                    type="text"
                    name="workingDays"
                    value={formData.workingDays}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
                    placeholder="เช่น จันทร์ - ศุกร์"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">เวลาทำการ</label>
                  <input
                    type="text"
                    name="workingHours"
                    value={formData.workingHours}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
                    placeholder="เช่น 08:00 - 18:00 น."
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-dashed border-slate-200 pt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ช่วงที่ 2 <span className="font-normal normal-case text-slate-400">(ไม่บังคับ — ว่างไว้เพื่อซ่อน)</span></p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">วันทำการ</label>
                  <input
                    type="text"
                    name="workingDays2"
                    value={formData.workingDays2}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
                    placeholder="เช่น เสาร์ - อาทิตย์"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">เวลาทำการ</label>
                  <input
                    type="text"
                    name="workingHours2"
                    value={formData.workingHours2}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm"
                    placeholder="เช่น 08:00 - 17:00 น."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Google Map */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MapPin size={16} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">แผนที่ Google Maps</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">URL แผนที่ (Embed URL แบบ src)</label>
              <textarea
                name="googleMapUrl"
                value={formData.googleMapUrl}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm font-mono"
                placeholder="https://www.google.com/maps/embed?pb=..."
              />
              <p className="text-xs text-slate-400 mt-2">คัดลอกเฉพาะลิงก์ที่อยู่ใน src="..." จากโค้ดฝังของ Google Maps</p>
            </div>
            
            {formData.googleMapUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200 h-64 mt-4">
                <iframe 
                  src={formData.googleMapUrl} 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
