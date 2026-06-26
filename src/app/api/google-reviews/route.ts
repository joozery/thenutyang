import { NextResponse } from 'next/server';

export const revalidate = 3600; // cache 1 ชั่วโมง

export async function GET() {
  const apiKey  = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return NextResponse.json({ reviews: [], rating: 0, total: 0 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,reviews&key=${apiKey}&language=th&reviews_sort=newest`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    if (data.status !== 'OK') {
      console.error('[google-reviews]', data.status, data.error_message);
      return NextResponse.json({ reviews: [], rating: 0, total: 0 });
    }

    const result = data.result ?? {};
    return NextResponse.json({
      reviews: result.reviews ?? [],
      rating:  result.rating ?? 0,
      total:   result.user_ratings_total ?? 0,
    });
  } catch (e) {
    console.error('[google-reviews]', e);
    return NextResponse.json({ reviews: [], rating: 0, total: 0 });
  }
}
