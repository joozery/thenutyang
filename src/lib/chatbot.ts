import { tires, BRANDS, type Tire } from '@/lib/tires';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thenutyang.com';
const SIZE_REGEX = /(\d{3}\/\d{2}[rR]\d{2})/;

type Intent =
  | 'search_size'
  | 'search_brand'
  | 'ask_service'
  | 'ask_promo'
  | 'ask_location'
  | 'ask_booking'
  | 'menu'
  | 'unknown';

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (SIZE_REGEX.test(t)) return 'search_size';
  if (BRANDS.some(b => t.includes(b.toLowerCase()))) return 'search_brand';
  if (['ตั้งศูนย์', 'ถ่วงล้อ', 'ปะยาง', 'ซ่อมยาง', 'บริการ', 'น้ำมัน', 'แบตเตอรี่', 'ตรวจ'].some(k => t.includes(k))) return 'ask_service';
  if (['โปร', 'ส่วนลด', 'ลด', 'แถม', 'promotion', 'ผ่อน'].some(k => t.includes(k))) return 'ask_promo';
  if (['ที่อยู่', 'อยู่ที่', 'เปิด', 'ปิด', 'เวลา', 'แผนที่', 'map', 'location'].some(k => t.includes(k))) return 'ask_location';
  if (['จอง', 'นัด', 'สถานะ', 'ใบเสนอ'].some(k => t.includes(k))) return 'ask_booking';
  if (['เมนู', 'menu', 'help', 'ช่วย', 'สวัสดี', 'hello', 'hi', 'หวัดดี', 'ทำอะไร', 'มีอะไร'].some(k => t.includes(k))) return 'menu';
  return 'unknown';
}

function qr(items: { label: string; text?: string; uri?: string }[]) {
  return {
    quickReply: {
      items: items.slice(0, 13).map(({ label, text, uri }) => ({
        type: 'action',
        action: uri
          ? { type: 'uri', label, uri }
          : { type: 'message', label, text: text ?? label },
      })),
    },
  };
}

const mainQR = qr([
  { label: '🔍 ค้นหายาง', text: 'ค้นหายาง' },
  { label: '🎉 โปรโมชั่น', text: 'โปรโมชั่น' },
  { label: '🔧 บริการ', text: 'บริการ' },
  { label: '📋 จองยาง', text: 'จองยาง' },
  { label: '📍 ที่อยู่', text: 'ที่อยู่ร้าน' },
]);

