'use server';

import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { isValidObjectId } from 'mongoose';
import connectDB from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { Product } from '@/models/Product';
import { pushMessage, buildQuoteFlexMessage } from '@/lib/line';

async function generateRef(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Booking.countDocuments({ ref: { $regex: `^NTY-${today}` } });
  const seq = String(count + 1).padStart(4, '0');
  return `NTY-${today}-${seq}`;
}

function getFullName(formData: FormData): string {
  const firstName = ((formData.get('firstName') as string) ?? '').trim();
  const lastName  = ((formData.get('lastName')  as string) ?? '').trim();
  return `${firstName} ${lastName}`.trim();
}

function getCustomerFields(formData: FormData) {
  const customerType = (formData.get('customerType') as string) === 'corporate' ? 'corporate' : 'individual';
  return {
    name:         getFullName(formData),
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

export async function createBooking(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  try {
    await connectDB();

    const ref = await generateRef();
    const lineUserId = (formData.get('lineUserId') as string) || undefined;
    const tireId = formData.get('tireId') as string;
    const quantity = Number(formData.get('quantity') ?? 4);
    const depositStatus = await resolveDepositStatus(tireId, quantity);

    const booking = await Booking.create({
      ref,
      tireId,
      tireName:        formData.get('tireName') as string,
      tirePrice:       Number(formData.get('tirePrice')),
      quantity,
      depositStatus,
      ...getCustomerFields(formData),
      phone:           formData.get('phone') as string,
      lineId:          (formData.get('lineId') as string) || '',
      appointmentDate: formData.get('appointmentDate') as string,
      note:            (formData.get('note') as string) ?? '',
      lineUserId,
    });

    let sent = false;
    if (lineUserId) {
      try {
        await pushMessage(lineUserId, [buildQuoteFlexMessage(booking.toObject())]);
        sent = true;
      } catch {
        // push ล้มเหลว (ยังไม่ add OA) — บันทึก booking ไว้ก่อน
      }
    }

    redirect(`/booking/success?ref=${ref}&sent=${sent ? '1' : '0'}`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error('[createBooking]', err);
    return { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่ หรือติดต่อร้านโดยตรง' };
  }
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
      phone:           formData.get('phone') as string,
      lineId:          (formData.get('lineId') as string) || '',
      appointmentDate: formData.get('appointmentDate') as string,
      note:            (formData.get('note') as string) ?? '',
      lineUserId,
    };

    const refs: string[] = [];
    const flexMessages: object[] = [];

    for (const item of items) {
      const ref = await generateRef();
      const depositStatus = await resolveDepositStatus(item.id, item.quantity);
      const booking = await Booking.create({
        ref,
        tireId:    item.id,
        tireName:  item.name,
        tirePrice: item.price,
        quantity:  item.quantity,
        depositStatus,
        ...common,
      });
      refs.push(ref);
      flexMessages.push(buildQuoteFlexMessage(booking.toObject()));
    }

    let sent = false;
    if (lineUserId) {
      try {
        await pushMessage(lineUserId, flexMessages.slice(0, 5));
        sent = true;
      } catch {
        // push ล้มเหลว (ยังไม่ add OA) — บันทึก booking ไว้ก่อน
      }
    }

    redirect(`/booking/success?ref=${refs.join(',')}&sent=${sent ? '1' : '0'}&cart=1`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error('[createCartBooking]', err);
    return { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่ หรือติดต่อร้านโดยตรง' };
  }
}
