export type Tire = {
  id: string;
  brand: string;
  model: string;
  size: string;
  rimSize: number;
  price: number;
  oldPrice?: number;
  badge?: string;
  image: string;
  inStock: boolean;
  category: 'touring' | 'sport' | 'eco' | 'suv' | 'allseason';
  specs: { load: string; speed: string; type: string };
};

export const BRAND_LOGOS: Record<string, string> = {
  MICHELIN: '/brand/michelin-7-logo-svgrepo-com.svg',
  BRIDGESTONE: '/brand/bridgestone-26989.svg',
  YOKOHAMA: '/brand/yokohama-logo.svg',
  DUNLOP: '/brand/dunlop-sport.svg',
  GOODYEAR: '/brand/goodyear-tire-1.svg',
  CONTINENTAL: '/brand/continental-2-1.svg',
  PIRELLI: '/brand/pirelli-2.svg',
};

export const BRANDS = Object.keys(BRAND_LOGOS);
export const RIM_SIZES = [15, 16, 17, 18, 19];
export const CATEGORIES: Record<string, string> = {
  touring: 'ทั่วไป',
  eco: 'ประหยัดพลังงาน',
  sport: 'สปอร์ต',
  suv: 'SUV/PPV',
  allseason: 'ออลซีซั่น',
};

