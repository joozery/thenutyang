export const TYPE_LABEL: Record<string, string> = {
  invoice:      'ใบเสร็จ',
  quote:        'ใบเสนอราคา',
  credit_note:  'ใบลดหนี้',
  billing_note: 'ใบแจ้งหนี้',
  payment_note: 'ใบรับชำระ',
  booking_note: 'ใบจอง',
};

export const TYPE_STYLE: Record<string, string> = {
  invoice:      'bg-blue-50 text-blue-700 border-blue-200/50',
  quote:        'bg-purple-50 text-purple-700 border-purple-200/50',
  credit_note:  'bg-orange-50 text-orange-700 border-orange-200/50',
  billing_note: 'bg-amber-50 text-amber-700 border-amber-200/50',
  payment_note: 'bg-teal-50 text-teal-700 border-teal-200/50',
  booking_note: 'bg-rose-50 text-rose-700 border-rose-200/50',
};

export const STATUS_LABEL: Record<string, string> = {
  paid:             'ชำระแล้ว',
  unpaid:           'ค้างชำระ',
  partial:          'ชำระบางส่วน',
  cancelled:        'ยกเลิก',
  pending_approval: 'รอตอบรับ',
  accepted:         'อนุมัติแล้ว',
  rejected:         'ปฏิเสธแล้ว',
  expired:          'หมดอายุ',
  issued:           'ออกแล้ว',
  reserved:         'จองแล้ว',
  deposit_paid:     'รับมัดจำแล้ว',
  completed:        'เสร็จสิ้น',
};

export const STATUS_STYLE: Record<string, { label: string; className: string; dot: string }> = {
  paid:             { label: 'ชำระแล้ว',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/50', dot: 'bg-emerald-500' },
  unpaid:           { label: 'ค้างชำระ',    className: 'bg-red-50 text-red-700 border-red-200/50',             dot: 'bg-red-500'     },
  partial:          { label: 'ชำระบางส่วน', className: 'bg-amber-50 text-amber-700 border-amber-200/50',       dot: 'bg-amber-500'   },
  cancelled:        { label: 'ยกเลิก',      className: 'bg-slate-50 text-slate-500 border-slate-200/50',       dot: 'bg-slate-400'   },
  pending_approval: { label: 'รอตอบรับ',    className: 'bg-amber-50 text-amber-700 border-amber-200/50',       dot: 'bg-amber-500'   },
  accepted:         { label: 'อนุมัติแล้ว', className: 'bg-blue-50 text-blue-700 border-blue-200/50',          dot: 'bg-blue-500'    },
  rejected:         { label: 'ปฏิเสธแล้ว', className: 'bg-slate-50 text-slate-500 border-slate-200/50',       dot: 'bg-slate-400'   },
  expired:          { label: 'หมดอายุ',     className: 'bg-slate-50 text-slate-500 border-slate-200/50',       dot: 'bg-slate-400'   },
  issued:           { label: 'ออกแล้ว',     className: 'bg-purple-50 text-purple-700 border-purple-200/50',   dot: 'bg-purple-500'  },
  reserved:         { label: 'จองแล้ว',     className: 'bg-rose-50 text-rose-700 border-rose-200/50',         dot: 'bg-rose-500'    },
  deposit_paid:     { label: 'รับมัดจำแล้ว', className: 'bg-green-50 text-green-700 border-green-200/50',     dot: 'bg-green-500'   },
  completed:        { label: 'เสร็จสิ้น',   className: 'bg-emerald-50 text-emerald-700 border-emerald-200/50', dot: 'bg-emerald-500' },
};

export const PAYMENT_LABEL: Record<string, string> = {
  cash:        'เงินสด',
  transfer:    'โอนเงิน',
  credit_card: 'บัตรเครดิต',
  pending:     'รอชำระ',
};

export function fmtDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

export function fmtMoney(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function StatusBadge({ status }: { status: string }) {
  const st = STATUS_STYLE[status] || { label: status, className: 'bg-slate-50 text-slate-500 border-slate-200/50', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full border ${st.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export const PAGE_SIZE = 20;
