import connectDB from './mongodb';
import { TimeCorrection } from '@/models/TimeCorrection';

export type TimeCorrectionRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  attendanceId: string;
  date: string;
  originalCheckIn: string;
  originalCheckOut: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string;
  reviewNote: string;
  reviewedAt: string;
  createdAt: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(d: any): TimeCorrectionRow {
  return {
    id:                String(d._id),
    employeeId:        String(d.employeeId),
    employeeName:      d.employeeName ?? '',
    attendanceId:      String(d.attendanceId),
    date:              d.date instanceof Date ? d.date.toISOString().slice(0, 10) : String(d.date ?? '').slice(0, 10),
    originalCheckIn:   d.originalCheckIn ?? '',
    originalCheckOut:  d.originalCheckOut ?? '',
    requestedCheckIn:  d.requestedCheckIn ?? '',
    requestedCheckOut: d.requestedCheckOut ?? '',
    reason:            d.reason ?? '',
    status:            d.status ?? 'pending',
    reviewedBy:        d.reviewedBy ?? '',
    reviewNote:        d.reviewNote ?? '',
    reviewedAt:        d.reviewedAt ? new Date(d.reviewedAt).toISOString().slice(0, 10) : '',
    createdAt:         d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt ?? ''),
  };
}

export async function getTimeCorrectionRequests(status?: string): Promise<TimeCorrectionRow[]> {
  await connectDB();
  const filter = status && status !== 'all' ? { status } : {};
  const docs = await TimeCorrection.find(filter).sort({ createdAt: -1 }).lean();
  return docs.map(normalize);
}
