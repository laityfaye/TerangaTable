import { ogImageContentType, ogImageSize, renderOgImage } from '@/lib/og-image';

export const runtime = 'edge';
export const alt = 'TérangaTable — Caisse, menu digital & marketplace pour restaurants africains';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage('Caisse, menu digital & marketplace pour restaurants africains');
}
