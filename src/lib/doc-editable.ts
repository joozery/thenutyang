import type { DocType } from './documents';

// ฟังก์ชันล้วน ไม่มี import ฝั่ง server (mongoose ฯลฯ) เจตนาแยกออกมาจาก lib/documents.ts
// เพื่อให้ import จาก Client Component ได้โดยไม่ดึงทั้งโมดูล (ที่ผูก mongoose) เข้า client bundle
//
// เปิดให้แก้ไขได้ทุกประเภททุกสถานะ — ความถูกต้องของยอดที่บันทึกไปแล้ว (Income ของบิลที่ชำระแล้ว,
// สถานะใบแจ้งหนี้ที่ผูกกับใบรับชำระ) ถูก sync ให้อัตโนมัติใน updateDocument ฝั่ง server
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isDocEditable(type: DocType, status: string): boolean {
  return true;
}
