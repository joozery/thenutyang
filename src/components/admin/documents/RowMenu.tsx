'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { MoreHorizontal, CheckCircle, Clock, FileClock, Receipt, FileMinus, XCircle } from 'lucide-react';
import type { DocRow } from '@/lib/documents';

const MENU_WIDTH = 232;
const itemCls = 'w-full text-left px-3 py-2 text-[13px] rounded-lg font-semibold flex items-center gap-2.5 transition-colors';

/**
 * เมนู "เพิ่มเติม" ของแต่ละแถว — เปิดด้วยการคลิก (ใช้บนมือถือได้)
 * render ผ่าน portal + position: fixed จะได้ไม่โดน overflow ของตารางตัดขอบ
 */
export function RowMenu({
  doc,
  onStatusChange,
  onDelete,
}: {
  doc: DocRow;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean }>({ top: 0, left: 0, up: false });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const menuH = menuRef.current?.offsetHeight ?? 200;
    const up = r.bottom + menuH + 8 > window.innerHeight && r.top - menuH - 8 > 0;
    setPos({
      top: up ? r.top - menuH - 6 : r.bottom + 6,
      left: Math.max(8, Math.min(r.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
      up,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e.type === 'keydown' && (e as KeyboardEvent).key !== 'Escape') return;
      if (e.type === 'mousedown' && (menuRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node))) return;
      setOpen(false);
    };
    const closeNow = () => setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    window.addEventListener('scroll', closeNow, true);
    window.addEventListener('resize', closeNow);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
      window.removeEventListener('scroll', closeNow, true);
      window.removeEventListener('resize', closeNow);
    };
  }, [open]);

  const act = (fn: () => void) => () => { setOpen(false); fn(); };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        aria-haspopup="menu"
        aria-expanded={open}
        title="เพิ่มเติม"
        className={`p-2 rounded-lg transition-colors ${open ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          role="menu"
          onClick={(e) => e.stopPropagation()}
          style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
          className="fixed z-[60] bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_rgb(0,0,0,0.14)] p-1.5 flex flex-col gap-0.5"
        >
          {doc.type === 'invoice' && doc.status === 'unpaid' && (
            <button onClick={act(() => onStatusChange(doc.id, 'paid'))} className={`${itemCls} text-emerald-700 hover:bg-emerald-50`}>
              <CheckCircle size={15} /> รับชำระแล้ว
            </button>
          )}
          {doc.type === 'quote' && doc.status === 'pending_approval' && (
            <>
              <button onClick={act(() => onStatusChange(doc.id, 'accepted'))} className={`${itemCls} text-blue-700 hover:bg-blue-50`}>
                <CheckCircle size={15} /> อนุมัติใบเสนอราคา
              </button>
              <button onClick={act(() => onStatusChange(doc.id, 'expired'))} className={`${itemCls} text-slate-600 hover:bg-slate-100`}>
                <Clock size={15} /> หมดอายุ
              </button>
            </>
          )}
          {doc.type === 'quote' && (
            <>
              {doc.status === 'pending_approval' && <div className="h-px bg-slate-100 my-1 mx-2" />}
              <p className="px-3 pt-1 pb-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">สร้างเอกสารอ้างอิงใบนี้</p>
              <Link href={`/admin/documents/new?from=${doc.id}&type=billing_note`} className={`${itemCls} text-amber-700 hover:bg-amber-50`}>
                <FileClock size={15} /> ใบแจ้งหนี้
              </Link>
              <Link href={`/admin/documents/new?from=${doc.id}&type=invoice`} className={`${itemCls} text-blue-700 hover:bg-blue-50`}>
                <Receipt size={15} /> ใบเสร็จ
              </Link>
              <Link href={`/admin/documents/new?from=${doc.id}&type=credit_note`} className={`${itemCls} text-orange-700 hover:bg-orange-50`}>
                <FileMinus size={15} /> ใบลดหนี้
              </Link>
            </>
          )}
          {((doc.type === 'invoice' && doc.status === 'unpaid') || doc.type === 'quote') && <div className="h-px bg-slate-100 my-1 mx-2" />}
          <button onClick={act(() => onDelete(doc.id))} className={`${itemCls} text-red-600 hover:bg-red-50`}>
            <XCircle size={15} /> ลบเอกสารนี้
          </button>
        </div>,
        document.body,
      )}
    </>
  );
}
