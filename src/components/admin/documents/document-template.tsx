import { Phone, Mail, Globe, User, CreditCard, StickyNote, BadgeCheck } from 'lucide-react';
import { numberToThaiBahtText } from '@/lib/thai-baht-text';
import { parseCarInfo } from '@/lib/car-info';
import type { IDocumentSettings } from '@/models/DocumentSettings';

function IconText({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1">
      <span className="text-slate-600 shrink-0">{icon}</span>
      {children}
    </p>
  );
}

export type DocumentTemplateItem = {
  description: string;
  qty: number;
  unit?: string;
  unitPrice: number;
  discountPercent?: number;
  lineTotal: number;
};

export type DocumentTemplateProps = {
  docTypeLabel: string;
  docTypeLabelEn?: string;
  copyLabel?: string;
  docNumber: string;
  issueDate: string;
  reference?: string;
  seller: IDocumentSettings;
  customer: {
    code?: string;
    name: string;
    address?: string;
    taxId?: string;
    phone?: string;
    email?: string;
    lineId?: string;
    note?: string;
  };
  items: DocumentTemplateItem[];
  vatRate: number;
  vatBase: number;
  vatAmount: number;
  grandTotal: number;
  withholding?: number;
  paidAmount?: number;
  payment?: { date?: string; method?: string };
  notes?: string[];
  footerNote?: string;
  technicianName?: string;
};

const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 text-[11px]">
      <span className="text-slate-800">{label}</span>
      <span className="font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}

