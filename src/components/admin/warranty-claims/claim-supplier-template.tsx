import type { ClaimRow } from '@/lib/warranty-claims';
import type { IDocumentSettings } from '@/models/DocumentSettings';

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function ClaimSupplierTemplate({
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
            {documentSettings.taxId && <div>เลขที่ผู้เสียภาษี: {documentSettings.taxId}</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-blue-700 mb-1">หนังสือส่งเครม</div>
          <div className="text-sm font-bold text-slate-700">WARRANTY CLAIM SUBMISSION</div>
          <div className="mt-3 bg-slate-50 rounded-lg p-3 text-xs space-y-1 border border-slate-200">
            {[
              ['เลขที่เคส', claim.claimNumber],
              ['วันที่ส่งเครม', fmtDate(claim.supplierSentDate)],
              ['เลขที่อ้างอิงบริษัท', claim.supplierRef || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6">
                <span className="text-slate-500">{k}</span>
                <span className="font-bold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* To supplier */}
      <div className="mb-6">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">เรียน</div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <div className="text-lg font-bold text-blue-900">{claim.supplierName}</div>
          <div className="text-slate-600 mt-1 text-xs">บริษัทผู้รับผิดชอบการเครม</div>
        </div>
      </div>

      {/* Subject */}
      <div className="mb-6 text-sm leading-relaxed">
        <p>
          ทางร้าน <strong>{documentSettings.companyName || 'The Nut Yang Yont'}</strong> ขอส่งสินค้าเพื่อพิจารณาการรับประกัน
          ตามรายละเอียดด้านล่างนี้
        </p>
      </div>

      {/* Customer info */}
      <div className="mb-6">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ข้อมูลลูกค้า</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">ชื่อลูกค้า</div>
            <div className="font-bold">{claim.customerName || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">เบอร์โทร</div>
            <div className="font-bold">{claim.customerPhone || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">ทะเบียนรถ</div>
            <div className="font-bold">{claim.licensePlate || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">วันที่ลูกค้าเข้าเครม</div>
            <div className="font-bold">{fmtDate(claim.claimDate)}</div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mb-6">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">รายการสินค้าที่ส่งเครม</div>
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
      {(claim.customerNotes || claim.supplierNotes) && (
        <div className="mb-6">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">หมายเหตุ</div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 space-y-1">
            {claim.customerNotes && <div><span className="font-medium">จากลูกค้า:</span> {claim.customerNotes}</div>}
            {claim.supplierNotes && <div><span className="font-medium">เพิ่มเติม:</span> {claim.supplierNotes}</div>}
          </div>
        </div>
      )}

      {/* Request */}
      <div className="mb-10 text-sm leading-relaxed">
        <p>
          จึงเรียนมาเพื่อโปรดพิจารณาดำเนินการตามนโยบายการรับประกันสินค้าของบริษัท
          และหากมีข้อสงสัยประการใด กรุณาติดต่อกลับทางร้านโดยตรง
        </p>
      </div>

      {/* Signatures */}
      <div className="flex justify-between items-end mt-auto pt-8 border-t border-slate-200">
        <div className="text-center w-52">
          <div className="border-t border-slate-400 pt-2 mt-16 text-xs text-slate-600">
            <div className="font-bold">ผู้รับเอกสาร</div>
            <div className="font-bold mt-0.5">{claim.supplierName}</div>
            <div className="text-slate-400 mt-1">วันที่: _______________</div>
          </div>
        </div>
        <div className="text-center w-52">
          <div className="border-t border-slate-400 pt-2 mt-16 text-xs text-slate-600">
            <div className="font-bold">ผู้ส่งเครม</div>
            <div className="font-bold mt-0.5">{documentSettings.companyName || 'The Nut Yang Yont'}</div>
            {documentSettings.phone && <div className="text-slate-400 mt-0.5">โทร: {documentSettings.phone}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
