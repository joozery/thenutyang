// carInfo เก็บเป็นข้อความเดียว "ทะเบียน XXX • ไมล์ XXX" — ใช้ร่วมกันทั้งฝั่ง server (sync จาก Booking) และฝั่ง client (ฟอร์มแยกช่อง)
export function parseCarInfo(carInfo: string): { licensePlate: string; mileage: string } {
  const plateMatch   = carInfo.match(/ทะเบียน\s*([^•]+)/);
  const mileageMatch = carInfo.match(/ไมล์\s*([\d,]+)/);
  return {
    licensePlate: plateMatch?.[1]?.trim() ?? '',
    mileage:      mileageMatch?.[1]?.trim() ?? '',
  };
}

export function composeCarInfo(licensePlate: string, mileage: string): string {
  const parts: string[] = [];
  if (licensePlate.trim()) parts.push(`ทะเบียน ${licensePlate.trim()}`);
  if (mileage.trim())      parts.push(`ไมล์ ${mileage.trim()}`);
  return parts.join(' • ');
}