export const tires: Tire[] = [
  { id: '1',  brand: 'MICHELIN',     model: 'Primacy 4+',                 size: '195/65R15',  rimSize: 15, price: 3290, oldPrice: 3900, badge: 'ขายดี',    image: '/yang.png', inStock: true,  category: 'touring',   specs: { load: '91', speed: 'V', type: 'ยางทั่วไป' } },
  { id: '2',  brand: 'MICHELIN',     model: 'Primacy 4',                  size: '205/55R16',  rimSize: 16, price: 3590, oldPrice: 4200, badge: 'ขายดี',    image: '/yang.png', inStock: true,  category: 'touring',   specs: { load: '91', speed: 'V', type: 'ยางทั่วไป' } },
  { id: '3',  brand: 'MICHELIN',     model: 'Pilot Sport 4',              size: '225/45R17',  rimSize: 17, price: 5290, oldPrice: 6200,                    image: '/yang.png', inStock: true,  category: 'sport',     specs: { load: '91', speed: 'Y', type: 'ยางสปอร์ต' } },
  { id: '4',  brand: 'MICHELIN',     model: 'CrossClimate 2',             size: '205/55R16',  rimSize: 16, price: 4290, oldPrice: 5000, badge: 'ออลซีซั่น', image: '/yang.png', inStock: true,  category: 'allseason', specs: { load: '91', speed: 'V', type: 'ยางออลซีซั่น' } },
  { id: '5',  brand: 'BRIDGESTONE',  model: 'Turanza T005A',              size: '195/65R15',  rimSize: 15, price: 2950, oldPrice: 3600,                    image: '/yang.png', inStock: true,  category: 'touring',   specs: { load: '91', speed: 'V', type: 'ยางทั่วไป' } },
  { id: '6',  brand: 'BRIDGESTONE',  model: 'Turanza T005A',              size: '205/55R16',  rimSize: 16, price: 3250, oldPrice: 4000,                    image: '/yang.png', inStock: true,  category: 'touring',   specs: { load: '91', speed: 'V', type: 'ยางทั่วไป' } },
  { id: '7',  brand: 'BRIDGESTONE',  model: 'Potenza Sport',              size: '225/45R17',  rimSize: 17, price: 4890, oldPrice: 5800, badge: 'ลด 15%',   image: '/yang.png', inStock: true,  category: 'sport',     specs: { load: '91', speed: 'Y', type: 'ยางสปอร์ต' } },
  { id: '8',  brand: 'BRIDGESTONE',  model: 'Alenza 001',                 size: '235/55R18',  rimSize: 18, price: 5990, oldPrice: 6800, badge: 'SUV',       image: '/yang.png', inStock: true,  category: 'suv',       specs: { load: '100', speed: 'V', type: 'ยาง SUV' } },
  { id: '9',  brand: 'YOKOHAMA',     model: 'BluEarth-GT AE51',           size: '195/65R15',  rimSize: 15, price: 2590, oldPrice: 3100,                    image: '/yang.png', inStock: true,  category: 'eco',       specs: { load: '91', speed: 'V', type: 'ยางประหยัดพลังงาน' } },
  { id: '10', brand: 'YOKOHAMA',     model: 'BluEarth-GT AE51',           size: '205/55R16',  rimSize: 16, price: 2850, oldPrice: 3500,                    image: '/yang.png', inStock: true,  category: 'eco',       specs: { load: '91', speed: 'V', type: 'ยางประหยัดพลังงาน' } },
  { id: '11', brand: 'YOKOHAMA',     model: 'Advan Sport V105',           size: '235/40R18',  rimSize: 18, price: 5890, oldPrice: 6900,                    image: '/yang.png', inStock: false, category: 'sport',     specs: { load: '91', speed: 'Y', type: 'ยางสปอร์ต' } },
  { id: '12', brand: 'YOKOHAMA',     model: 'Geolandar CV G058',          size: '225/65R17',  rimSize: 17, price: 4190, oldPrice: 4900, badge: 'SUV',       image: '/yang.png', inStock: true,  category: 'suv',       specs: { load: '102', speed: 'H', type: 'ยาง SUV' } },
  { id: '13', brand: 'DUNLOP',       model: 'SP Sport LM705',             size: '195/65R15',  rimSize: 15, price: 2390, oldPrice: 2900, badge: 'ลด 17%',   image: '/yang.png', inStock: true,  category: 'touring',   specs: { load: '91', speed: 'V', type: 'ยางทั่วไป' } },
  { id: '14', brand: 'DUNLOP',       model: 'SP Sport LM705',             size: '205/55R16',  rimSize: 16, price: 2690, oldPrice: 3400, badge: 'ลด 15%',   image: '/yang.png', inStock: true,  category: 'touring',   specs: { load: '91', speed: 'V', type: 'ยางทั่วไป' } },
  { id: '15', brand: 'DUNLOP',       model: 'SP Sport Maxx 060+',         size: '225/45R17',  rimSize: 17, price: 3890, oldPrice: 4500,                    image: '/yang.png', inStock: true,  category: 'sport',     specs: { load: '91', speed: 'W', type: 'ยางสปอร์ต' } },
  { id: '16', brand: 'GOODYEAR',     model: 'EfficientGrip Performance 2', size: '195/65R15', rimSize: 15, price: 2790, oldPrice: 3300,                    image: '/yang.png', inStock: true,  category: 'eco',       specs: { load: '91', speed: 'V', type: 'ยางประหยัดพลังงาน' } },
  { id: '17', brand: 'GOODYEAR',     model: 'Eagle F1 Asymmetric 6',      size: '225/45R17',  rimSize: 17, price: 4690, oldPrice: 5500,                    image: '/yang.png', inStock: true,  category: 'sport',     specs: { load: '91', speed: 'Y', type: 'ยางสปอร์ต' } },
  { id: '18', brand: 'CONTINENTAL',  model: 'PremiumContact 7',           size: '205/55R16',  rimSize: 16, price: 3790, oldPrice: 4400,                    image: '/yang.png', inStock: true,  category: 'touring',   specs: { load: '91', speed: 'V', type: 'ยางทั่วไป' } },
  { id: '19', brand: 'CONTINENTAL',  model: 'SportContact 7',             size: '245/40R18',  rimSize: 18, price: 6890, oldPrice: 7900,                    image: '/yang.png', inStock: true,  category: 'sport',     specs: { load: '97', speed: 'Y', type: 'ยางสปอร์ต' } },
  { id: '20', brand: 'PIRELLI',      model: 'Cinturato P7',               size: '205/55R16',  rimSize: 16, price: 3990, oldPrice: 4700,                    image: '/yang.png', inStock: true,  category: 'touring',   specs: { load: '91', speed: 'V', type: 'ยางทั่วไป' } },
  { id: '21', brand: 'PIRELLI',      model: 'P Zero',                     size: '245/40R18',  rimSize: 18, price: 7890, oldPrice: 9000, badge: 'พรีเมียม', image: '/yang.png', inStock: true,  category: 'sport',     specs: { load: '97', speed: 'Y', type: 'ยางสปอร์ต' } },
  { id: '22', brand: 'MICHELIN',     model: 'Primacy SUV+',               size: '235/60R18',  rimSize: 18, price: 5590, oldPrice: 6500, badge: 'SUV',       image: '/yang.png', inStock: true,  category: 'suv',       specs: { load: '103', speed: 'V', type: 'ยาง SUV' } },
  { id: '23', brand: 'BRIDGESTONE',  model: 'Ecopia EP300',               size: '185/65R15',  rimSize: 15, price: 2490, oldPrice: 2900,                    image: '/yang.png', inStock: true,  category: 'eco',       specs: { load: '88', speed: 'V', type: 'ยางประหยัดพลังงาน' } },
  { id: '24', brand: 'YOKOHAMA',     model: 'BluEarth-XT AE61',           size: '225/60R17',  rimSize: 17, price: 3690, oldPrice: 4200,                    image: '/yang.png', inStock: true,  category: 'suv',       specs: { load: '99', speed: 'V', type: 'ยาง SUV' } },
];

export function getTireById(id: string): Tire | undefined {
  return tires.find(t => t.id === id);
}

export function filterTires(params: { brand?: string; rimSize?: number; category?: string }): Tire[] {
  return tires.filter(t => {
    if (params.brand && t.brand !== params.brand) return false;
    if (params.rimSize && t.rimSize !== params.rimSize) return false;
    if (params.category && t.category !== params.category) return false;
    return true;
  });
}