export function processMessage(text: string): object[] {
  const intent = detectIntent(text);

  switch (intent) {
    case 'search_size': {
      const match = text.match(SIZE_REGEX);
      const size = match![1].toUpperCase();
      const found = tires.filter(t => t.size === size);
      if (found.length === 0) {
        return [{
          type: 'text',
          text: `ขออภัยค่ะ ไม่พบยางขนาด ${size} ในสต็อกตอนนี้\n\nอาจสั่งได้ กรุณาสอบถามทีมงานโดยตรงค่ะ`,
          ...qr([
            { label: '📋 จองล่วงหน้า', text: 'จองยาง' },
            { label: '🏠 เมนูหลัก', text: 'เมนู' },
          ]),
        }];
      }
      return [buildTireCarousel(found, `ยางขนาด ${size}`)];
    }

    case 'search_brand': {
      const brand = BRANDS.find(b => text.toLowerCase().includes(b.toLowerCase()))!;
      const found = tires.filter(t => t.brand === brand);
      return [buildTireCarousel(found, `ยาง ${brand}`)];
    }

    case 'ask_service': {
      return [{
        type: 'flex',
        altText: 'บริการเดอะนัททายางยนต์',
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#FF4DA6',
            paddingAll: '16px',
            contents: [{ type: 'text', text: '🔧 บริการของเรา', color: '#ffffff', weight: 'bold', size: 'lg' }],
          },
          body: {
            type: 'box',
            layout: 'vertical',
            paddingAll: '16px',
            spacing: 'sm',
            contents: [
              serviceRow('เปลี่ยนยาง', 'ฟรี เมื่อซื้อยาง'),
              serviceRow('ตั้งศูนย์', 'เริ่มต้น ฿500'),
              serviceRow('ถ่วงล้อ', 'เริ่มต้น ฿200'),
              serviceRow('ปะยาง / ซ่อมยาง', 'เริ่มต้น ฿100'),
              serviceRow('เปลี่ยนน้ำมันเครื่อง', 'เริ่มต้น ฿800'),
              serviceRow('เปลี่ยนแบตเตอรี่', 'เริ่มต้น ฿1,500'),
              serviceRow('ตรวจสภาพรถ', 'ฟรี 30 รายการ'),
            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            paddingAll: '12px',
            contents: [{
              type: 'button',
              action: { type: 'uri', label: 'จองนัดบริการ', uri: `${APP_URL}/booking` },
              style: 'primary',
              color: '#FF4DA6',
              height: 'sm',
            }],
          },
        },
        ...mainQR,
      }];
    }

    case 'ask_promo': {
      return [{
        type: 'flex',
        altText: '🎉 โปรโมชั่นเดอะนัททายางยนต์',
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#FF4DA6',
            paddingAll: '16px',
            contents: [{ type: 'text', text: '🎉 โปรโมชั่น', color: '#ffffff', weight: 'bold', size: 'lg' }],
          },
          body: {
            type: 'box',
            layout: 'vertical',
            paddingAll: '16px',
            spacing: 'md',
            contents: [
              promoItem('ซื้อ 3 แถม 1', 'เฉพาะรุ่นที่ร่วมรายการ'),
              promoItem('ผ่อน 0%', 'สูงสุด 10 เดือน บัตรที่ร่วมรายการ'),
              promoItem('ตั้งศูนย์ฟรี', 'เมื่อซื้อยางครบ 4 เส้น'),
              promoItem('ตรวจสภาพรถฟรี', '30 รายการ ทุกการเปลี่ยนยาง'),
              promoItem('ยางแท้ 100%', 'รับประกันคุณภาพทุกเส้น'),
            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            paddingAll: '12px',
            contents: [{
              type: 'button',
              action: { type: 'uri', label: 'เลือกยางพร้อมรับโปร', uri: `${APP_URL}/tires` },
              style: 'primary',
              color: '#FF4DA6',
              height: 'sm',
            }],
          },
        },
        ...mainQR,
      }];
    }

    case 'ask_location': {
      return [{
        type: 'text',
        text: '📍 เดอะนัททายางยนต์\n\n🏠 ที่อยู่: [กรุณาอัปเดตที่อยู่จริง]\n\n⏰ เวลาทำการ:\nจันทร์ – อาทิตย์\n08:00 – 18:00 น.\n\n📞 โทร: [เบอร์โทรร้าน]\n\n🌐 เว็บไซต์: thenutyang.com',
        ...mainQR,
      }];
    }

    case 'ask_booking': {
      return [{
        type: 'flex',
        altText: 'วิธีจองยางออนไลน์',
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#FF4DA6',
            paddingAll: '16px',
            contents: [{ type: 'text', text: '📋 วิธีจองยางออนไลน์', color: '#ffffff', weight: 'bold' }],
          },
          body: {
            type: 'box',
            layout: 'vertical',
            paddingAll: '16px',
            spacing: 'md',
            contents: [
              stepItem('1', 'เลือกยาง', `ค้นหายางที่ต้องการบนเว็บ ${APP_URL}/tires`),
              stepItem('2', 'กรอกข้อมูล', 'ชื่อ, เบอร์, LINE ID, รุ่นรถ, วันนัด'),
              stepItem('3', 'ส่งหมายเลขมาที่นี่', 'ส่งหมายเลขการจอง เช่น NTY-20260614-0001'),
              stepItem('4', 'รับใบเสนอราคาทันที!', 'บอท reply ใบเสนอราคาพร้อมรายละเอียด'),
            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            paddingAll: '12px',
            contents: [{
              type: 'button',
              action: { type: 'uri', label: '🌐 ไปจองบนเว็บ', uri: `${APP_URL}/tires` },
              style: 'primary',
              color: '#FF4DA6',
            }],
          },
        },
        ...qr([
          { label: '🌐 เปิดเว็บ', uri: `${APP_URL}/tires` },
          { label: '🏠 เมนูหลัก', text: 'เมนู' },
        ]),
      }];
    }

    case 'menu': {
      return [{
        type: 'flex',
        altText: 'เมนูหลัก เดอะนัททายางยนต์',
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#FF4DA6',
            paddingAll: '20px',
            contents: [
              { type: 'text', text: 'เดอะนัททายางยนต์ 🔧', color: '#ffffff', weight: 'bold', size: 'lg' },
              { type: 'text', text: 'ยินดีต้อนรับค่ะ มีอะไรให้ช่วยไหมคะ?', color: '#ffe0f0', size: 'sm', margin: 'xs' },
            ],
          },
          body: {
            type: 'box',
            layout: 'vertical',
            paddingAll: '12px',
            spacing: 'xs',
            contents: [
              menuRow('🔍', 'ค้นหายางจากขนาด', 'พิมพ์ขนาด เช่น 205/55R16'),
              menuRow('🏷️', 'ค้นหาจากแบรนด์', 'Michelin, Bridgestone, Yokohama...'),
              menuRow('🔧', 'บริการและราคา', 'ตั้งศูนย์, ถ่วงล้อ, ปะยาง...'),
              menuRow('🎉', 'โปรโมชั่น', 'ซื้อ 3 แถม 1, ผ่อน 0%...'),
              menuRow('📋', 'จองยางออนไลน์', 'รับใบเสนอราคาทาง LINE'),
              menuRow('📍', 'ที่อยู่และเวลาทำการ', 'จ.-อา. 08:00-18:00 น.'),
            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            paddingAll: '12px',
            contents: [{
              type: 'button',
              action: { type: 'uri', label: 'เลือกซื้อยางออนไลน์', uri: `${APP_URL}/tires` },
              style: 'primary',
              color: '#FF4DA6',
            }],
          },
        },
        ...mainQR,
      }];
    }

    default: {
      return [{
        type: 'text',
        text: 'ขออภัยค่ะ ไม่เข้าใจข้อความนี้ 😊\n\nลองพิมพ์สิ่งที่ต้องการ เช่น\n• "205/55R16" — ค้นหายางจากขนาด\n• "Michelin" — ค้นหาจากแบรนด์\n• "โปรโมชั่น"\n• "บริการ"\n• "จองยาง"',
        ...mainQR,
      }];
    }
  }
}