export function DocumentTemplate({
  docTypeLabel,
  docTypeLabelEn,
  copyLabel = '(ต้นฉบับ)',
  docNumber,
  issueDate,
  reference,
  seller,
  customer,
  items,
  vatRate,
  vatBase,
  vatAmount,
  grandTotal,
  withholding = 0,
  paidAmount,
  payment,
  notes = [],
  footerNote,
  technicianName,
}: DocumentTemplateProps) {
  const paid = paidAmount ?? grandTotal;
  const minRows = 4;

  return (
    <div id="print-document" style={{ width: '210mm', minHeight: '297mm', background: 'white', padding: '14mm 12mm' }} className="text-slate-800 text-[12px]">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="h-14 flex items-center">
          {seller.logoUrl ? (
            <img src={seller.logoUrl} alt={seller.companyName} className="h-full w-auto object-contain" />
          ) : (
            <span className="text-xl font-black text-slate-900">{seller.companyName || 'บริษัทของคุณ'}</span>
          )}
        </div>
        <div className="text-right">
          <div className="text-xl font-black text-green-700">{docTypeLabel}</div>
          {docTypeLabelEn && <div className="text-[10px] font-bold text-slate-800">{docTypeLabelEn}</div>}
          <div className="text-[10px] text-slate-800 mt-0.5">{copyLabel}</div>
        </div>
      </div>

      {/* Seller + meta */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 space-y-1">
          <p className="text-[11px] text-slate-600">ผู้ขาย</p>
          <p className="text-[12px] font-bold text-slate-900">{seller.companyName || '—'}</p>
          {seller.address && <p className="text-[10px] text-slate-800 leading-relaxed">ที่อยู่: {seller.address}</p>}
          <div className="text-[10px] text-slate-800 space-y-0.5">
            {seller.phone && <IconText icon={<Phone size={10} />}>{seller.phone}</IconText>}
            {seller.email && <IconText icon={<Mail size={10} />}>{seller.email}</IconText>}
            {seller.website && <IconText icon={<Globe size={10} />}>{seller.website}</IconText>}
          </div>
          {seller.taxId && <p className="text-[10px] text-slate-800">เลขที่ผู้เสียภาษี: {seller.taxId} (สำนักงานใหญ่)</p>}
        </div>

        <div className="space-y-2">
          <div className="bg-green-50 border border-green-100 rounded-lg p-3 space-y-1">
            <Row label="เลขที่เอกสาร" value={docNumber} />
            <Row label="วันที่ออก" value={issueDate} />
            <Row label="อ้างอิง" value={reference || '-'} />
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
            <p className="text-[11px] text-slate-600 mb-1">ติดต่อกลับที่</p>
            <div className="text-[10px] text-slate-900 space-y-0.5">
              {seller.companyName && <IconText icon={<User size={10} />}>{seller.companyName}</IconText>}
              {seller.phone && <IconText icon={<Phone size={10} />}>{seller.phone}</IconText>}
              {seller.email && <IconText icon={<Mail size={10} />}>{seller.email}</IconText>}
            </div>
          </div>
        </div>
      </div>

      {/* Customer */}
      <div className="grid grid-cols-3 gap-4 mb-4 pb-3 border-b border-slate-100 items-start">
        {/* Left Column */}
        <div className="space-y-1.5 text-[11px] text-slate-800">
          <p><span className="text-slate-500 w-20 inline-block">ลูกค้า:</span> <span className="font-bold text-slate-900">{customer.name}</span> {customer.code && <span className="text-slate-500 font-normal">({customer.code})</span>}</p>
          {customer.address && <p><span className="text-slate-500 w-20 inline-block align-top">ที่อยู่:</span> <span className="inline-block w-[calc(100%-5rem)]">{customer.address}</span></p>}
          {customer.taxId && <p><span className="text-slate-500 w-20 inline-block">เลขผู้เสียภาษี:</span> <span>{customer.taxId}</span></p>}
        </div>

        {/* Middle Column */}
        <div className="space-y-1.5 text-[11px] text-slate-800 pl-4 border-l border-slate-100">
          <p><span className="text-slate-500 w-[70px] inline-block">เบอร์โทรศัพท์</span> <span>{customer.phone || '-'}</span></p>
          <p><span className="text-slate-500 w-[70px] inline-block">email</span> <span>{customer.email || '-'}</span></p>
          <p><span className="text-slate-500 w-[70px] inline-block">line</span> <span>{customer.lineId || '-'}</span></p>
        </div>

        {/* Right Column */}
        <div className="text-[11px] pl-4 border-l border-slate-100">
          {customer.note && (() => {
            const car = parseCarInfo(customer.note);
            if (!car.carBrand && !car.carModel && !car.licensePlate) {
              return customer.note.split(' • ').map((line, i) => <p key={i} className="text-slate-900">{line}</p>);
            }
            return (
              <table className="text-[10px] text-slate-800 border-separate" style={{ borderSpacing: '8px 2px', marginTop: '-2px', marginLeft: '-8px' }}>
                <tbody>
                  {car.licensePlate && <tr><td className="text-slate-500 font-semibold text-right whitespace-nowrap">ทะเบียนรถ</td><td className="font-bold">: {car.licensePlate}</td></tr>}
                  {(car.carBrand || car.carModel) && <tr><td className="text-slate-500 font-semibold text-right whitespace-nowrap">ยี่ห้อ/รุ่น</td><td className="font-bold uppercase">: {[car.carBrand, car.carModel].filter(Boolean).join(' / ')}</td></tr>}
                  {car.carColor && <tr><td className="text-slate-500 font-semibold text-right whitespace-nowrap">สีรถ</td><td className="font-bold">: {car.carColor}</td></tr>}
                  {car.mileage && <tr><td className="text-slate-500 font-semibold text-right whitespace-nowrap">เลขไมล์</td><td className="font-bold">: {car.mileage} กม.</td></tr>}
                  {car.chassisNo && <tr><td className="text-slate-500 font-semibold text-right whitespace-nowrap">เลขตัวถัง</td><td className="font-bold">: {car.chassisNo}</td></tr>}
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>

      {/* Items */}
      <table className="w-full text-[11px] border-collapse mb-4">
        <thead>
          <tr className="bg-green-700 text-white">
            <th className="text-left py-2 px-2 font-semibold">คำอธิบาย</th>
            <th className="text-center py-2 px-2 font-semibold w-16">จำนวน</th>
            <th className="text-right py-2 px-2 font-semibold w-20">ราคา</th>
            <th className="text-right py-2 px-2 font-semibold w-16">ส่วนลด</th>
            <th className="text-center py-2 px-2 font-semibold w-14">VAT</th>
            <th className="text-right py-2 px-2 font-semibold w-24">มูลค่าก่อนภาษี</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-2 px-2">{i + 1}. {item.description}</td>
              <td className="py-2 px-2 text-center tabular-nums">{item.qty.toFixed(2)}</td>
              <td className="py-2 px-2 text-right tabular-nums">{fmt(item.unitPrice)}</td>
              <td className="py-2 px-2 text-right tabular-nums">{fmt(item.discountPercent ?? 0)}</td>
              <td className="py-2 px-2 text-center">{vatRate}%</td>
              <td className="py-2 px-2 text-right tabular-nums font-medium">{fmt(item.lineTotal)}</td>
            </tr>
          ))}
          {Array.from({ length: Math.max(0, minRows - items.length) }).map((_, i) => (
            <tr key={`e-${i}`} className="border-b border-slate-50"><td colSpan={6} className="py-2.5">&nbsp;</td></tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="flex justify-between gap-6 mb-4">
        <div className="flex-1 text-[11px] text-slate-800 self-end">
          <p>จำนวนเงินทั้งสิ้น</p>
          <p className="font-semibold text-slate-700">({numberToThaiBahtText(grandTotal)})</p>
        </div>
        <div className="w-72 shrink-0">
          <table className="w-full text-[11px]">
            <tbody>
              <tr><td className="py-1 text-slate-800">มูลค่าที่คำนวณภาษี {vatRate}%</td><td className="py-1 text-right tabular-nums">{fmt(vatBase)} บาท</td></tr>
              <tr><td className="py-1 text-slate-800">ภาษีมูลค่าเพิ่ม {vatRate}%</td><td className="py-1 text-right tabular-nums">{fmt(vatAmount)} บาท</td></tr>
              <tr className="bg-green-50">
                <td className="py-2 px-2 font-bold text-slate-900 rounded-l-lg">จำนวนเงินทั้งสิ้น</td>
                <td className="py-2 px-2 text-right font-black text-green-700 text-sm tabular-nums rounded-r-lg">{fmt(grandTotal)}</td>
              </tr>
              <tr><td className="py-1 pt-2 text-slate-800">จำนวนเงินที่ถูกหัก ณ ที่จ่าย</td><td className="py-1 pt-2 text-right tabular-nums">{fmt(withholding)} บาท</td></tr>
              <tr><td className="py-1 text-slate-800">จำนวนเงินที่ชำระ</td><td className="py-1 text-right tabular-nums font-semibold">{fmt(paid)} บาท</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment */}
      {payment && (payment.date || payment.method) && (
        <div className="mb-3 text-[11px] flex items-center gap-4 bg-slate-50 rounded-lg p-2.5">
          <span className="font-semibold text-slate-900 flex items-center gap-1"><CreditCard size={12} /> ชำระเงิน</span>
          {payment.date && <span className="text-slate-800">วันที่ชำระ: <span className="font-medium text-slate-800">{payment.date}</span></span>}
          {payment.method && <span className="text-slate-800">วิธี: <span className="font-medium text-slate-800">{payment.method}</span></span>}
          <span className="text-slate-800 ml-auto">จำนวนเงินรวม: <span className="font-bold text-slate-800">{fmt(paid)} บาท</span></span>
        </div>
      )}

      {/* Notes */}
      {notes.length > 0 && (
        <div className="mb-4 text-[10px] text-slate-800">
          <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1"><StickyNote size={11} /> หมายเหตุ</p>
          {notes.map((n, i) => <p key={i} className="whitespace-pre-wrap">* {n}</p>)}
        </div>
      )}

      {/* Certification / signatures */}
      <div className="pt-4 border-t border-slate-200">
        <p className="font-semibold text-slate-900 text-[11px] mb-3 flex items-center gap-1"><BadgeCheck size={12} /> รับรอง</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { role: 'ลูกค้า', sig: '', name: '' },
            { role: 'ผู้ส่งสินค้า / ผู้รับเงิน', sig: seller.issuerSignatureUrl, name: seller.issuerName },
            { role: 'ช่างผู้รับผิดชอบ', sig: '', name: technicianName ?? '' },
          ].map((col) => (
            <div key={col.role} className="space-y-1">
              <div className="h-10 flex items-center justify-center border-b border-dashed border-slate-300">
                {col.sig ? <img src={col.sig} alt={col.role} className="h-9 object-contain" /> : null}
              </div>
              <p className="text-[9px] text-slate-600 leading-tight">{col.role}</p>
              {col.name && <p className="text-[9px] font-medium text-slate-900">{col.name}</p>}
            </div>
          ))}
        </div>
      </div>

      {footerNote && (
        <div className="mt-4 pt-2 border-t border-slate-100 text-center text-[9px] text-slate-600">{footerNote}</div>
      )}
    </div>
  );
}
