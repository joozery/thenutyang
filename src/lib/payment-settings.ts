import connectDB from './mongodb';
import { PaymentSettings } from '@/models/PaymentSettings';

export async function getPaymentQrImage(): Promise<string> {
  await connectDB();
  const doc = await PaymentSettings.findOne({}).lean() as { qrCodeImage?: string } | null;
  return doc?.qrCodeImage ?? '';
}

export async function getBookingByRef(ref: string) {
  await connectDB();
  const { Booking } = await import('@/models/Booking');
  const doc = await Booking.findOne({ ref }).lean() as Record<string, unknown> | null;
  if (!doc) return null;
  const depositStatus = (doc.depositStatus as 'pending' | 'submitted' | 'verified' | 'not_required') ?? 'pending';
  const depositAmount = (doc.depositAmount as number) ?? 1000;
  const balanceStatus = (doc.balanceStatus as 'unpaid' | 'paid') ?? 'unpaid';
  const totalAmount = (doc.tirePrice as number) * (doc.quantity as number);
  return {
    ref: doc.ref as string,
    tireName: doc.tireName as string,
    tirePrice: doc.tirePrice as number,
    quantity: doc.quantity as number,
    totalAmount,
    depositAmount,
    depositSlipUrl: (doc.depositSlipUrl as string) ?? '',
    depositStatus,
    depositVerifyNote: (doc.depositVerifyNote as string) ?? '',
    remainingAmount: balanceStatus === 'paid' ? 0 : totalAmount - (depositStatus === 'verified' ? depositAmount : 0),
    balanceStatus,
    balanceVerifyNote: (doc.balanceVerifyNote as string) ?? '',
  };
}

export type OrderBooking = {
  orderRef: string;
  items: { ref: string; tireName: string; quantity: number; tirePrice: number; totalAmount: number }[];
  totalAmount: number;
  depositAmount: number;
  depositStatus: 'pending' | 'submitted' | 'verified' | 'not_required';
  depositVerifyNote: string;
  depositSlipUrl: string;
  remainingAmount: number;
  balanceStatus: 'unpaid' | 'paid';
  balanceVerifyNote: string;
  balanceSlipUrl: string;
};

// รวมทุก Booking (ต่อรุ่นยาง) ในตะกร้าเดียวกันเป็น "ออเดอร์เดียว" — ยอดมัดจำ/ยอดคงเหลือรวม ชำระทีเดียวจบ
export async function getBookingsByOrderRef(orderRef: string): Promise<OrderBooking | null> {
  await connectDB();
  const { Booking } = await import('@/models/Booking');
  const docs = await Booking.find({ orderRef }).lean() as Record<string, unknown>[];
  if (docs.length === 0) return null;

  const items = docs.map((d) => {
    const tirePrice = d.tirePrice as number;
    const quantity = d.quantity as number;
    return {
      ref: d.ref as string,
      tireName: d.tireName as string,
      quantity,
      tirePrice,
      totalAmount: tirePrice * quantity,
    };
  });
  const totalAmount = items.reduce((sum, i) => sum + i.totalAmount, 0);

  const needsDepositDocs = docs.filter((d) => (d.depositStatus as string) !== 'not_required');
  const depositAmount = needsDepositDocs.reduce((sum, d) => sum + ((d.depositAmount as number) ?? 0), 0);
  const depositStatus: OrderBooking['depositStatus'] =
    needsDepositDocs.length === 0 ? 'not_required'
    : needsDepositDocs.some((d) => d.depositStatus === 'pending') ? 'pending'
    : needsDepositDocs.some((d) => d.depositStatus === 'submitted') ? 'submitted'
    : 'verified';
  const depositVerifyNote = (needsDepositDocs[0]?.depositVerifyNote as string) ?? '';
  const depositSlipUrl = (needsDepositDocs[0]?.depositSlipUrl as string) ?? '';

  const balanceStatus: 'unpaid' | 'paid' = docs.every((d) => d.balanceStatus === 'paid') ? 'paid' : 'unpaid';
  const balanceVerifyNote = (docs.find((d) => d.balanceVerifyNote)?.balanceVerifyNote as string) ?? '';
  const balanceSlipUrl = (docs.find((d) => d.balanceSlipUrl)?.balanceSlipUrl as string) ?? '';

  const remainingAmount = balanceStatus === 'paid' ? 0 : items.reduce((sum, item, i) => {
    const d = docs[i];
    const itemDepositAmount = d.depositStatus === 'verified' ? (d.depositAmount as number) : 0;
    return sum + (item.totalAmount - itemDepositAmount);
  }, 0);

  return {
    orderRef,
    items,
    totalAmount,
    depositAmount,
    depositStatus,
    depositVerifyNote,
    depositSlipUrl,
    remainingAmount,
    balanceStatus,
    balanceVerifyNote,
    balanceSlipUrl,
  };
}

export type PaymentReviewRow = {
  ref: string;
  name: string;
  phone: string;
  tireName: string;
  totalAmount: number;
  depositAmount: number;
  depositSlipUrl: string;
  depositStatus: 'pending' | 'submitted' | 'verified' | 'not_required';
  depositVerifyNote: string;
  depositRefunded: boolean;
  remainingAmount: number;
  balanceStatus: 'unpaid' | 'paid';
  balancePaymentMethod: 'cash' | 'transfer' | 'credit_card' | '';
  balanceReceivedAmount: number | null;
  balanceSlipUrl: string;
  balanceVerifyNote: string;
  createdAt: string;
};

export async function getBookingsForPaymentReview(limit = 50): Promise<PaymentReviewRow[]> {
  await connectDB();
  const { Booking } = await import('@/models/Booking');
  const docs = await Booking.find({ status: { $ne: 'cancelled' } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const statusOrder: Record<string, number> = { submitted: 0, pending: 1, verified: 2, not_required: 3 };

  return docs
    .map((d) => {
      const totalAmount = (d.tirePrice as number) * (d.quantity as number);
      const depositAmount = (d.depositAmount as number) ?? 1000;
      const depositStatus = (d.depositStatus as 'pending' | 'submitted' | 'verified' | 'not_required') ?? 'pending';
      const balanceStatus = (d.balanceStatus as 'unpaid' | 'paid') ?? 'unpaid';

      return {
        ref: d.ref as string,
        name: d.name as string,
        phone: d.phone as string,
        tireName: d.tireName as string,
        totalAmount,
        depositAmount,
        depositSlipUrl: (d.depositSlipUrl as string) ?? '',
        depositStatus,
        depositVerifyNote: (d.depositVerifyNote as string) ?? '',
        depositRefunded: (d.depositRefunded as boolean) ?? false,
        remainingAmount: balanceStatus === 'paid' ? 0 : totalAmount - (depositStatus === 'verified' ? depositAmount : 0),
        balanceStatus,
        balancePaymentMethod: (d.balancePaymentMethod as 'cash' | 'transfer' | 'credit_card' | '') ?? '',
        balanceReceivedAmount: (d.balanceReceivedAmount as number) ?? null,
        balanceSlipUrl: (d.balanceSlipUrl as string) ?? '',
        balanceVerifyNote: (d.balanceVerifyNote as string) ?? '',
        createdAt: (d.createdAt as Date).toISOString(),
      };
    })
    .sort((a, b) => (statusOrder[a.depositStatus] ?? 1) - (statusOrder[b.depositStatus] ?? 1));
}
