'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Plus, Search, ExternalLink } from 'lucide-react';
import type { ClaimRow } from '@/lib/warranty-claims';
import { STATUS_LABEL, STATUS_COLOR, type ClaimStatus } from '@/lib/warranty-claims-constants';

const ALL_STATUSES: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'customer_filed', label: 'รับเรื่องแล้ว' },
  { value: 'sent_to_supplier', label: 'ส่งเครมแล้ว' },
  { value: 'waiting_result', label: 'รอผล' },
  { value: 'resolved', label: 'ปิดเคส' },
];

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function WarrantyClaimsClient({ initialClaims }: { initialClaims: ClaimRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [activeStatus, setActiveStatus] = useState(searchParams.get('status') ?? 'all');
  const [, startTransition] = useTransition();

  const filtered = initialClaims.filter((c) => {
    const matchStatus = activeStatus === 'all' || c.status === activeStatus;
    const matchQ = !q.trim() || [c.claimNumber, c.customerName, c.licensePlate, c.supplierName]
      .some((v) => v.toLowerCase().includes(q.toLowerCase()));
    return matchStatus && matchQ;
  });

  function pushFilter(status: string, search: string) {
    const p = new URLSearchParams();
    if (status !== 'all') p.set('status', status);
    if (search.trim()) p.set('q', search.trim());
    startTransition(() => router.replace(`/admin/warranty-claims?${p.toString()}`));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5">
            <Shield size={22} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">การเครมประกัน</h1>
            <p className="text-sm text-slate-500">จัดการเคสเครมสินค้าทั้งหมด</p>
          </div>
        </div>
        <Link
          href="/admin/warranty-claims/new"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> เปิดเคสใหม่
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหา เลขเคส / ลูกค้า / ทะเบียน..."
            value={q}
            onChange={(e) => { setQ(e.target.value); pushFilter(activeStatus, e.target.value); }}
            className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ALL_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => { setActiveStatus(s.value); pushFilter(s.value, q); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                activeStatus === s.value
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">ไม่มีเคสเครม</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold">เลขเคส</th>
                <th className="text-left px-5 py-3.5 font-semibold">ลูกค้า</th>
                <th className="text-left px-5 py-3.5 font-semibold">ทะเบียน</th>
                <th className="text-left px-5 py-3.5 font-semibold">วันที่เครม</th>
                <th className="text-left px-5 py-3.5 font-semibold">รายการ</th>
                <th className="text-left px-5 py-3.5 font-semibold">บริษัทที่เครม</th>
                <th className="text-left px-5 py-3.5 font-semibold">สถานะ</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-slate-800">{c.claimNumber}</td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-800">{c.customerName || '—'}</div>
                    {c.customerPhone && <div className="text-xs text-slate-400">{c.customerPhone}</div>}
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-700">{c.licensePlate || '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{fmtDate(c.claimDate)}</td>
                  <td className="px-5 py-4 text-slate-600 max-w-[160px]">
                    {c.items.map((it, i) => (
                      <div key={i} className="truncate text-xs">
                        {it.brand} {it.size} ×{it.quantity}
                      </div>
                    ))}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{c.supplierName || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[c.status as ClaimStatus]}`}>
                      {STATUS_LABEL[c.status as ClaimStatus]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/warranty-claims/${c.id}`}
                      className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-bold"
                    >
                      <ExternalLink size={13} /> รายละเอียด
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
