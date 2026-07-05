/** Préfixe Redis pour la déduplication des messages Twilio (idempotence webhook). */
export const WHATSAPP_MSG_DEDUPE_PREFIX = 'whatsapp:msg:';
export const WHATSAPP_MSG_DEDUPE_TTL = 86400; // 24h — largement au-delà de la fenêtre de retry Twilio

/** Nombre maximum d'itérations de la boucle tool-use avant repli gracieux. */
export const MAX_TOOL_ITERATIONS = 8;

/** Modèle Claude utilisé — cohérent avec MarketplaceService.getAiRecommendations. */
export const CLAUDE_MODEL = 'claude-sonnet-5';

/** Nombre de tours (paires user/assistant) conservés dans l'historique borné. */
export const MAX_HISTORY_TURNS = 20;