function buildTireCarousel(items: Tire[], query: string): object {
  const MAX = 10;
  const list = items.slice(0, MAX);

  return {
    type: 'flex',
    altText: `${query} — พบ ${items.length} รายการ`,
    contents: {
      type: 'carousel',
      contents: list.map(tire => ({
        type: 'bubble',
        size: 'kilo',
        body: {
          type: 'box',
          layout: 'vertical',
          paddingAll: '14px',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: tire.brand, size: 'xxs', color: '#FF4DA6', weight: 'bold', flex: 1 },
                ...(tire.badge ? [{ type: 'text', text: `🏷 ${tire.badge}`, size: 'xxs', color: '#FF4DA6', align: 'end' as const, weight: 'bold' as const }] : []),
              ],
            },
            { type: 'text', text: tire.model, size: 'sm', weight: 'bold', color: '#111111', wrap: true },
            { type: 'text', text: tire.size, size: 'xs', color: '#888888' },
            { type: 'separator', margin: 'sm', color: '#f0f0f0' },
            {
              type: 'box',
              layout: 'baseline',
              margin: 'sm',
              contents: [
                { type: 'text', text: `฿${tire.price.toLocaleString()}`, size: 'xl', weight: 'bold', color: '#FF4DA6', flex: 1 },
                ...(tire.oldPrice ? [{ type: 'text', text: `฿${tire.oldPrice.toLocaleString()}`, size: 'xs', color: '#bbbbbb', decoration: 'line-through' as const }] : []),
              ],
            },
            { type: 'text', text: '/เส้น', size: 'xxs', color: '#aaaaaa' },
            {
              type: 'text',
              text: tire.inStock ? '● มีสินค้า' : '● สั่งได้',
              size: 'xxs',
              color: tire.inStock ? '#22c55e' : '#f59e0b',
              margin: 'xs',
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          paddingAll: '10px',
          spacing: 'xs',
          contents: [
            {
              type: 'button',
              action: { type: 'uri', label: 'จองเลย', uri: `${APP_URL}/booking?tireId=${tire.id}` },
              style: 'primary',
              color: '#FF4DA6',
              height: 'sm',
            },
            {
              type: 'button',
              action: { type: 'uri', label: 'ดูรายละเอียด', uri: `${APP_URL}/tires/${tire.id}` },
              style: 'link',
              height: 'sm',
            },
          ],
        },
      })),
    },
  };
}

