'use client';

const ITEMS = [
  'ยางแท้ 100%',
  'ติดตั้งรวดเร็ว',
  'ช่างมืออาชีพ',
  'รับประกัน 1 ปี',
  'บริการครบวงจร',
  'ราคาโปร่งใส',
  'Michelin · Bridgestone · Yokohama · Dunlop · Goodyear',
];

export function BrandTicker() {
  const repeated = [...ITEMS, ...ITEMS];

  return (
    <div className="bg-gradient-to-r from-green-950 via-green-800 to-green-950 border-y border-green-700/40 overflow-hidden py-3 select-none">
      <div className="flex animate-ticker whitespace-nowrap">
        {repeated.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-xs font-semibold text-green-100 px-8">
            {item}
            <span className="text-green-400/60 mx-2">◆</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 25s linear infinite;
        }
      `}</style>
    </div>
  );
}
