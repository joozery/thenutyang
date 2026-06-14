"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Plus, ShoppingBag, Clock, CheckCircle, XCircle,
  MoreHorizontal, ChevronLeft, ChevronRight, X,
  Eye, Ban, Truck, Printer,
} from 'lucide-react';

// --- Types (ready for backend) ---
type OrderStatus = "รอรับสินค้า" | "รับสินค้าแล้ว" | "ยกเลิก";

interface OrderItem {
  id: string;
  product: string;
  qty: number;
  unitPrice: number;
}

interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  dueDate: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  notes?: string;
}

// --- Mock data — TODO: replace with GET /api/purchase-orders ---
const MOCK_ORDERS: PurchaseOrder[] = [
  {
    id: "PO-2024-089",
    supplier: "บริษัท มิชลิน (ประเทศไทย)",
    date: "8 มิ.ย. 2567",
    dueDate: "12 มิ.ย. 2567",
    status: "รอรับสินค้า",
    total: 52000,
    notes: "สั่งพิเศษสำหรับลูกค้า VIP",
    items: [
      { id: "1", product: "Michelin Pilot Sport 4 225/45R17", qty: 4, unitPrice: 5200 },
      { id: "2", product: "Michelin Energy XM2+ 195/65R15", qty: 8, unitPrice: 3200 },
      { id: "3", product: "Michelin Primacy 4 205/55R16", qty: 6, unitPrice: 4100 },
    ],
  },
  {
    id: "PO-2024-088",
    supplier: "บริดจสโตน เซลส์ จำกัด",
    date: "5 มิ.ย. 2567",
    dueDate: "9 มิ.ย. 2567",
    status: "รับสินค้าแล้ว",
    total: 78400,
    items: [
      { id: "1", product: "Bridgestone Turanza T005 225/55R17", qty: 8, unitPrice: 5600 },
      { id: "2", product: "Bridgestone Ecopia EP300 185/65R15", qty: 12, unitPrice: 3200 },
    ],
  },
  {
    id: "PO-2024-087",
    supplier: "ยางโยโกฮาม่า ไทย",
    date: "2 มิ.ย. 2567",
    dueDate: "6 มิ.ย. 2567",
    status: "รับสินค้าแล้ว",
    total: 21600,
    items: [
      { id: "1", product: "Yokohama ADVAN Sport V105 245/40R18", qty: 4, unitPrice: 5400 },
    ],
  },
  {
    id: "PO-2024-086",
    supplier: "ดันลอป ไทร์ ประเทศไทย",
    date: "28 พ.ค. 2567",
    dueDate: "2 มิ.ย. 2567",
    status: "ยกเลิก",
    total: 44800,
    items: [
      { id: "1", product: "Dunlop Sport Maxx RT2 225/45R18", qty: 8, unitPrice: 5600 },
    ],
  },
  {
    id: "PO-2024-085",
    supplier: "บริษัท กู๊ดเยียร์ ไทยแลนด์",
    date: "25 พ.ค. 2567",
    dueDate: "29 พ.ค. 2567",
    status: "รับสินค้าแล้ว",
    total: 63500,
    items: [
      { id: "1", product: "Goodyear Eagle F1 Asymmetric 5 225/45R17", qty: 10, unitPrice: 6350 },
    ],
  },
  {
    id: "PO-2024-084",
    supplier: "ปิเรลลี่ ไทยแลนด์ จำกัด",
    date: "20 พ.ค. 2567",
    dueDate: "25 พ.ค. 2567",
    status: "รับสินค้าแล้ว",
    total: 38400,
    items: [
      { id: "1", product: "Pirelli P Zero 245/35R20", qty: 4, unitPrice: 9600 },
    ],
  },
  {
    id: "PO-2024-083",
    supplier: "คอนติเนนทัล ไทร์ส",
    date: "15 พ.ค. 2567",
    dueDate: "20 พ.ค. 2567",
    status: "รอรับสินค้า",
    total: 29800,
    items: [
      { id: "1", product: "Continental PremiumContact 6 225/50R17", qty: 6, unitPrice: 4966 },
    ],
  },
];

