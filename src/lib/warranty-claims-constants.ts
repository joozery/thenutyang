export type ClaimStatus = 'customer_filed' | 'sent_to_supplier' | 'waiting_result' | 'resolved';

export const STATUS_LABEL: Record<ClaimStatus, string> = {
  customer_filed:   'รับเรื่องแล้ว',
  sent_to_supplier: 'ส่งเครมแล้ว',
  waiting_result:   'รอผล',
  resolved:         'ปิดเคส',
};

export const STATUS_COLOR: Record<ClaimStatus, string> = {
  customer_filed:   'bg-yellow-100 text-yellow-800',
  sent_to_supplier: 'bg-blue-100 text-blue-800',
  waiting_result:   'bg-orange-100 text-orange-800',
  resolved:         'bg-green-100 text-green-800',
};
