import { verifySignature, replyMessage, buildQuoteFlexMessage } from '@/lib/line';
import { processMessage } from '@/lib/chatbot';
import connectDB from '@/lib/mongodb';
import { Booking } from '@/models/Booking';

type LineEvent = {
  type: string;
  replyToken: string;
  source: { userId: string; type: string };
  message?: { type: string; text: string };
};

const REF_PATTERN = /^NTY-\d{8}-\d{4}$/i;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('x-line-signature') ?? '';

  if (!verifySignature(body, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const { events } = JSON.parse(body) as { events: LineEvent[] };

  for (const event of events) {
    if (event.type === 'message' && event.message?.type === 'text') {
      await handleTextMessage(event);
    } else if (event.type === 'follow') {
      await handleFollow(event);
    }
  }

  return Response.json({ status: 'ok' });
}

async function handleTextMessage(event: LineEvent) {
  const text = event.message!.text.trim();
  const userId = event.source.userId;

  // หมายเลขการจอง — เช็ค DB แล้วส่งใบเสนอราคา
  if (REF_PATTERN.test(text)) {
    await connectDB();
    const ref = text.toUpperCase();
    const booking = await Booking.findOne({ ref });

    if (!booking) {
      await replyMessage(event.replyToken, [{
        type: 'text',
        text: `ไม่พบหมายเลขการจอง "${ref}"\nกรุณาตรวจสอบอีกครั้ง หรือติดต่อทีมงานค่ะ`,
      }]);
      return;
    }

    await Booking.updateOne({ ref }, { lineUserId: userId, status: 'confirmed' });
    await replyMessage(event.replyToken, [
      buildQuoteFlexMessage({ ...booking.toObject(), lineUserId: userId }),
    ]);
    return;
  }

  // ข้อความทั่วไป → chatbot ตอบ
  const messages = processMessage(text);
  await replyMessage(event.replyToken, messages);
}

async function handleFollow(event: LineEvent) {
  const messages = processMessage('สวัสดี');
  await replyMessage(event.replyToken, messages);
}