const statusStyle: Record<OrderStatus, { color: string; icon: React.ReactNode }> = {
  "รอรับสินค้า": { color: "bg-amber-100 text-amber-700", icon: <Clock size={12} /> },
  "รับสินค้าแล้ว": { color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle size={12} /> },
  "ยกเลิก": { color: "bg-red-100 text-red-600", icon: <XCircle size={12} /> },
};

const ITEMS_PER_PAGE = 5;

// --- Print Preview Modal ---
function PrintPreviewModal({ order, onClose }: { order: PurchaseOrder; onClose: () => void }) {
  const subtotal = order.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const vat = subtotal * 0.07;
  const grand = subtotal + vat;

  const handlePrint = () => window.print();

  return (
    <>
      {/* Print styles — hide everything except the document when printing */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #print-document { display: block !important; position: fixed; inset: 0; z-index: 9999; background: white; }
          #print-document * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @media screen {
          #print-document { display: block; }
        }
      `}</style>

      {/* Screen overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 flex flex-col items-center w-full max-h-[95vh]">
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-3 bg-white/10 backdrop-blur px-4 py-2 rounded-xl border border-white/20">
            <span className="text-white text-sm font-semibold">ตัวอย่างก่อนพิมพ์</span>
            <div className="w-px h-4 bg-white/30" />
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-1.5 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 transition-colors"
            >
              <Printer size={15} /> พิมพ์เอกสาร
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Document preview (A4-like) */}
          <div className="overflow-y-auto max-h-[85vh] rounded-xl shadow-2xl">
            <div
              id="print-document"
              style={{ width: '210mm', minHeight: '297mm', background: 'white', padding: '16mm 14mm' }}
              className="text-slate-800"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6 pb-5 border-b-2 border-slate-800">
                <div>
                  <div className="text-2xl font-black text-slate-900 mb-0.5">THE NUT YANG</div>
                  <div className="text-xs text-slate-500 leading-relaxed">
                    ร้านยางรถยนต์ เดอะ นัทยาง<br />
                    123 ถ.ตัวอย่าง แขวงตัวอย่าง เขตตัวอย่าง กรุงเทพฯ 10000<br />
                    โทร: 02-XXX-XXXX &nbsp;|&nbsp; อีเมล: info@thenutyang.com<br />
                    เลขที่ผู้เสียภาษี: 0105534XXXXXX
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-rose-600 mb-1">ใบสั่งซื้อ</div>
                  <div className="text-sm font-bold text-slate-700">PURCHASE ORDER</div>
                  <div className="mt-3 bg-slate-50 rounded-lg p-3 text-xs space-y-1 border border-slate-200">
                    <div className="flex justify-between gap-6">
                      <span className="text-slate-400">เลขที่ PO</span>
                      <span className="font-bold text-rose-600">{order.id}</span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-slate-400">วันที่สั่ง</span>
                      <span className="font-semibold">{order.date}</span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-slate-400">กำหนดรับ</span>
                      <span className="font-semibold">{order.dueDate}</span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-slate-400">สถานะ</span>
                      <span className="font-semibold">{order.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplier */}
              <div className="mb-6">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ซัพพลายเออร์ / SUPPLIER</div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="font-bold text-slate-900 mb-0.5">{order.supplier}</div>
                  <div className="text-xs text-slate-500">ที่อยู่, เบอร์โทร, อีเมล (ดึงจาก backend)</div>
                </div>
              </div>

              {/* Items table */}
              <div className="mb-6">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">รายการสินค้า / ITEMS</div>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs">
                      <th className="text-center py-2 px-3 w-8">#</th>
                      <th className="text-left py-2 px-3">รายการ</th>
                      <th className="text-center py-2 px-3 w-16">จำนวน</th>
                      <th className="text-center py-2 px-3 w-16">หน่วย</th>
                      <th className="text-right py-2 px-3 w-28">ราคา/หน่วย</th>
                      <th className="text-right py-2 px-3 w-28">รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="text-center py-2 px-3 text-xs text-slate-400 border-b border-slate-100">{idx + 1}</td>
                        <td className="py-2 px-3 border-b border-slate-100 font-medium">{item.product}</td>
                        <td className="text-center py-2 px-3 border-b border-slate-100">{item.qty}</td>
                        <td className="text-center py-2 px-3 border-b border-slate-100 text-xs text-slate-500">เส้น</td>
                        <td className="text-right py-2 px-3 border-b border-slate-100 tabular-nums">฿{item.unitPrice.toLocaleString()}</td>
                        <td className="text-right py-2 px-3 border-b border-slate-100 font-semibold tabular-nums">฿{(item.qty * item.unitPrice).toLocaleString()}</td>
                      </tr>
                    ))}
                    {/* fill empty rows for short orders */}
                    {Array.from({ length: Math.max(0, 5 - order.items.length) }).map((_, i) => (
                      <tr key={`empty-${i}`} className={((order.items.length + i) % 2 === 0) ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="py-2 px-3 border-b border-slate-100 text-xs text-slate-300">{order.items.length + i + 1}</td>
                        <td className="py-2 px-3 border-b border-slate-100">&nbsp;</td>
                        <td className="py-2 px-3 border-b border-slate-100"></td>
                        <td className="py-2 px-3 border-b border-slate-100"></td>
                        <td className="py-2 px-3 border-b border-slate-100"></td>
                        <td className="py-2 px-3 border-b border-slate-100"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals + notes side by side */}
              <div className="flex justify-between gap-8 mb-8">
                <div className="flex-1">
                  {order.notes && (
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">หมายเหตุ</div>
                      <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">{order.notes}</div>
                    </div>
                  )}
                  <div className="mt-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">เงื่อนไขการชำระเงิน</div>
                    <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-200">เครดิต 30 วัน นับจากวันที่รับสินค้า</div>
                  </div>
                </div>
                <div className="w-56 shrink-0">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr>
                        <td className="py-1 text-slate-500 text-xs">ราคารวมสินค้า</td>
                        <td className="py-1 text-right tabular-nums font-medium">฿{subtotal.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-slate-500 text-xs">ส่วนลด</td>
                        <td className="py-1 text-right tabular-nums">-฿0</td>
                      </tr>
                      <tr className="border-t border-slate-200">
                        <td className="py-1 text-slate-500 text-xs pt-2">ราคาก่อนภาษี</td>
                        <td className="py-1 pt-2 text-right tabular-nums font-medium">฿{subtotal.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-slate-500 text-xs">ภาษีมูลค่าเพิ่ม 7%</td>
                        <td className="py-1 text-right tabular-nums">฿{vat.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="border-t-2 border-slate-800">
                        <td className="py-2 font-bold text-slate-900">รวมสุทธิ</td>
                        <td className="py-2 text-right font-black text-rose-600 text-base tabular-nums">฿{grand.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-200">
                {['ผู้สั่งซื้อ', 'ผู้อนุมัติ', 'ผู้รับสินค้า'].map(role => (
                  <div key={role} className="text-center">
                    <div className="border-b border-dashed border-slate-400 mb-2 h-10"></div>
                    <div className="text-xs font-semibold text-slate-700">{role}</div>
                    <div className="text-xs text-slate-400 mt-0.5">วันที่ ...... / ...... / ......</div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-3 border-t border-slate-100 text-center text-xs text-slate-400">
                เอกสารนี้ออกโดยระบบ The Nut Yang &nbsp;·&nbsp; {order.id} &nbsp;·&nbsp; พิมพ์เมื่อ {new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// --- PO Detail Modal ---
function PODetailModal({
  order,
  onClose,
  onReceive,
  onCancel,
}: {
  order: PurchaseOrder;
  onClose: () => void;
  onReceive: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const [showPrint, setShowPrint] = useState(false);

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900">{order.id}</h2>
            <p className="text-sm text-slate-400">{order.supplier}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle[order.status].color}`}>
              {statusStyle[order.status].icon}{order.status}
            </span>
            <button
              onClick={() => setShowPrint(true)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              title="พิมพ์ใบสั่งซื้อ"
            >
              <Printer size={17} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-0.5">วันที่สั่งซื้อ</p>
              <p className="font-semibold text-slate-800">{order.date}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-0.5">กำหนดรับสินค้า</p>
              <p className="font-semibold text-slate-800">{order.dueDate}</p>
            </div>
          </div>

          {order.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs text-amber-600 font-semibold mb-0.5">หมายเหตุ</p>
              <p className="text-sm text-slate-700">{order.notes}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">
              รายการสินค้า ({order.items.length} รายการ)
            </p>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-400 font-semibold">
                    <th className="text-left px-4 py-2.5">สินค้า</th>
                    <th className="text-center px-3 py-2.5">จำนวน</th>
                    <th className="text-right px-4 py-2.5">ราคา/หน่วย</th>
                    <th className="text-right px-4 py-2.5">รวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {order.items.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-slate-800">{item.product}</td>
                      <td className="px-3 py-3 text-center text-slate-600">{item.qty}</td>
                      <td className="px-4 py-3 text-right text-slate-600">฿{item.unitPrice.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        ฿{(item.qty * item.unitPrice).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-100">
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-slate-600">
                      มูลค่ารวม
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">
                      ฿{order.total.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {order.status === "รอรับสินค้า" && (
          <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
            <button
              onClick={() => { onCancel(order.id); onClose(); }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <Ban size={14} /> ยกเลิก PO
            </button>
            <button
              onClick={() => { onReceive(order.id); onClose(); }}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 flex items-center gap-2 transition-colors"
            >
              <Truck size={14} /> ยืนยันรับสินค้า
            </button>
          </div>
        )}
      </div>
    </div>
    {showPrint && <PrintPreviewModal order={order} onClose={() => setShowPrint(false)} />}
    </>
  );
}

// --- Confirm Cancel Modal ---
function ConfirmCancelModal({
  orderId,
  onConfirm,
  onClose,
}: {
  orderId: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
          <XCircle size={24} className="text-red-600" />
        </div>
        <h3 className="text-center text-lg font-black text-slate-900 mb-1">ยืนยันการยกเลิก</h3>
        <p className="text-center text-sm text-slate-500 mb-6">
          ต้องการยกเลิกใบสั่งซื้อ <span className="font-bold text-slate-700">{orderId}</span> ใช่หรือไม่?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50"
          >
            ไม่ใช่
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
          >
            ยืนยันยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Row Action Dropdown ---
function ActionMenu({
  order,
  onView,
  onReceive,
  onCancelRequest,
}: {
  order: PurchaseOrder;
  onView: () => void;
  onReceive: () => void;
  onCancelRequest: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
            <button
              onClick={() => { setOpen(false); onView(); }}
              className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 font-medium"
            >
              <Eye size={14} className="text-slate-400" /> ดูรายละเอียด
            </button>
            {order.status === "รอรับสินค้า" && (
              <>
                <button
                  onClick={() => { setOpen(false); onReceive(); }}
                  className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 font-medium"
                >
                  <CheckCircle size={14} /> รับสินค้า
                </button>
                <button
                  onClick={() => { setOpen(false); onCancelRequest(); }}
                  className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium"
                >
                  <XCircle size={14} /> ยกเลิก PO
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// --- Main Page ---
export default function PurchasingPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>(MOCK_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const q = search.toLowerCase();
      const matchSearch = o.id.toLowerCase().includes(q) || o.supplier.toLowerCase().includes(q);
      const matchStatus = statusFilter === "ทั้งหมด" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = useMemo(() => ({
    pending: orders.filter(o => o.status === "รอรับสินค้า").length,
    received: orders.filter(o => o.status === "รับสินค้าแล้ว").length,
    totalValue: orders.filter(o => o.status !== "ยกเลิก").reduce((sum, o) => sum + o.total, 0),
    suppliers: new Set(orders.map(o => o.supplier)).size,
  }), [orders]);

  // TODO: replace with PATCH /api/purchase-orders/:id  { status: 'รับสินค้าแล้ว' }
  const handleReceive = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "รับสินค้าแล้ว" } : o));
    if (selectedOrder?.id === id) setSelectedOrder(prev => prev ? { ...prev, status: "รับสินค้าแล้ว" } : null);
  };

  // TODO: replace with PATCH /api/purchase-orders/:id  { status: 'ยกเลิก' }
  const handleCancel = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "ยกเลิก" } : o));
    setCancelTarget(null);
  };

  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const handleFilterChange = (v: string) => { setStatusFilter(v); setPage(1); };

  const startItem = filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(page * ITEMS_PER_PAGE, filtered.length);

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">จัดซื้อ</h1>
            <p className="text-sm text-slate-500 mt-1">ใบสั่งซื้อทั้งหมด {orders.length} รายการ</p>
          </div>
          <Link
            href="/admin/purchasing/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-colors w-fit"
          >
            <Plus size={16} /> สร้างใบสั่งซื้อ
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "รอรับสินค้า", value: String(stats.pending) },
            { label: "รับแล้วทั้งหมด", value: String(stats.received) },
            { label: "มูลค่ารวม (ไม่รวมยกเลิก)", value: `฿${(stats.totalValue / 1000).toFixed(0)}K` },
            { label: "ซัพพลายเออร์", value: String(stats.suppliers) },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-100 rounded-xl p-4">
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="ค้นหาเลขที่ PO, ซัพพลายเออร์..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => handleFilterChange(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-rose-400"
            >
              <option value="ทั้งหมด">สถานะ: ทั้งหมด</option>
              <option value="รอรับสินค้า">รอรับสินค้า</option>
              <option value="รับสินค้าแล้ว">รับสินค้าแล้ว</option>
              <option value="ยกเลิก">ยกเลิก</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left px-4 py-3">เลขที่ PO</th>
                  <th className="text-left px-4 py-3">ซัพพลายเออร์</th>
                  <th className="text-center px-4 py-3">รายการ</th>
                  <th className="text-right px-4 py-3">มูลค่า</th>
                  <th className="text-left px-4 py-3">วันที่สั่ง</th>
                  <th className="text-left px-4 py-3">กำหนดรับ</th>
                  <th className="text-center px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-14 text-slate-400 text-sm">
                      ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                ) : paged.map(o => (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3.5 font-bold text-rose-600">{o.id}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                          <ShoppingBag size={14} className="text-slate-500" />
                        </div>
                        <span className="font-medium text-slate-800">{o.supplier}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-600">{o.items.length} รายการ</td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-800">฿{o.total.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-slate-500">{o.date}</td>
                    <td className="px-4 py-3.5 text-slate-500">{o.dueDate}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle[o.status].color}`}>
                        {statusStyle[o.status].icon}{o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <ActionMenu
                        order={o}
                        onView={() => setSelectedOrder(o)}
                        onReceive={() => handleReceive(o.id)}
                        onCancelRequest={() => setCancelTarget(o.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              แสดง {startItem}–{endItem} จาก {filtered.length} รายการ
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium ${n === page ? 'bg-rose-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedOrder && (
        <PODetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onReceive={handleReceive}
          onCancel={id => setCancelTarget(id)}
        />
      )}
      {cancelTarget && (
        <ConfirmCancelModal
          orderId={cancelTarget}
          onConfirm={() => handleCancel(cancelTarget)}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </>
  );
}
