import { ImageResponse } from 'next/og';

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageContentType = 'image/png';

export function renderOgImage(subtitle: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #1A1A18 0%, #2A1F1A 55%, #A33D28 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 64,
              height: 64,
              borderRadius: 16,
              background: '#C8553D',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              color: '#FFFFFF',
              fontWeight: 700,
            }}
          >
            T
          </div>
          <div style={{ display: 'flex', fontSize: 32, color: '#D4A843', fontWeight: 600, letterSpacing: -0.5 }}>
            TérangaTable
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 56,
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: 1.15,
            maxWidth: 950,
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    { ...ogImageSize },
  );
}
