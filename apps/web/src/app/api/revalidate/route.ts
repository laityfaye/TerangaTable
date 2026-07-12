import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

// Appelé par l'API (website.service.ts) juste après un save des réglages
// Apparence, pour vider le Data Cache / ISR de Next.js sans attendre le TTL
// de 300s — sinon le site public (et l'iframe de preview du dashboard) sert
// l'ancienne couleur jusqu'à expiration du cache.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-revalidate-secret');
  if (!secret || secret !== process.env['REVALIDATE_SECRET']) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const { slug } = (await req.json().catch(() => ({}))) as { slug?: string };
  if (!slug) {
    return NextResponse.json({ message: 'Missing slug' }, { status: 400 });
  }

  revalidateTag(`vitrine:${slug}`);
  revalidatePath(`/${slug}`, 'layout');

  return NextResponse.json({ revalidated: true, slug });
}
