// Pure functions — ไม่ import mongoose ให้ Client Component ใช้ได้

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function calcLateMinutes(shiftStart: string, checkIn: string): number {
  if (!shiftStart || !checkIn) return 0;
  return Math.max(0, timeToMinutes(checkIn) - timeToMinutes(shiftStart));
}

export function calcOTMinutes(shiftEnd: string, checkOut: string): number {
  if (!shiftEnd || !checkOut) return 0;
  return Math.max(0, timeToMinutes(checkOut) - timeToMinutes(shiftEnd));
}

export function minutesToBilledHours(minutes: number): number {
  if (minutes <= 10) return 0;
  return Math.ceil((minutes - 10) / 60);
}

export function calcLateDeduct(lateMinutes: number, ratePerHour: number): number {
  return minutesToBilledHours(lateMinutes) * ratePerHour;
}

export function calcOTPay(otMinutes: number, ratePerHour: number): number {
  return minutesToBilledHours(otMinutes) * ratePerHour;
}

export function calcParttimeOTPay(otMinutes: number, hourlyRate: number): number {
  return minutesToBilledHours(otMinutes) * hourlyRate * 1.5;
}
