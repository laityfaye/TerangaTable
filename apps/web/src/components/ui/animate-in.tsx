'use client';

/**
 * AnimateIn — déclenche une animation "spring/ding" quand l'élément
 * entre dans le viewport (IntersectionObserver).
 *
 * Types disponibles :
 *   'up'    → surgit par le bas (défaut)
 *   'down'  → tombe par le haut
 *   'in'    → grossit depuis le centre
 *   'left'  → surgit depuis la gauche
 *   'right' → surgit depuis la droite
 *   'pop'   → pop rapide (petits éléments, icônes, badges)
 *   'fade'  → fade + léger glissement vers le haut
 */

import React, { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type AnimType = 'up' | 'down' | 'in' | 'left' | 'right' | 'pop' | 'fade';

interface Props {
  children: ReactNode;
  /** Type d'animation spring */
  type?: AnimType;
  /** Délai avant le déclenchement en ms (pour stagger manuel) */
  delay?: number;
  /** Durée de l'animation en ms (remplace la valeur par défaut) */
  duration?: number;
  /** Classe CSS supplémentaire sur le wrapper */
  className?: string;
  /** Style supplémentaire sur le wrapper */
  style?: CSSProperties;
  /** Seuil de visibilité pour déclencher (0–1, défaut 0.1) */
  threshold?: number;
  /** Marge négative sur le bas pour déclencher un peu plus tôt */
  rootMarginBottom?: string;
  /** Si true, l'animation ne se rejoue pas au 2ème passage */
  once?: boolean;
  /** Tag HTML du wrapper (défaut : div) */
  as?: 'div' | 'section' | 'article' | 'li' | 'span';
}

// ── Classes CSS pour chaque type ──────────────────────────────────────────────

const CLASS_MAP: Record<AnimType, string> = {
  up:    'anim-spring-up',
  down:  'anim-spring-down',
  in:    'anim-spring-in',
  left:  'anim-spring-left',
  right: 'anim-spring-right',
  pop:   'anim-pop',
  fade:  'anim-fade-rise',
};

// ── Composant ─────────────────────────────────────────────────────────────────

export default function AnimateIn({
  children,
  type = 'up',
  delay = 0,
  duration,
  className = '',
  style,
  threshold = 0.1,
  rootMarginBottom = '-20px',
  once = true,
  as: Tag = 'div',
}: Props) {
  // On masque via JS uniquement (pas SSR) pour éviter le flash côté serveur
  const [isClient, setIsClient] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !isClient) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(el);
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      {
        threshold,
        rootMargin: `0px 0px ${rootMarginBottom} 0px`,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isClient, threshold, rootMarginBottom, once]);

  // Avant l'hydratation JS : éléments visibles (pas de masquage SSR)
  const animClass = isClient ? (visible ? CLASS_MAP[type] : '') : '';

  const animStyle: CSSProperties = {
    ...style,
    // Masqué seulement côté client avant animation
    ...(isClient && !visible ? { opacity: 0 } : {}),
    // Délai + durée personnalisés si fournis
    ...(visible && delay ? { animationDelay: `${delay}ms` } : {}),
    ...(visible && duration ? { animationDuration: `${duration}ms` } : {}),
  };

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      className={`${animClass} ${className}`.trim()}
      style={animStyle}
    >
      {children}
    </Tag>
  );
}
