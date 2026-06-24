import { getCustomers, mergeCustomerSources } from '@/lib/customers';
import { getCustomerDirectory } from '@/lib/customer-directory';
import { getAllProductsAdmin } from '@/lib/products';
import { getDocumentById } from '@/lib/documents';
import type { DocType } from '@/lib/documents';
import { NewDocumentClient, type DocPrefill } from '@/components/admin/new-document-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'สร้างเอกสาร | Admin' };

const TYPE_LABEL: Record<DocType, string> = {
  invoice:      'ใบเสร็จ / ใบกำกับภาษี',
  quote:        'ใบเสนอราคา',
  credit_note:  'ใบลดหนี้',
  billing_note: 'ใบแจ้งหนี้',
  payment_note: 'ใบรับชำระ',
};

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; type?: string }>;
}) {
  const { from, type } = await searchParams;

  const [bookingCustomers, directoryCustomers, products, sourceDoc] = await Promise.all([
    getCustomers(),
    getCustomerDirectory(),
    getAllProductsAdmin(),
    from ? getDocumentById(from) : Promise.resolve(null),
  ]);
  const customers = mergeCustomerSources(bookingCustomers, directoryCustomers);

  let prefill: DocPrefill | undefined;
  if (sourceDoc) {
    const targetType: DocType =
      type === 'invoice' || type === 'credit_note' || type === 'billing_note' ? type : 'invoice';
    prefill = {
      docType: targetType,
      customerName:    sourceDoc.customerName,
      customerPhone:   sourceDoc.customerPhone,
      customerCar:     sourceDoc.customerCar,
      customerAddress: sourceDoc.customerAddress,
      customerTaxId:   sourceDoc.customerTaxId,
      bookingRef:      sourceDoc.bookingRef,
      items: sourceDoc.items.map((i) => ({ description: i.description, qty: i.qty, unitPrice: i.unitPrice, discount: i.discount })),
      vatRate:       sourceDoc.vatRate,
      paymentMethod: sourceDoc.paymentMethod,
      note:          sourceDoc.note,
      sourceDocId:        sourceDoc.id,
      sourceDocNumber:    sourceDoc.docNumber,
      sourceDocTypeLabel: TYPE_LABEL[sourceDoc.type],
    };
  }

  return <NewDocumentClient customers={customers} products={products} prefill={prefill} />;
}
