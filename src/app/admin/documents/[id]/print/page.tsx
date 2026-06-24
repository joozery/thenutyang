import { notFound } from 'next/navigation';
import { getDocumentById } from '@/lib/documents';
import { getDocumentSettings } from '@/lib/document-settings';
import { PrintPageShell } from '@/components/admin/documents/print-page-shell';
import { DocumentTemplate, type DocumentTemplateProps } from '@/components/admin/documents/document-template';
import { PaymentInfoPage } from '@/components/admin/documents/payment-info-page';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ตัวอย่างก่อนพิมพ์ | Admin' };

const DOC_TYPE_PRINT_LABEL: Record<string, string> = {
  invoice:      'ใบเสร็จรับเงิน/ใบกำกับภาษี',
  quote:        'ใบเสนอราคา',
  credit_note:  'ใบลดหนี้',
  billing_note: 'ใบแจ้งหนี้',
  payment_note: 'ใบรับชำระ',
};

// ใบเสร็จที่ไม่มี VAT ใช้ชื่อ "ใบเสร็จรับเงิน" เฉยๆ — มี VAT ถึงจะนับเป็นใบกำกับภาษีได้ด้วย
function docTypePrintLabel(type: string, vatRate: number): string {
  if (type === 'invoice' && vatRate <= 0) return 'ใบเสร็จรับเงิน';
  return DOC_TYPE_PRINT_LABEL[type] ?? type;
}

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

export default async function DocumentPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doc, settings] = await Promise.all([
    getDocumentById(id),
    getDocumentSettings(),
  ]);

  if (!doc) notFound();

  const templateProps: DocumentTemplateProps = {
    docTypeLabel: docTypePrintLabel(doc.type, doc.vatRate),
    docNumber: doc.docNumber,
    issueDate: fmtDate(doc.issuedAt),
    reference: doc.relatedDocNumber || doc.bookingRef || undefined,
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
    vatBase: doc.grandTotal - doc.vatAmount,
    vatAmount: doc.vatAmount,
    grandTotal: doc.grandTotal,
    payment: doc.paymentMethod !== 'pending' ? { method: PAYMENT_LABEL[doc.paymentMethod], date: fmtDate(doc.issuedAt) } : undefined,
    notes: doc.note ? [doc.note] : [],
    footerNote: `เอกสารนี้ออกโดยระบบ ${settings.companyName || ''} · ${doc.docNumber} · พิมพ์เมื่อ ${new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}`,
  };

  return (
    <PrintPageShell>
      <DocumentTemplate {...templateProps} />
      {doc.showPaymentInfo && (
        <PaymentInfoPage
          settings={settings}
          docNumber={doc.docNumber}
          docTypeLabel={templateProps.docTypeLabel}
          grandTotal={doc.grandTotal}
        />
      )}
    </PrintPageShell>
  );
}
