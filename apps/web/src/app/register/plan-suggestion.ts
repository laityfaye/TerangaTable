import type { PublicPlan } from '@/hooks/use-super-admin'

// Nombre d'utilisateurs minimum requis pour chaque taille d'équipe déclarée à
// l'étape "Vos besoins" — sert à suggérer automatiquement un plan cohérent
// avec `Plan.maxUsers` plutôt que de laisser ce choix sans effet.
const TEAM_SIZE_MIN_USERS: Record<string, number> = {
  solo: 1,
  '2-5': 5,
  '6-15': 15,
  '16+': 16,
}

export function suggestPlan(teamSize: string, plans: PublicPlan[] | undefined): PublicPlan | null {
  if (!teamSize || !plans || plans.length === 0) return null
  const needed = TEAM_SIZE_MIN_USERS[teamSize] ?? 1

  const capacity = (p: PublicPlan) => (p.max_users === -1 ? Infinity : p.max_users)
  const sorted = [...plans].sort((a, b) => capacity(a) - capacity(b))

  return sorted.find((p) => capacity(p) >= needed) ?? sorted[sorted.length - 1] ?? null
}
