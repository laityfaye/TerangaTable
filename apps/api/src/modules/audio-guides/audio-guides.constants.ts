export interface AudioGuideDefinition {
  key: string;
  label: string;
  path: string | null;
}

// Le catalogue des guides audio de la plateforme — une entrée par écran qui
// embarque le widget <CityAudioGuide>/<LandingAudioGuide>/<RoleAudioGuide>.
// `path` est nul pour les guides dashboard (pas une URL publique unique).
export const AUDIO_GUIDE_KEYS: readonly AudioGuideDefinition[] = [
  { key: 'landing', label: "Page d'accueil", path: '/' },
  { key: 'decouvrir', label: 'Marketplace — Découvrir (toutes les villes)', path: '/decouvrir' },
  { key: 'dashboard-owner', label: 'Dashboard — Propriétaire', path: null },
  { key: 'dashboard-manager', label: 'Dashboard — Manager', path: null },
  { key: 'dashboard-serveur', label: 'Dashboard — Serveur', path: null },
  { key: 'dashboard-caissier', label: 'Dashboard — Caissier', path: null },
  { key: 'dashboard-cuisinier', label: 'Dashboard — Cuisinier', path: null },
  { key: 'dashboard-livreur', label: 'Dashboard — Livreur', path: null },
  { key: 'dashboard-default', label: 'Dashboard — Rôle par défaut', path: null },
] as const;

export const AUDIO_GUIDE_KEY_SET = new Set(AUDIO_GUIDE_KEYS.map((k) => k.key));
