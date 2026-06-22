const DIGIT_TH = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const PLACE_TH = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

function digitsToThaiText(digits: string): string {
  let result = '';
  const len = digits.length;

  for (let i = 0; i < len; i++) {
    const digit = Number(digits[i]);
    const place = (len - i - 1) % 7; // 0=หน่วย, 1=สิบ, ... 6=ล้าน
    if (digit === 0) continue;

    if (place === 1 && digit === 1) {
      result += 'สิบ';
    } else if (place === 1 && digit === 2) {
      result += 'ยี่สิบ';
    } else if (place === 0 && digit === 1 && len > 1) {
      result += 'เอ็ด';
    } else {
      result += DIGIT_TH[digit] + PLACE_TH[place];
    }

    if (place === 6 && i + 1 < len) result += 'ล้าน';
  }

  return result;
}

function integerToThaiText(value: number): string {
  if (value === 0) return 'ศูนย์';

  let text = '';
  let remainder = Math.floor(value);
  const millionChunks: string[] = [];

  if (remainder === 0) return 'ศูนย์';

  while (remainder > 0) {
    millionChunks.unshift(String(remainder % 1_000_000));
    remainder = Math.floor(remainder / 1_000_000);
  }

  for (let i = 0; i < millionChunks.length; i++) {
    const chunkText = digitsToThaiText(millionChunks[i]);
    text += chunkText;
    if (i < millionChunks.length - 1) text += 'ล้าน';
  }

  return text;
}

export function numberToThaiBahtText(amount: number): string {
  if (!Number.isFinite(amount)) return '';
  const rounded = Math.round(Math.abs(amount) * 100) / 100;
  const baht = Math.floor(rounded);
  const satang = Math.round((rounded - baht) * 100);

  const bahtText = integerToThaiText(baht) + 'บาท';
  const satangText = satang > 0 ? integerToThaiText(satang) + 'สตางค์' : 'ถ้วน';

  return `${amount < 0 ? 'ลบ' : ''}${bahtText}${satangText}`;
}
