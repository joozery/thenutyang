import connectDB from './mongodb';
import { FinancialDocument } from '@/models/FinancialDocument';
import { generateDocNumber } from './documents';

// เรียกเมื่อมัดจำถูก "ยืนยันแล้ว" — ใช้ร่วมกันทั้งหน้าจองและหน้าการชำระเงิน/มัดจำ
// 1) ประทับยอดมัดจำเข้าเอกสารทุกใบที่ผูกกับการจอง (ใบเสนอราคา ฯลฯ)
// 2) ออก "ใบจอง (RES)" สถานะรับมัดจำแล้ว ถ้ายังไม่มี
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncVerifiedDeposit(booking: any): Promise<void> {
  await connectDB();
  const deposit = booking.depositAmount ?? 0;

  await FinancialDocument.updateMany(
    { bookingId: booking._id, status: { $ne: 'cancelled' } },
    { depositAmount: deposit },
  );

  const hasBookingNote = await FinancialDocument.findOne({ bookingId: booking._id, type: 'booking_note' }).lean();
  if (hasBookingNote || deposit <= 0) return;

  const docNumber = await generateDocNumber('booking_note');
  const qty = booking.quantity ?? 1;
  const subtotal = qty * (booking.tirePrice ?? 0);
  const vatAmount = subtotal * 0.07;
  await FinancialDocument.create({
    docNumber,
    type: 'booking_note',
    source: 'booking',
    bookingId: booking._id,
    bookingRef: booking.orderRef ?? booking.ref ?? '',
    customerName: booking.customerType === 'corporate' && booking.companyName ? booking.companyName : (booking.name ?? ''),
    customerPhone: booking.phone ?? '',
    customerCar: [booking.carBrand, booking.carModel, booking.licensePlate ? `ทะเบียน ${booking.licensePlate}` : ''].filter(Boolean).join(' '),
    customerAddress: booking.address ?? '',
    customerTaxId: booking.taxId ?? '',
    items: [{ description: booking.tireName ?? '', qty, unitPrice: booking.tirePrice ?? 0, discount: 0, lineTotal: subtotal }],
    subtotal,
    discountTotal: 0,
    vatRate: 7,
    vatAmount,
    grandTotal: subtotal + vatAmount,
    depositAmount: deposit,
    paymentMethod: 'pending',
    status: 'deposit_paid',
    issuedAt: new Date(),
    note: `มัดจำรับแล้ว ฿${deposit.toLocaleString()} (จอง ${booking.ref})`,
  });
}
