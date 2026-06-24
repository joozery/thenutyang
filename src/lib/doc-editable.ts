import type { DocType } from './documents';

// ฟังก์ชันล้วน ไม่มี import ฝั่ง server (mongoose ฯลฯ) เจตนาแยกออกมาจาก lib/documents.ts
// เพื่อให้ import จาก Client Component ได้โดยไม่ดึงทั้งโมดูล (ที่ผูก mongoose) เข้า client bundle
//
// แก้ไขได้เฉพาะตอนยังไม่ถูกใช้ไปคำนวณที่อื่นแบบตายตัวแล้ว — invoice/billing_note ที่ "paid" แล้ว
// ออก Income/ใบเสร็จอัตโนมัติไปแล้ว ถ้าแก้ยอดตรงนี้จะไม่ตรงกับที่บันทึกไปแล้ว ต้องออกใบลดหนี้แทน
// payment_note ไม่ให้แก้เลยเพราะเป็นบันทึกประวัติการรับเงินแต่ละครั้ง quote/credit_note แก้ได้จนกว่าจะถึงสถานะปิดท้าย
export function isDocEditable(type: DocType, status: string): boolean {
  switch (type) {
    case 'invoice':      return status === 'unpaid';
    case 'billing_note': return status === 'unpaid' || status === 'partial';
    case 'quote':        return status === 'pending_approval';
    case 'credit_note':  return status !== 'cancelled';
    case 'payment_note': return false;
    default:             return false;
  }
}