function serviceRow(name: string, price: string) {
  return {
    type: 'box',
    layout: 'horizontal',
    paddingTop: 'sm',
    paddingBottom: 'sm',
    borderColor: '#f5f5f5',
    contents: [
      { type: 'text', text: name, size: 'sm', color: '#333333', flex: 1 },
      { type: 'text', text: price, size: 'sm', color: '#FF4DA6', weight: 'bold', align: 'end' as const },
    ],
  };
}

function promoItem(title: string, desc: string) {
  return {
    type: 'box',
    layout: 'horizontal',
    spacing: 'sm',
    contents: [
      { type: 'text', text: '✅', size: 'sm', flex: 0 },
      {
        type: 'box',
        layout: 'vertical',
        flex: 1,
        contents: [
          { type: 'text', text: title, size: 'sm', weight: 'bold', color: '#222222' },
          { type: 'text', text: desc, size: 'xs', color: '#666666' },
        ],
      },
    ],
  };
}

function stepItem(num: string, title: string, desc: string) {
  return {
    type: 'box',
    layout: 'horizontal',
    spacing: 'md',
    contents: [
      {
        type: 'box',
        layout: 'vertical',
        width: '24px',
        height: '24px',
        cornerRadius: '12px',
        backgroundColor: '#FF4DA6',
        justifyContent: 'center',
        alignItems: 'center',
        contents: [{ type: 'text', text: num, color: '#ffffff', size: 'xs', weight: 'bold', align: 'center' }],
      },
      {
        type: 'box',
        layout: 'vertical',
        flex: 1,
        contents: [
          { type: 'text', text: title, size: 'sm', weight: 'bold', color: '#222222' },
          { type: 'text', text: desc, size: 'xs', color: '#666666', wrap: true },
        ],
      },
    ],
  };
}

function menuRow(icon: string, title: string, desc: string) {
  return {
    type: 'box',
    layout: 'horizontal',
    paddingAll: '10px',
    backgroundColor: '#fafafa',
    cornerRadius: '8px',
    spacing: 'md',
    margin: 'xs',
    contents: [
      { type: 'text', text: icon, size: 'lg', flex: 0 },
      {
        type: 'box',
        layout: 'vertical',
        flex: 1,
        contents: [
          { type: 'text', text: title, size: 'sm', weight: 'bold', color: '#222222' },
          { type: 'text', text: desc, size: 'xs', color: '#888888' },
        ],
      },
    ],
  };
}
