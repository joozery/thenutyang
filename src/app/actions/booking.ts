'use server';

import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { isValidObjectId } from 'mongoose';
import connectDB from '@/lib/mongodb';
import { Booking, type IBooking } from '@/models/Booking';
import { Product } from '@/models/Product';
import { pushMessage, buildQuoteFlexMessage, buildQuoteFlexMessageMulti } from '@/lib/line';
import { createQuoteFromBooking, createQuoteFromBookings } from './documents';
import { upsertCustomerFromBooking } from './customers';

// หา seq สูงสุดของวันนี้แล้ว +1 — ใช้ count อย่างเดียวไม่ปลอดภัย เพราะถ้ามีการลบ booking ทดสอบออกไป
// count จะลดลงต่ำกว่าเลขที่ใช้ไปแล้วจริง ทำให้ generate ref ซ้ำกับของเดิมที่ยังเหลืออยู่
async function generateRef(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const docs = await Booking.find({ ref: { $regex: `^NTY-${today}-\\d{4}` } }, { ref: 1 }).lean();
  const maxSeq = docs.reduce((max, d) => {
    const match = (d.ref as string).match(/^NTY-\d{8}-(\d{4})/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  const seq = String(maxSeq + 1).padStart(4, '0');
  return `NTY-${today}-${seq}`;
}

function getVehicleFields(formData: FormData) {
  const mileageBefore = formData.get('mileageBefore') as string;
  const mileageAfter = formData.get('mileageAfter') as string;
  return {
    carBrand:      ((formData.get('carBrand') as string) ?? '').trim(),
    carModel:      ((formData.get('carModel') as string) ?? '').trim(),
    licensePlate:  ((formData.get('licensePlate') as string) ?? '').trim(),
    mileageBefore: mileageBefore ? Number(mileageBefore) : null,
    mileageAfter:  mileageAfter ? Number(mileageAfter) : null,
  };
}

function getCustomerFields(formData: FormData) {
  const customerType: 'individual' | 'corporate' = (formData.get('customerType') as string) === 'corporate' ? 'corporate' : 'individual';
  const firstName = ((formData.get('firstName') as string) ?? '').trim();
  const lastName  = ((formData.get('lastName')  as string) ?? '').trim();
  return {
    name: `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    customerType,
    companyName:  customerType === 'corporate' ? ((formData.get('companyName') as string) ?? '').trim() : '',
    address:      ((formData.get('address') as string) ?? '').trim(),
    taxId:        ((formData.get('taxId') as string) ?? '').trim(),
  };
}

// เก็บมัดจำเฉพาะกรณีร้านไม่มีสินค้าพอ (ต้องสั่งของเพิ่ม) — ถ้าสต๊อกพอ ไม่ต้องมัดจำ
async function resolveDepositStatus(tireId: string, quantity: number): Promise<'pending' | 'not_required'> {
  if (!isValidObjectId(tireId)) return 'pending';
  const product = await Product.findById(tireId).lean() as { stock?: number } | null;
  if (!product) return 'pending';
  return (product.stock ?? 0) >= quantity ? 'not_required' : 'pending';
}

type CartCheckoutItem = { id: string; name: string; price: number; quantity: number };

export async function createCartBooking(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  try {
    await connectDB();

    const items: CartCheckoutItem[] = JSON.parse((formData.get('items') as string) || '[]');
    if (items.length === 0) return { error: 'ตะกร้าว่าง กรุณาเลือกสินค้าก่อน' };

    const lineUserId = (formData.get('lineUserId') as string) || undefined;
    const common = {
      ...getCustomerFields(formData),
      ...getVehicleFields(formData),
      phone:           formData.get('phone') as string,
      lineId:          (formData.get('lineId') as string) || '',
      appointmentDate: formData.get('appointmentDate') as string,
      note:            (formData.get('note') as string) ?? '',
      lineUserId,
    };

    const orderRef = await generateRef();
    const bookings: (IBooking & { _id: unknown })[] = [];

    for (const item of items) {
      // ใช้ orderRef เป็นเลขการจองหลักที่ลูกค้าเห็น/ใช้ชำระเงิน ส่วน ref ต่อรายการมีไว้แยกติดตามมัดจำ/สต๊อกของยางแต่ละรุ่นในฝั่งแอดมินเท่านั้น
      const ref = items.length === 1 ? orderRef : `${orderRef}-${bookings.length + 1}`;
      const depositStatus = await resolveDepositStatus(item.id, item.quantity);
      const booking = await Booking.create({
        ref,
        orderRef,
        tireId:    item.id,
        tireName:  item.name,
        tirePrice: item.price,
        quantity:  item.quantity,
        depositStatus,
        ...common,
      });
      bookings.push(booking.toObject());
    }

    // ตะกร้ามีหลายรายการ → รวมเป็นใบเสนอราคาใบเดียว (หลายบรรทัดสินค้า) แทนแยกใบต่อรายการ
    if (bookings.length === 1) {
      await createQuoteFromBooking(bookings[0]);
    } else {
      await createQuoteFromBookings(bookings);
    }

    await upsertCustomerFromBooking(common);

    let sent = false;
    if (lineUserId) {
      try {
        const flexMessage = bookings.length === 1
          ? buildQuoteFlexMessage(bookings[0])
          : buildQuoteFlexMessageMulti(bookings);
        await pushMessage(lineUserId, [flexMessage]);
        sent = true;
      } catch {
        // push ล้มเหลว (ยังไม่ add OA) — บันทึก booking ไว้ก่อน
      }
    }

    redirect(`/booking/success?ref=${orderRef}&sent=${sent ? '1' : '0'}&cart=1`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error('[createCartBooking]', err);
    return { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่ หรือติดต่อร้านโดยตรง' };
  }
}
