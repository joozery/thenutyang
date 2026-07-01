import type { ClaimRow } from '@/lib/warranty-claims';
import type { IDocumentSettings } from '@/models/DocumentSettings';

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function ClaimCustomerTemplate({
  claim,
  documentSettings,
}: {
  claim: ClaimRow;
  documentSettings: IDocumentSettings;
}) {
  return (
    <div
      id="print-document"
      style={{ width: '210mm', minHeight: '297mm', background: 'white', padding: '16mm 14mm' }}
      className="text-slate-800"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-800">
        <div>
          {documentSettings.logoUrl ? (
            <img src={documentSettings.logoUrl} alt={documentSettings.companyName} className="h-12 object-contain mb-1.5" />
          ) : (
            <div className="text-2xl font-black text-slate-900 mb-0.5">
              {documentSettings.companyName || 'THE NUT YANG'}
            </div>
          )}
          <div className="text-xs text-slate-600 leading-relaxed mt-1">
            {documentSettings.address && <div>{documentSettings.address}</div>}
            {documentSettings.phone && <div>โทร: {documentSettings.phone}</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-orange-600 mb-1">ใบรับเรื่องเครม</div>
          <div className="text-sm font-bold text-slate-700">WARRANTY CLAIM RECEIPT</div>
          <div className="mt-3 bg-slate-50 rounded-lg p-3 text-xs space-y-1 border border-slate-200">
            {[
              ['เลขที่เคส', claim.claimNumber],
              ['วันที่รับเรื่อง', fmtDate(claim.claimDate)],
              ['วันที่ออกเอกสาร', fmtDate(new Date().toISOString())],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6">
                <span className="text-slate-500">{k}</span>
                <span className="font-bold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer info */}
      <div className="mb-6">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ข้อมูลลูกค้า</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">ชื่อลูกค้า</div>
            <div className="font-bold text-slate-900">{claim.customerName || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">เบอร์โทรศัพท์</div>
            <div className="font-bold text-slate-900">{claim.customerPhone || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">ทะเบียนรถ</div>
            <div className="font-bold text-slate-900">{claim.licensePlate || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">วันที่เข้าเครม</div>
            <div className="font-bold text-slate-900">{fmtDate(claim.claimDate)}</div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mb-6">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">รายการสินค้าที่เครม</div>
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left px-4 py-2.5 font-bold text-xs text-slate-600">ลำดับ</th>
              <th className="text-left px-4 py-2.5 font-bold text-xs text-slate-600">รายการสินค้า</th>
              <th className="text-left px-4 py-2.5 font-bold text-xs text-slate-600">ขนาด</th>
              <th className="text-center px-4 py-2.5 font-bold text-xs text-slate-600">จำนวน</th>
              <th className="text-left px-4 py-2.5 font-bold text-xs text-slate-600">อาการ/เหตุผล</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {claim.items.map((it, i) => (
              <tr key={i} className={i % 2 === 1 ? 'bg-slate-50/50' : ''}>
                <td className="px-4 py-3 text-slate-500 text-xs">{i + 1}</td>
                <td className="px-4 py-3 font-medium">
                  {it.brand ? `${it.brand} ${it.productName}` : it.productName}
                </td>
                <td className="px-4 py-3 text-slate-600">{it.size || '—'}</td>
                <td className="px-4 py-3 text-center font-bold">{it.quantity}</td>
                <td className="px-4 py-3 text-orange-700">{it.reason || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {claim.customerNotes && (
        <div className="mb-6">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">หมายเหตุ</div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
            {claim.customerNotes}
          </div>
        </div>
      )}

      {/* Notice */}
      <div className="mb-10 bg-orange-50 border border-orange-200 rounded-lg p-4 text-xs text-orange-800">
        <div className="font-bold mb-1">หมายเหตุสำหรับลูกค้า</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>กรุณาเก็บเอกสารนี้ไว้เป็นหลักฐานการรับเรื่องเครม</li>
          <li>ทางร้านจะดำเนินการส่งสินค้าให้บริษัทผู้ผลิตพิจารณา และจะแจ้งผลให้ทราบโดยเร็ว</li>
          <li>ระยะเวลาพิจารณาขึ้นอยู่กับนโยบายของบริษัทผู้ผลิต</li>
        </ul>
      </div>

      {/* Signatures */}
      <div className="flex justify-between items-end mt-auto pt-8 border-t border-slate-200">
        <div className="text-center w-52">
          <div className="border-t border-slate-400 pt-2 mt-16 text-xs text-slate-600">
            <div className="font-bold">ลายเซ็นลูกค้า</div>
            <div className="text-slate-400 mt-1">วันที่: _______________</div>
          </div>
        </div>
        <div className="text-center w-52">
          <div className="border-t border-slate-400 pt-2 mt-16 text-xs text-slate-600">
            <div className="font-bold">ผู้รับเรื่อง</div>
            <div className="font-bold mt-0.5">{documentSettings.companyName || 'The Nut Yang Yont'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
