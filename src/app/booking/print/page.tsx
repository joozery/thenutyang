import { notFound } from 'next/navigation';
import { getDocumentByBookingRef } from '@/lib/documents';
import { getDocumentSettings } from '@/lib/document-settings';
import { PrintPageShell } from '@/components/admin/documents/print-page-shell';
import { DocumentTemplate, type DocumentTemplateProps } from '@/components/admin/documents/document-template';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ใบเสนอราคาของคุณ | เดอะนัททายางยนต์' };

const DOC_TYPE_PRINT_LABEL: Record<string, string> = {
  invoice:     'ใบเสร็จรับเงิน/ใบกำกับภาษี',
  quote:       'ใบเสนอราคา',
  credit_note: 'ใบลดหนี้',
};

const PAYMENT_LABEL: Record<string, string> = {
  cash:        'เงินสด',
  transfer:    'โอนเงิน',
  credit_card: 'บัตรเครดิต',
  pending:     'รอชำระ',
};

function fmtDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default async function BookingPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  if (!ref) notFound();

  const [doc, settings] = await Promise.all([
    getDocumentByBookingRef(ref),
    getDocumentSettings(),
  ]);

  if (!doc) notFound();

  const templateProps: DocumentTemplateProps = {
    docTypeLabel: DOC_TYPE_PRINT_LABEL[doc.type] ?? doc.type,
    docNumber: doc.docNumber,
    issueDate: fmtDate(doc.issuedAt),
    reference: doc.bookingRef || undefined,
    seller: settings,
    customer: {
      name: doc.customerName,
      phone: doc.customerPhone || undefined,
      note: doc.customerCar || undefined,
      address: doc.customerAddress || undefined,
      taxId: doc.customerTaxId || undefined,
      attn: doc.customerName,
    },
    items: doc.items.map((item) => ({
      description: item.description,
      qty: item.qty,
      unitPrice: item.unitPrice,
      discountPercent: item.discount,
      lineTotal: item.lineTotal,
    })),
    vatRate: doc.vatRate,
    vatBase: doc.subtotal - doc.discountTotal,
    vatAmount: doc.vatAmount,
    grandTotal: doc.grandTotal,
    payment: doc.paymentMethod !== 'pending' ? { method: PAYMENT_LABEL[doc.paymentMethod], date: fmtDate(doc.issuedAt) } : undefined,
    notes: doc.note ? [doc.note] : [],
    footerNote: `เอกสารนี้ออกโดยระบบ ${settings.companyName || ''} · ${doc.docNumber} · พิมพ์เมื่อ ${new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}`,
  };

  return (
    <PrintPageShell>
      <DocumentTemplate {...templateProps} />
    </PrintPageShell>
  );
}
