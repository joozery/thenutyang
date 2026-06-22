import { getPopularProducts } from "@/lib/products";
import { PopularTiresTabs, type PopularTab } from "./popular-tires-tabs";

export async function PopularTires() {
  const [popular, rim15, rim16, rim17, rim18plus] = await Promise.all([
    getPopularProducts(4),
    getPopularProducts(4, { rimSize: 15 }),
    getPopularProducts(4, { rimSize: 16 }),
    getPopularProducts(4, { rimSize: 17 }),
    getPopularProducts(4, { minRimSize: 18 }),
  ]);

  const tabs: PopularTab[] = [
    { key: "popular", label: "ยอดนิยม", products: popular },
    { key: "15", label: "ขอบ 15 นิ้ว", products: rim15 },
    { key: "16", label: "ขอบ 16 นิ้ว", products: rim16 },
    { key: "17", label: "ขอบ 17 นิ้ว", products: rim17 },
    { key: "18+", label: "ขอบ 18 นิ้วขึ้นไป", products: rim18plus },
  ];

  return (
    <section className="w-full py-16 bg-white">
      <div className="container mx-auto px-4 md:px-8">
        <PopularTiresTabs tabs={tabs} />
      </div>
    </section>
  );
}
