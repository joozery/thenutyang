export type CarInfoParts = {
  carBrand?: string;
  carModel?: string;
  carColor?: string;
  licensePlate?: string;
  mileage?: string;
  chassisNo?: string;
};

export function parseCarInfo(carInfo: string): Required<Record<keyof CarInfoParts, string>> {
  const brandMatch   = carInfo.match(/ยี่ห้อ\s*([^•]+)/);
  const modelMatch   = carInfo.match(/รุ่น\s*([^•]+)/);
  const colorMatch   = carInfo.match(/สี\s*([^•]+)/);
  const plateMatch   = carInfo.match(/ทะเบียน\s*([^•]+)/);
  const mileageMatch = carInfo.match(/ไมล์\s*([^•]+)/);
  const chassisMatch = carInfo.match(/เลขตัวถัง\s*([^•]+)/);
  return {
    carBrand:     brandMatch?.[1]?.trim()   ?? '',
    carModel:     modelMatch?.[1]?.trim()   ?? '',
    carColor:     colorMatch?.[1]?.trim()   ?? '',
    licensePlate: plateMatch?.[1]?.trim()   ?? '',
    mileage:      mileageMatch?.[1]?.trim() ?? '',
    chassisNo:    chassisMatch?.[1]?.trim() ?? '',
  };
}

export function composeCarInfo(parts: CarInfoParts): string {
  const { carBrand = '', carModel = '', carColor = '', licensePlate = '', mileage = '', chassisNo = '' } = parts;
  const segments: string[] = [];
  if (carBrand.trim())     segments.push(`ยี่ห้อ ${carBrand.trim()}`);
  if (carModel.trim())     segments.push(`รุ่น ${carModel.trim()}`);
  if (carColor.trim())     segments.push(`สี ${carColor.trim()}`);
  if (licensePlate.trim()) segments.push(`ทะเบียน ${licensePlate.trim()}`);
  if (mileage.trim())      segments.push(`ไมล์ ${mileage.trim()}`);
  if (chassisNo.trim())    segments.push(`เลขตัวถัง ${chassisNo.trim()}`);
  return segments.join(' • ');
}
