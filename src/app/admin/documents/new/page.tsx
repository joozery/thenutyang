import { getCustomers, mergeCustomerSources } from '@/lib/customers';
import { getCustomerDirectory } from '@/lib/customer-directory';
import { getAllProductsAdmin } from '@/lib/products';
import { getServiceItems } from '@/lib/service-items';
import { getDocumentById } from '@/lib/documents';
import type { DocType } from '@/lib/documents';
import { getActiveEmployees } from '@/lib/employees';
import { getCarBrands, getCarModels } from '@/app/actions/car-data';
import { NewDocumentClient, type DocPrefill } from '@/components/admin/new-document-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'สร้างเอกสาร | Admin' };

const TYPE_LABEL: Record<DocType, string> = {
  invoice:      'ใบเสร็จ / ใบกำกับภาษี',
  quote:        'ใบเสนอราคา',
  credit_note:  'ใบลดหนี้',
  billing_note: 'ใบแจ้งหนี้',
  payment_note: 'ใบรับชำระ',
  booking_note: 'ใบจอง',
};

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; type?: string; deposit?: string }>;
}) {
  const { from, type, deposit } = await searchParams;

  const [bookingCustomers, directoryCustomers, products, serviceItems, sourceDoc, employees, carBrands, carModels] = await Promise.all([
    getCustomers(),
    getCustomerDirectory(),
    getAllProductsAdmin(),
    getServiceItems(),
    from ? getDocumentById(from) : Promise.resolve(null),
    getActiveEmployees(),
    getCarBrands(),
    getCarModels(),
  ]);
  const customers = mergeCustomerSources(bookingCustomers, directoryCustomers);

  let prefill: DocPrefill | undefined;
  if (sourceDoc) {
    const isDepositReceipt = deposit === '1' && sourceDoc.type === 'booking_note' && sourceDoc.depositAmount > 0;

    if (isDepositReceipt) {
      // ออกใบเสร็จเฉพาะยอดมัดจำ — line item เดียว ราคา = depositAmount อ้างอิงใบจองในหมายเหตุ
      const firstItemName = sourceDoc.items[0]?.description ?? 'สินค้า/บริการ';
      prefill = {
        docType: 'invoice',
        customerName:    sourceDoc.customerName,
        customerPhone:   sourceDoc.customerPhone,
        customerCar:     sourceDoc.customerCar,
        customerAddress: sourceDoc.customerAddress,
        customerTaxId:   sourceDoc.customerTaxId,
        customerBranch:  sourceDoc.customerBranch,
        bookingRef:      sourceDoc.bookingRef,
        items: [{ description: `มัดจำ – ${firstItemName}`, qty: 1, unitPrice: sourceDoc.depositAmount, discount: 0 }],
        vatRate:       0,
        paymentMethod: sourceDoc.paymentMethod,
        note:          `มัดจำจากใบจอง ${sourceDoc.docNumber}`,
        sourceDocId:        sourceDoc.id,
        sourceDocNumber:    sourceDoc.docNumber,
        sourceDocTypeLabel: TYPE_LABEL[sourceDoc.type],
        depositAmount:      0,
      };
    } else {
      const targetType: DocType =
        type === 'invoice' || type === 'credit_note' || type === 'billing_note' || type === 'booking_note' ? type : 'invoice';
      prefill = {
        docType: targetType,
        customerName:    sourceDoc.customerName,
        customerPhone:   sourceDoc.customerPhone,
        customerCar:     sourceDoc.customerCar,
        customerAddress: sourceDoc.customerAddress,
        customerTaxId:   sourceDoc.customerTaxId,
        customerBranch:  sourceDoc.customerBranch,
        bookingRef:      sourceDoc.bookingRef,
        items: sourceDoc.items.map((i) => ({ description: i.description, qty: i.qty, unitPrice: i.unitPrice, discount: i.discount })),
        vatRate:       sourceDoc.vatRate,
        paymentMethod: sourceDoc.paymentMethod,
        note:          sourceDoc.note,
        sourceDocId:        sourceDoc.id,
        sourceDocNumber:    sourceDoc.docNumber,
        sourceDocTypeLabel: TYPE_LABEL[sourceDoc.type],
        depositAmount:      sourceDoc.type === 'booking_note' ? sourceDoc.depositAmount : 0,
      };
    }
  }

  return <NewDocumentClient customers={customers} products={products} serviceItems={serviceItems} employees={employees} prefill={prefill} carBrands={carBrands} carModels={carModels} />;
}
