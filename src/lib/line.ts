import crypto from 'crypto';
import type { IBooking } from '@/models/Booking';

const LINE_API = 'https://api.line.me/v2/bot/message';

export function verifySignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('SHA256', process.env.LINE_CHANNEL_SECRET!)
    .update(body)
    .digest('base64');
  return hash === signature;
}

async function callLineApi(endpoint: string, payload: object) {
  const res = await fetch(`${LINE_API}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`LINE API error [${endpoint}]:`, err);
  }
}

export async function replyMessage(replyToken: string, messages: object[]) {
  await callLineApi('reply', { replyToken, messages });
}

export async function pushMessage(to: string, messages: object[]) {
  await callLineApi('push', { to, messages });
}

export function buildQuoteFlexMessage(booking: IBooking) {
  const totalPrice = booking.tirePrice * booking.quantity;
  const needsDeposit = booking.depositStatus !== 'not_required';
  const depositPaid = booking.depositStatus === 'verified';
  const remaining = depositPaid ? totalPrice - booking.depositAmount : totalPrice;

  const appointmentFormatted = new Date(booking.appointmentDate).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Bangkok',
  });

  return {
    type: 'flex',
    altText: `ใบเสนอราคา ${booking.ref} — ${booking.tireName}`,
    contents: {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#16a34a',
        paddingAll: '20px',
        paddingBottom: '18px',
        contents: [
          {
            type: 'text',
            text: 'เดอะนัททายางยนต์',
            color: '#bbf7d0',
            size: 'sm',
            weight: 'bold',
          },
          {
            type: 'text',
            text: 'ใบเสนอราคา',
            color: '#ffffff',
            size: 'xl',
            weight: 'bold',
            margin: 'sm',
          },
          {
            type: 'text',
            text: booking.ref,
            color: '#bbf7d0',
            size: 'xs',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        spacing: 'lg',
        contents: [
          // ข้อมูลลูกค้า
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'text',
                text: 'ข้อมูลลูกค้า',
                size: 'xs',
                color: '#999999',
                weight: 'bold',
              },
              infoRow('ชื่อ', booking.name),
              infoRow('เบอร์โทร', booking.phone),
              ...(booking.carModel ? [infoRow('รุ่นรถ', `${booking.carModel} ปี ${booking.carYear}`)] : []),
            ],
          },
          separator(),
          // ข้อมูลสินค้า
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'text',
                text: 'รายการสินค้า',
                size: 'xs',
                color: '#999999',
                weight: 'bold',
              },
              {
                type: 'text',
                text: booking.tireName,
                size: 'sm',
                weight: 'bold',
                color: '#222222',
                wrap: true,
              },
              infoRow('จำนวน', `${booking.quantity} เส้น`),
              infoRow('ราคาต่อเส้น', `฿${booking.tirePrice.toLocaleString()}`),
            ],
          },
          separator(),
          // ราคารวม
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'ราคารวม', size: 'sm', color: '#444444', flex: 1 },
                  { type: 'text', text: `฿${totalPrice.toLocaleString()}`, size: 'sm', weight: 'bold', color: '#16a34a', align: 'end' },
                ],
              },
              ...(needsDeposit ? [{
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: depositPaid ? 'มัดจำ (ชำระแล้ว)' : 'มัดจำที่ต้องชำระ', size: 'xs', color: '#888888', flex: 1 },
                  { type: 'text', text: `฿${booking.depositAmount.toLocaleString()}`, size: 'xs', color: '#888888', align: 'end' },
                ],
              }] : []),
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'ยอดคงเหลือชำระหน้าร้าน', size: 'xs', color: '#888888', weight: 'bold', flex: 1 },
                  { type: 'text', text: `฿${remaining.toLocaleString()}`, size: 'xs', color: '#888888', weight: 'bold', align: 'end' },
                ],
              },
            ],
          },
          separator(),
          // วันนัดหมาย
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'วันนัดหมาย', size: 'sm', color: '#444444', flex: 1 },
              { type: 'text', text: appointmentFormatted, size: 'sm', weight: 'bold', color: '#222222', align: 'end', wrap: true, flex: 2 },
            ],
          },
          ...(booking.note ? [{
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'หมายเหตุ', size: 'sm', color: '#444444', flex: 1 },
              { type: 'text', text: booking.note, size: 'sm', color: '#666666', align: 'end', wrap: true, flex: 2 },
            ],
          }] : []),
          // ราคายังไม่รวม
          {
            type: 'text',
            text: '* ราคานี้รวมค่าติดตั้ง ถ่วงล้อ และ VAT 7%',
            size: 'xxs',
            color: '#aaaaaa',
            wrap: true,
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: 'ยืนยันการจอง / ชำระมัดจำ',
              uri: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://thenutyang.com'}/booking/confirm?ref=${booking.ref}`,
            },
            style: 'primary',
            color: '#16a34a',
            height: 'md',
          },
          {
            type: 'button',
            action: {
              type: 'uri',
              label: 'สอบถามเพิ่มเติม',
              uri: `https://line.me/R/ti/p/@${process.env.LINE_OA_ID}`,
            },
            style: 'secondary',
            height: 'sm',
          },
        ],
      },
    },
  };
}

export function buildConfirmMessage(booking: IBooking) {
  const appointmentFormatted = new Date(booking.appointmentDate).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Bangkok',
  });
  return {
    type: 'text',
    text: `✅ ยืนยันการจองแล้วค่ะ!\n\nหมายเลข: ${booking.ref}\nสินค้า: ${booking.tireName}\nจำนวน: ${booking.quantity} เส้น\nวันนัดหมาย: ${appointmentFormatted}\n\nกรุณานำรถมาตามวันนัดหมายได้เลยค่ะ 🔧\nร้านเปิด จ.-อา. 08:00–18:00 น.`,
  };
}

export function buildReadyMessage(booking: IBooking) {
  return {
    type: 'text',
    text: `🔧 สินค้าพร้อมแล้วค่ะ!\n\nหมายเลข: ${booking.ref}\nสินค้า: ${booking.tireName}\n\nสามารถนำรถมาเข้ารับการติดตั้งได้เลยนะคะ\nร้านเปิด จ.-อา. 08:00–18:00 น.\n\nขอบคุณที่ใช้บริการเดอะนัททายางยนต์ค่ะ 🙏`,
  };
}

export function buildCancelMessage(booking: IBooking) {
  return {
    type: 'text',
    text: `❌ ขออภัยค่ะ\n\nการจองหมายเลข ${booking.ref} ถูกยกเลิกแล้ว\n\nหากต้องการสอบถามเพิ่มเติมหรือจองใหม่ กรุณาติดต่อทีมงานได้เลยค่ะ`,
  };
}

function infoRow(label: string, value: string) {
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: label, size: 'sm', color: '#888888', flex: 2 },
      { type: 'text', text: value, size: 'sm', color: '#333333', align: 'end', flex: 3, wrap: true },
    ],
  };
}

function separator() {
  return { type: 'separator', margin: 'none', color: '#f0f0f0' };
}
