const SLIP2GO_BASE_URL = 'https://connect.slip2go.com/api';

type Slip2GoData = {
  referenceId?: string;
  decode?: string;
  transRef?: string;
  dateTime?: string;
  amount?: number;
};

type Slip2GoResponse = {
  code: string;
  message: string;
  data?: Slip2GoData;
};

export type SlipVerificationResult = {
  verified: boolean;
  reason: string;
  transRef?: string;
};

// รหัสตอบกลับจาก Slip2Go: https://slip2go.com (ดู API Documentation)
const REASON_BY_CODE: Record<string, string> = {
  '200401': 'บัญชีผู้รับไม่ตรงกับร้าน',
  '200402': 'ยอดโอนไม่ตรงกับยอดมัดจำที่ต้องชำระ',
  '200403': 'วันที่โอนไม่ตรงเงื่อนไข',
  '200404': 'ไม่พบสลิปนี้ในระบบธนาคาร',
  '200500': 'ตรวจพบว่ารูปนี้อาจไม่ใช่สลิปโอนเงินจริง กรุณาอัปโหลดสลิปจากธนาคารหรือแอปธนาคารโดยตรง',
  '200501': 'สลิปนี้ถูกใช้ตรวจสอบไปแล้ว (สลิปซ้ำ)',
  '400001': 'ไม่พบ QR Code ในรูปสลิป กรุณาอัปโหลดรูปสลิปที่ชัดเจน',
  '400002': 'ไฟล์รูปไม่ถูกต้อง',
  '401004': 'แพ็กเกจ Slip2Go หมดอายุ — รอแอดมินตรวจสอบเอง',
  '401005': 'โควต้าตรวจสลิปไม่พอ — รอแอดมินตรวจสอบเอง',
  '401006': 'เครดิตตรวจสลิปไม่พอ — รอแอดมินตรวจสอบเอง',
  '401007': 'IP ไม่ได้รับอนุญาตจาก Slip2Go — รอแอดมินตรวจสอบเอง',
};

export async function verifySlip(
  fileBuffer: Buffer,
  fileName: string,
  fileType: string,
  expectedAmount: number
): Promise<SlipVerificationResult> {
  const secret = process.env.SLIP2GO_SECRET_KEY;
  if (!secret) {
    return { verified: false, reason: 'ยังไม่ได้ตั้งค่า Slip2Go API key — รอแอดมินตรวจสอบเอง' };
  }

  try {
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(fileBuffer)], { type: fileType }), fileName);
    form.append(
      'payload',
      JSON.stringify({
        checkDuplicate: true,
        checkAmount: { type: 'eq', amount: expectedAmount },
      })
    );

    const res = await fetch(`${SLIP2GO_BASE_URL}/verify-slip/qr-image/info`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
      body: form,
    });

    const json: Slip2GoResponse = await res.json();

    if (json.code === '200000' || json.code === '200200') {
      return { verified: true, reason: 'ตรวจสอบสลิปสำเร็จ', transRef: json.data?.transRef };
    }

    return { verified: false, reason: REASON_BY_CODE[json.code] ?? `ตรวจสอบไม่สำเร็จ (${json.code}: ${json.message})` };
  } catch (err) {
    console.error('[verifySlip]', err);
    return { verified: false, reason: 'เชื่อมต่อ Slip2Go ไม่สำเร็จ — รอแอดมินตรวจสอบเอง' };
  }
}
