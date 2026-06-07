import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF8] px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-[#C8553D]/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🍽️</span>
        </div>
        <h1
          className="text-4xl font-bold text-[#1C1917] mb-2"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          404
        </h1>
        <p className="text-lg font-semibold text-[#1C1917] mb-3">Page introuvable</p>
        <p className="text-[#57534E] text-sm mb-8 leading-relaxed">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/decouvrir"
            className="px-6 py-2.5 rounded-full bg-[#C8553D] text-white text-sm font-semibold hover:bg-[#A33D28] transition-colors"
          >
            Découvrir les restaurants
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-full border border-[#E7E5E4] text-[#57534E] text-sm font-semibold hover:border-[#C8553D]/40 transition-colors"
          >
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
