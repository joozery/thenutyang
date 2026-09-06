import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { getDocumentById, DOC_TYPE_COLOR } from '@/lib/documents';
import { getDocumentSettings } from '@/lib/document-settings';
import { DocumentTemplate, type DocumentTemplateProps } from '@/components/admin/documents/document-template';
import { PaymentInfoPage } from '@/components/admin/documents/payment-info-page';
import { PrintBar } from './print-bar';
import { DocViewer } from './doc-viewer';

export const dynamic = 'force-dynamic';

const DOC_TYPE_PRINT_LABEL: Record<string, string> = {
  invoice:      'ใบเสร็จรับเงิน/ใบกำกับภาษี',
  quote:        'ใบเสนอราคา',
  credit_note:  'ใบลดหนี้',
  billing_note: 'ใบแจ้งหนี้',
  payment_note: 'ใบรับชำระ',
  booking_note: 'ใบจอง',
};

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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getDocumentById(id);
  if (!doc) return { title: 'ไม่พบเอกสาร' };
  return { title: `${doc.docNumber} — เดอะนัทยาง` };
}

export default async function PublicDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doc, settings, hdrs] = await Promise.all([
    getDocumentById(id),
    getDocumentSettings(),
    headers(),
  ]);

  if (!doc) notFound();

  const host = hdrs.get('host') ?? 'localhost:3000';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const publicUrl = `${proto}://${host}/doc/${id}`;
  const qrCodeUrl = await QRCode.toDataURL(publicUrl, { width: 256, margin: 1 });

  const templateProps: DocumentTemplateProps = {
    docTypeLabel: docTypePrintLabel(doc.type, doc.vatRate),
    docNumber: doc.docNumber,
    issueDate: fmtDate(doc.issuedAt),
    reference: doc.relatedDocNumber || doc.bookingRef || undefined,
    seller: settings,
    customer: {
      name: doc.customerName,
      phone: doc.customerPhone || undefined,
      email: doc.customerEmail || undefined,
      lineId: doc.customerLineId || undefined,
      note: doc.customerCar || undefined,
      address: doc.customerAddress || undefined,
      taxId: doc.customerTaxId || undefined,
      branch: doc.customerBranch || undefined,
    },
    items: doc.items.map((item) => ({
      description:     item.description,
      qty:             item.qty,
      unitPrice:       item.unitPrice,
      discountPercent: item.discount,
      discountType:    (item.discountType as 'pct' | 'amt') ?? 'pct',
      lineTotal:       item.lineTotal,
    })),
    vatRate: doc.vatRate,
    vatBase: doc.grandTotal - doc.vatAmount,
    vatAmount: doc.vatAmount,
    grandTotal: doc.grandTotal,
    subtotal: doc.subtotal,
    discountTotal: doc.discountTotal,
    depositAmount: doc.depositAmount ?? 0,
    accentColor: DOC_TYPE_COLOR[doc.type],
    payment: doc.paymentMethod !== 'pending' ? { method: PAYMENT_LABEL[doc.paymentMethod], date: fmtDate(doc.issuedAt) } : undefined,
    notes: doc.note ? [doc.note] : [],
    technicianName: doc.technicianName || undefined,
    qrCodeUrl,
  };

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          body > div { padding: 0 !important; background: none !important; gap: 0 !important; }
          #print-document * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="min-h-screen bg-slate-100 flex flex-col items-center gap-6 py-6">
        <PrintBar docNumber={doc.docNumber} docTypeLabel={templateProps.docTypeLabel} />
        <DocViewer>
          <div className="shadow-2xl rounded-xl overflow-hidden bg-white">
            <DocumentTemplate {...templateProps} />
          </div>
        </DocViewer>
        {doc.showPaymentInfo && (
          <DocViewer>
            <div className="shadow-2xl rounded-xl overflow-hidden bg-white">
              <PaymentInfoPage
                settings={settings}
                docNumber={doc.docNumber}
                docTypeLabel={templateProps.docTypeLabel}
                grandTotal={doc.grandTotal}
              />
            </div>
          </DocViewer>
        )}
      </div>
    </>
  );
}
