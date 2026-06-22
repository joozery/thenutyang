'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, GripVertical } from 'lucide-react';

export default function ServicesClient() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: [''],
    icon: 'ShieldCheck',
    color: 'blue',
    isBestSeller: false,
    order: 0
  });

  const availableIcons = ['ShieldCheck', 'RefreshCw', 'Wrench', 'Settings', 'Wind', 'CheckCircle2'];
  const availableColors = ['blue', 'orange', 'purple', 'red', 'green'];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/admin/services');
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDescChange = (index: number, value: string) => {
    const newDesc = [...formData.description];
    newDesc[index] = value;
    setFormData({ ...formData, description: newDesc });
  };

  const addDescField = () => {
    setFormData({ ...formData, description: [...formData.description, ''] });
  };

  const removeDescField = (index: number) => {
    const newDesc = formData.description.filter((_, i) => i !== index);
    setFormData({ ...formData, description: newDesc });
  };

  const openModal = (service?: any) => {
    if (service) {
      setEditingId(service._id);
      setFormData({
        title: service.title || '',
        subtitle: service.subtitle || '',
        description: service.description?.length ? service.description : [''],
        icon: service.icon || 'ShieldCheck',
        color: service.color || 'blue',
        isBestSeller: service.isBestSeller || false,
        order: service.order || 0
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        subtitle: '',
        description: [''],
        icon: 'ShieldCheck',
        color: 'blue',
        isBestSeller: false,
        order: services.length + 1
      });
    }
    setIsModalOpen(true);
  };

  const saveService = async () => {
    try {
      const url = editingId ? `/api/admin/services/${editingId}` : '/api/admin/services';
      const method = editingId ? 'PUT' : 'POST';
      
      // Filter out empty descriptions
      const dataToSave = {
        ...formData,
        description: formData.description.filter(d => d.trim() !== '')
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchServices();
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm('ยืนยันการลบข้อมูลนี้?')) return;
    
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-4">กำลังโหลด...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-700">รายการบริการ</h2>
        <button 
          onClick={() => openModal()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> เพิ่มบริการ
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-sm">
              <th className="p-4">ลำดับ</th>
              <th className="p-4">สี</th>
              <th className="p-4">หัวข้อ</th>
              <th className="p-4">รายละเอียดเบื้องต้น</th>
              <th className="p-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((s, idx) => (
              <tr key={s._id} className="hover:bg-slate-50">
                <td className="p-4 text-slate-500">{s.order || idx + 1}</td>
                <td className="p-4">
                  <div className={`w-6 h-6 rounded-full bg-${s.color}-500 border border-slate-200`}></div>
                </td>
                <td className="p-4 font-medium text-slate-800">
                  {s.title}
                  {s.isBestSeller && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Best Seller</span>}
                </td>
                <td className="p-4 text-slate-500 text-sm truncate max-w-xs">{s.subtitle}</td>
                <td className="p-4 text-right">
                  <button onClick={() => openModal(s)} className="text-blue-500 hover:text-blue-700 p-2"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteService(s._id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">ไม่มีข้อมูลบริการ</td>
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
              <h2 className="text-xl font-bold">{editingId ? 'แก้ไขบริการ' : 'เพิ่มบริการใหม่'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">หัวข้อบริการ *</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-green-500"
                    placeholder="เช่น รับประกันยาง"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">คำบรรยายย่อย *</label>
                  <input 
                    type="text" 
                    value={formData.subtitle} 
                    onChange={e => setFormData({...formData, subtitle: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-green-500"
                    placeholder="เช่น 2 ปีเต็ม"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">สีธีม *</label>
                  <select 
                    value={formData.color} 
                    onChange={e => setFormData({...formData, color: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-green-500"
                  >
                    {availableColors.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ไอคอน *</label>
                  <select 
                    value={formData.icon} 
                    onChange={e => setFormData({...formData, icon: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-green-500"
                  >
                    {availableIcons.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
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

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="bestseller"
                  checked={formData.isBestSeller}
                  onChange={e => setFormData({...formData, isBestSeller: e.target.checked})}
                  className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <label htmlFor="bestseller" className="text-sm font-medium text-slate-700">แสดงป้าย Best Seller</label>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-slate-700">รายละเอียดแต่ละบรรทัด</label>
                  <button onClick={addDescField} className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                    <Plus className="w-3 h-3" /> เพิ่มบรรทัด
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.description.map((desc, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="text" 
                        value={desc} 
                        onChange={e => handleDescChange(idx, e.target.value)}
                        className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-green-500 text-sm"
                        placeholder={`รายละเอียดบรรทัดที่ ${idx + 1}`}
                      />
                      <button onClick={() => removeDescField(idx)} className="p-2 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
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
                onClick={saveService}
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
