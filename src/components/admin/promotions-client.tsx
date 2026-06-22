'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Sparkles, ShieldCheck, CreditCard, Tag, Settings, Car } from 'lucide-react';

export default function PromotionsClient() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    buttonText: 'ดูรายละเอียด',
    buttonLink: '/',
    bgImage: 'from-green-600 to-emerald-800',
    icon: 'Sparkles',
    validUntil: 'ไม่มีวันหมดอายุ',
    order: 0,
    published: true
  });

  const availableIcons = ['Sparkles', 'ShieldCheck', 'CreditCard', 'Tag', 'Settings', 'Car'];
  const availableGradients = [
    { label: 'สีเขียว', value: 'from-green-600 to-emerald-800' },
    { label: 'สีฟ้า', value: 'from-blue-600 to-blue-800' },
    { label: 'สีส้ม', value: 'from-amber-500 to-orange-600' },
    { label: 'สีแดง', value: 'from-rose-500 to-red-700' },
    { label: 'สีม่วง', value: 'from-purple-600 to-indigo-700' },
  ];

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const res = await fetch('/api/admin/promotions');
      const data = await res.json();
      setPromotions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (promo?: any) => {
    if (promo) {
      setEditingId(promo._id);
      setFormData({
        title: promo.title || '',
        subtitle: promo.subtitle || '',
        buttonText: promo.buttonText || 'ดูรายละเอียด',
        buttonLink: promo.buttonLink || '/',
        bgImage: promo.bgImage || 'from-green-600 to-emerald-800',
        icon: promo.icon || 'Sparkles',
        validUntil: promo.validUntil || 'ไม่มีวันหมดอายุ',
        order: promo.order || 0,
        published: promo.published !== false
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        subtitle: '',
        buttonText: 'ดูรายละเอียด',
        buttonLink: '/',
        bgImage: 'from-green-600 to-emerald-800',
        icon: 'Sparkles',
        validUntil: 'ไม่มีวันหมดอายุ',
        order: promotions.length + 1,
        published: true
      });
    }
    setIsModalOpen(true);
  };

  const savePromotion = async () => {
    try {
      const url = editingId ? `/api/admin/promotions/${editingId}` : '/api/admin/promotions';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchPromotions();
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const deletePromotion = async (id: string) => {
    if (!confirm('ยืนยันการลบข้อมูลโปรโมชั่นนี้?')) return;
    
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        fetchPromotions();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-4">กำลังโหลด...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-700">รายการโปรโมชั่นย่อย</h2>
        <button 
          onClick={() => openModal()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> เพิ่มโปรโมชั่น
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-sm">
              <th className="p-4">ลำดับ</th>
              <th className="p-4">สีพื้นหลัง</th>
              <th className="p-4">หัวข้อ</th>
              <th className="p-4">สถานะ</th>
              <th className="p-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {promotions.map((p, idx) => (
              <tr key={p._id} className="hover:bg-slate-50">
                <td className="p-4 text-slate-500">{p.order || idx + 1}</td>
                <td className="p-4">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${p.bgImage}`}></div>
                </td>
                <td className="p-4 font-medium text-slate-800">
                  {p.title}
                  <div className="text-xs text-slate-500 font-normal mt-1">{p.subtitle}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {p.published ? 'เผยแพร่' : 'ซ่อน'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => openModal(p)} className="text-blue-500 hover:text-blue-700 p-2"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deletePromotion(p._id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {promotions.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">ไม่มีข้อมูลโปรโมชั่นย่อย</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-sm z-10">
              <h2 className="text-xl font-bold">{editingId ? 'แก้ไขโปรโมชั่น' : 'เพิ่มโปรโมชั่นใหม่'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">หัวข้อหลัก *</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-green-500"
                  placeholder="เช่น เทิร์นยางเก่า ลดสูงสุด 2,000.-"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">คำบรรยายย่อย</label>
                <input 
                  type="text" 
                  value={formData.subtitle} 
                  onChange={e => setFormData({...formData, subtitle: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-green-500"
                  placeholder="เช่น เพียงนำยางเก่า 4 เส้นมาเทิร์นเมื่อซื้อยางใหม่"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ข้อความปุ่ม</label>
                  <input 
                    type="text" 
                    value={formData.buttonText} 
                    onChange={e => setFormData({...formData, buttonText: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ลิงก์ปุ่ม</label>
                  <input 
                    type="text" 
                    value={formData.buttonLink} 
                    onChange={e => setFormData({...formData, buttonLink: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">สีพื้นหลัง</label>
                  <select 
                    value={formData.bgImage} 
                    onChange={e => setFormData({...formData, bgImage: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-green-500"
                  >
                    {availableGradients.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ไอคอน</label>
                  <select 
                    value={formData.icon} 
                    onChange={e => setFormData({...formData, icon: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-green-500"
                  >
                    {availableIcons.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ระยะเวลา</label>
                  <input 
                    type="text" 
                    value={formData.validUntil} 
                    onChange={e => setFormData({...formData, validUntil: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-green-500"
                    placeholder="เช่น หมดเขต 31 ธ.ค. 67"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ลำดับการแสดงผล</label>
                  <input 
                    type="number" 
                    value={formData.order} 
                    onChange={e => setFormData({...formData, order: Number(e.target.value)})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="published"
                  checked={formData.published}
                  onChange={e => setFormData({...formData, published: e.target.checked})}
                  className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <label htmlFor="published" className="text-sm font-medium text-slate-700">เปิดใช้งาน (แสดงบนหน้าเว็บ)</label>
              </div>

            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={savePromotion}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-green-600/20"
              >
                <Save className="w-4 h-4" /> บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
