import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/products';
import { getServiceItems } from '@/lib/service-items';
import { getDocumentById } from '@/lib/documents';
import { isDocEditable } from '@/lib/doc-editable';
import { getActiveEmployees } from '@/lib/employees';
import { getCarBrands, getCarModels } from '@/app/actions/car-data';
import { NewDocumentClient, type DocPrefill } from '@/components/admin/new-document-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'แก้ไขเอกสาร | Admin' };

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [serviceItems, doc, employees, carBrands, carModels] = await Promise.all([
    getServiceItems(),
    getDocumentById(id),
    getActiveEmployees(),
    getCarBrands(),
    getCarModels(),
  ]);

  if (!doc || !isDocEditable(doc.type, doc.status)) notFound();

  const productIds = [...new Set(doc.items.map((item) => item.productId).filter(Boolean))] as string[];
  const productRows = await Promise.all(productIds.map((productId) => getProductById(productId)));
  const products = productRows.filter((product): product is NonNullable<typeof product> => !!product);

  const lineDiscTotal = doc.items.reduce((sum, i) => {
    const gross = i.qty * i.unitPrice;
    return sum + (i.discountType === 'amt' ? Math.min(i.discount, gross) : gross * (i.discount / 100));
  }, 0);
  const globalDiscount = Math.max(0, (doc.discountTotal || 0) - lineDiscTotal);

  const prefill: DocPrefill = {
    docType:         doc.type,
    customerName:    doc.customerName,
    customerPhone:   doc.customerPhone,
    customerCar:     doc.customerCar,
    bookingRef:      doc.bookingRef,
    customerAddress: doc.customerAddress,
    customerTaxId:   doc.customerTaxId,
    customerBranch:  doc.customerBranch,
    issuedDate:      doc.issuedAt ? doc.issuedAt.slice(0, 10) : '',
    items:           doc.items.map((i) => {
      const p = products.find(prod => prod.id === i.productId);
      return { productId: i.productId, description: i.description, qty: i.qty, unitPrice: i.unitPrice, discount: i.discount, lineCostPrice: p?.costPrice ?? 0 };
    }),
    vatRate:         doc.vatRate,
    paymentMethod:   doc.paymentMethod,
    technicianName:  doc.technicianName,
    note:            doc.note,
    showPaymentInfo: doc.showPaymentInfo,
    dueDate:         doc.dueDate ? doc.dueDate.slice(0, 10) : '',
    sourceDocId:        '',
    sourceDocNumber:    '',
    sourceDocTypeLabel: '',
    globalDiscount,
    costPrice:       doc.costPrice ?? undefined,
  };

  return (
    <NewDocumentClient
      customers={[]}
      products={[]}
      serviceItems={serviceItems}
      employees={employees}
      carBrands={carBrands}
      carModels={carModels}
      prefill={prefill}
      editTarget={{ docId: doc.id, docNumber: doc.docNumber }}
    />
  );
}
