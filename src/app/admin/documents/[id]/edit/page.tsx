import { notFound } from 'next/navigation';
import { getCustomers, mergeCustomerSources } from '@/lib/customers';
import { getCustomerDirectory } from '@/lib/customer-directory';
import { getAllProductsAdmin } from '@/lib/products';
import { getServiceItems } from '@/lib/service-items';
import { getDocumentById } from '@/lib/documents';
import { isDocEditable } from '@/lib/doc-editable';
import { getActiveEmployees } from '@/lib/employees';
import { NewDocumentClient, type DocPrefill } from '@/components/admin/new-document-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'แก้ไขเอกสาร | Admin' };

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [bookingCustomers, directoryCustomers, products, serviceItems, doc, employees] = await Promise.all([
    getCustomers(),
    getCustomerDirectory(),
    getAllProductsAdmin(),
    getServiceItems(),
    getDocumentById(id),
    getActiveEmployees(),
  ]);

  if (!doc || !isDocEditable(doc.type, doc.status)) notFound();

  const customers = mergeCustomerSources(bookingCustomers, directoryCustomers);

  const prefill: DocPrefill = {
    docType:         doc.type,
    customerName:    doc.customerName,
    customerPhone:   doc.customerPhone,
    customerCar:     doc.customerCar,
    bookingRef:      doc.bookingRef,
    customerAddress: doc.customerAddress,
    customerTaxId:   doc.customerTaxId,
    customerBranch:  doc.customerBranch,
    items:           doc.items.map((i) => ({ description: i.description, qty: i.qty, unitPrice: i.unitPrice, discount: i.discount })),
    vatRate:         doc.vatRate,
    paymentMethod:   doc.paymentMethod,
    technicianName:  doc.technicianName,
    note:            doc.note,
    showPaymentInfo: doc.showPaymentInfo,
    dueDate:         doc.dueDate ? doc.dueDate.slice(0, 10) : '',
    sourceDocId:        '',
    sourceDocNumber:    '',
    sourceDocTypeLabel: '',
  };

  return (
    <NewDocumentClient
      customers={customers}
      products={products}
      serviceItems={serviceItems}
      employees={employees}
      prefill={prefill}
      editTarget={{ docId: doc.id, docNumber: doc.docNumber }}
    />
  );
}
