import Image from 'next/image';

interface Props {
  heroImageUrl: string;
  restaurantName: string;
}

export default function GalerieSection({ heroImageUrl, restaurantName }: Props) {
  const images = [heroImageUrl, heroImageUrl, heroImageUrl].slice(0, 3);

  return (
    <section className="py-20 px-4 sm:px-6 bg-[#1A1A18]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-[--color-primary]" />
            <span className="text-sm uppercase tracking-widest font-semibold text-[--color-primary]">
              Galerie
            </span>
            <div className="h-px w-12 bg-[--color-primary]" />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            L&apos;ambiance {restaurantName}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {images.map((src, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-lg ${
                i === 0 ? 'sm:row-span-2 aspect-[3/4] sm:aspect-auto sm:h-full' : 'aspect-[4/3]'
              }`}
            >
              <Image
                src={src}
                alt={`${restaurantName} — photo ${i + 1}`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
