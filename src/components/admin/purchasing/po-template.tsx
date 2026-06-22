import type { PORow, POItem } from '@/lib/purchasing';
import type { IDocumentSettings } from '@/models/DocumentSettings';

function fmtDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function POTemplate({ order, documentSettings }: { order: PORow; documentSettings: IDocumentSettings }) {
  return (
    <div id="print-document" style={{ width: '210mm', minHeight: '297mm', background: 'white', padding: '16mm 14mm' }} className="text-slate-800">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-5 border-b-2 border-slate-800">
        <div>
          {documentSettings.logoUrl ? (
            <img src={documentSettings.logoUrl} alt={documentSettings.companyName} className="h-12 object-contain mb-1.5" />
          ) : (
            <div className="text-2xl font-black text-slate-900 mb-0.5">{documentSettings.companyName || 'THE NUT YANG'}</div>
          )}
          <div className="text-xs text-slate-800 leading-relaxed">
            {documentSettings.address && <>{documentSettings.address}<br /></>}
            {documentSettings.phone && <>โทร: {documentSettings.phone}</>}
            {documentSettings.phone && documentSettings.email && <>&nbsp;|&nbsp;</>}
            {documentSettings.email && <>อีเมล: {documentSettings.email}</>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-green-600 mb-1">ใบสั่งซื้อ</div>
          <div className="text-sm font-bold text-slate-700">PURCHASE ORDER</div>
          <div className="mt-3 bg-slate-50 rounded-lg p-3 text-xs space-y-1 border border-slate-200">
            {[
              ['เลขที่ PO', order.poNumber],
              ['วันที่สั่ง', fmtDate(order.orderDate)],
              ['กำหนดรับ', fmtDate(order.dueDate)],
              ['สถานะ', order.status],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6">
                <span className="text-slate-600">{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Supplier */}
      <div className="mb-6">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">ซัพพลายเออร์</div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs space-y-0.5">
          <div className="font-bold text-slate-900">{order.supplierSnapshot.name}</div>
          {order.supplierSnapshot.taxId && <div className="text-slate-800">เลขที่ผู้เสียภาษี: {order.supplierSnapshot.taxId}</div>}
          {order.supplierSnapshot.address && <div className="text-slate-800">{order.supplierSnapshot.address}</div>}
          {order.supplierSnapshot.contact && <div className="text-slate-800">ผู้ติดต่อ: {order.supplierSnapshot.contact}</div>}
          {order.supplierSnapshot.phone && <div className="text-slate-800">โทร: {order.supplierSnapshot.phone}</div>}
        </div>
      </div>
      {/* Items */}
      <div className="mb-6">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">รายการสินค้า</div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white text-xs">
              <th className="text-center py-2 px-3 w-8">#</th>
              <th className="text-left py-2 px-3">รายการ</th>
              <th className="text-center py-2 px-3 w-16">จำนวน</th>
              <th className="text-center py-2 px-3 w-16">หน่วย</th>
              <th className="text-right py-2 px-3 w-28">ราคา/หน่วย</th>
              <th className="text-right py-2 px-3 w-20">ส่วนลด</th>
              <th className="text-right py-2 px-3 w-28">รวม</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: POItem, idx: number) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                <td className="text-center py-2 px-3 text-xs text-slate-600 border-b border-slate-100">{idx + 1}</td>
                <td className="py-2 px-3 border-b border-slate-100 font-medium">{item.productName}</td>
                <td className="text-center py-2 px-3 border-b border-slate-100">{item.qty}</td>
                <td className="text-center py-2 px-3 border-b border-slate-100 text-xs text-slate-800">{item.unit}</td>
                <td className="text-right py-2 px-3 border-b border-slate-100 tabular-nums">฿{item.unitPrice.toLocaleString()}</td>
                <td className="text-right py-2 px-3 border-b border-slate-100 text-xs">{item.discount > 0 ? `${item.discount}%` : '—'}</td>
                <td className="text-right py-2 px-3 border-b border-slate-100 font-semibold tabular-nums">฿{item.lineTotal.toLocaleString()}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 5 - order.items.length) }).map((_, i) => (
              <tr key={`e-${i}`} className={(order.items.length + i) % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                {[...Array(7)].map((__, c) => <td key={c} className="py-2 px-3 border-b border-slate-100">&nbsp;</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Totals */}
      <div className="flex justify-between gap-8 mb-8">
        <div className="flex-1">
          {order.notes && (
            <div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">หมายเหตุ</div>
              <div className="text-sm text-slate-900 bg-slate-50 rounded-lg p-3 border border-slate-200">{order.notes}</div>
            </div>
          )}
        </div>
        <div className="w-56 shrink-0">
          <table className="w-full text-sm">
            <tbody>
              <tr><td className="py-1 text-slate-800 text-xs">ราคารวมสินค้า</td><td className="py-1 text-right tabular-nums font-medium">฿{order.subtotal.toLocaleString()}</td></tr>
              <tr><td className="py-1 text-slate-800 text-xs">ส่วนลดรวม</td><td className="py-1 text-right tabular-nums text-emerald-600">-฿{order.totalDiscount.toLocaleString()}</td></tr>
              <tr className="border-t border-slate-200">
                <td className="py-1 pt-2 text-slate-800 text-xs">ภาษีมูลค่าเพิ่ม 7%</td>
                <td className="py-1 pt-2 text-right tabular-nums">฿{order.vat.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr className="border-t-2 border-slate-800">
                <td className="py-2 font-bold text-slate-900">รวมสุทธิ</td>
                <td className="py-2 text-right font-black text-green-600 text-base tabular-nums">฿{order.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* Signatures */}
      <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-200">
        {[
          { role: 'ผู้สั่งซื้อ', sig: documentSettings.issuerSignatureUrl, name: documentSettings.issuerName },
          { role: 'ผู้อนุมัติ', sig: documentSettings.approverSignatureUrl, name: documentSettings.approverName },
          { role: 'ผู้รับสินค้า', sig: '', name: '' },
        ].map(({ role, sig, name }) => (
          <div key={role} className="text-center">
            <div className="border-b border-dashed border-slate-400 mb-2 h-10 flex items-end justify-center">
              {sig && <img src={sig} alt={role} className="h-9 object-contain" />}
            </div>
            <div className="text-xs font-semibold text-slate-700">{role}</div>
            {name && <div className="text-xs text-slate-800">{name}</div>}
            <div className="text-xs text-slate-600 mt-0.5">วันที่ ...... / ...... / ......</div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
        เอกสารนี้ออกโดยระบบ {documentSettings.companyName || 'The Nut Yang'} · {order.poNumber} · พิมพ์เมื่อ {new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}
      </div>
    </div>
  );
}
