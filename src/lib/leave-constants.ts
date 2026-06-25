// Pure constants — ไม่ import mongoose ให้ Client Component ใช้ได้
import type { LeaveType } from '@/models/LeaveRequest';

export const LEAVE_LABELS: Record<LeaveType, string> = {
  sick:      'ลาป่วย',
  vacation:  'ลาพักร้อน',
  personal:  'ลากิจ',
  maternity: 'ลาคลอดบุตร',
  military:  'ลารับราชการทหาร',
  other:     'อื่นๆ',
};

export const LEAVE_QUOTA: Record<LeaveType, { quota: number; deductPay: boolean }> = {
  sick:      { quota: 30,  deductPay: false },
  vacation:  { quota: 6,   deductPay: false },
  personal:  { quota: 7,   deductPay: false },
  maternity: { quota: 98,  deductPay: false },
  military:  { quota: 60,  deductPay: false },
  other:     { quota: 0,   deductPay: true  },
};
