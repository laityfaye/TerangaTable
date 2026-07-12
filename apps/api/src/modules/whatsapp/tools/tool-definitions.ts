import type Anthropic from '@anthropic-ai/sdk';

/**
 * Toujours envoyés en bloc complet (pas de sous-ensemble par phase) pour ne
 * jamais invalider le cache de prompt des définitions d'outils. Les
 * préconditions (ex: pas de add_to_cart avant confirm_restaurant) sont
 * vérifiées côté serveur dans whatsapp.service.ts, pas ici.
 */
export const WHATSAPP_TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_restaurants',
    description:
      "Cherche des restaurants sur la plateforme par nom, ville ou type de cuisine. À utiliser tant que le restaurant n'est pas confirmé (confirm_restaurant).",
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nom du restaurant, plat recherché, ou ville (ex: "Djonick", "thieboudienne à Thiès")' },
        city_slug: { type: 'string', description: 'Slug de ville si connu (ex: "thies", "dakar")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'confirm_restaurant',
    description:
      "Verrouille le restaurant sur lequel porte la commande, une fois que le client a confirmé lequel il veut. N'appeler qu'après avoir présenté un résultat de search_restaurants et obtenu une confirmation explicite du client — ne jamais deviner.",
    input_schema: {
      type: 'object',
      properties: {
        tenant_slug: { type: 'string', description: 'Slug exact du restaurant retourné par search_restaurants' },
      },
      required: ['tenant_slug'],
    },
  },
  {
    name: 'search_menu',
    description:
      'Cherche un produit dans le menu du restaurant confirmé, pour retrouver son product_id avant de l\'ajouter au panier. Le menu complet est déjà fourni dans le contexte — utiliser cet outil seulement si un plat mentionné par le client ne correspond pas clairement à un item visible.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nom ou description du plat recherché' },
      },
      required: ['query'],
    },
  },
  {
    name: 'add_to_cart',
    description:
      "Ajoute un produit (avec options éventuelles) au panier en cours. Nécessite un restaurant déjà confirmé. IMPORTANT : `quantity` est la quantité TOTALE souhaitée pour ce produit (pas un incrément) — si le produit est déjà dans le panier, sa quantité est remplacée par cette valeur. Ne rappelle jamais cet outil pour un produit déjà ajouté sauf si le client change explicitement la quantité désirée (vérifie avec view_cart si besoin).",
    input_schema: {
      type: 'object',
      properties: {
        product_id: { type: 'string', description: 'Id du produit (voir le menu fourni dans le contexte)' },
        quantity: { type: 'integer', minimum: 1, description: 'Quantité totale désirée pour ce produit (remplace, ne s\'additionne pas)' },
        options: {
          type: 'array',
          description: 'Options sélectionnées, si le produit en a',
          items: {
            type: 'object',
            properties: {
              group_id: { type: 'string' },
              option_id: { type: 'string' },
            },
            required: ['group_id', 'option_id'],
          },
        },
        notes: { type: 'string', description: 'Note libre sur cet article (ex: "sans piment")' },
      },
      required: ['product_id', 'quantity'],
    },
  },
  {
    name: 'remove_from_cart',
    description: 'Retire un produit du panier (totalement, ou une quantité partielle).',
    input_schema: {
      type: 'object',
      properties: {
        product_id: { type: 'string' },
        quantity: { type: 'integer', minimum: 1, description: 'Si omis, retire toutes les quantités de ce produit' },
      },
      required: ['product_id'],
    },
  },
  {
    name: 'view_cart',
    description: 'Affiche le contenu actuel du panier avec le total. À utiliser avant place_order pour faire confirmer la commande au client.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'place_order',
    description:
      "Finalise la commande à partir du panier actuel. N'appeler QUE si le client a explicitement confirmé le panier complet (après view_cart). La commande sera à emporter (paiement au retrait).",
    input_schema: {
      type: 'object',
      properties: {
        customer_name: { type: 'string', description: 'Prénom du client, si donné' },
        notes: { type: 'string', description: 'Instructions générales pour la commande' },
      },
    },
  },
  {
    name: 'check_order_status',
    description: 'Vérifie le statut de la dernière commande (ou d\'une commande précise) du client pour ce restaurant.',
    input_schema: {
      type: 'object',
      properties: {
        order_number: { type: 'string', description: 'Numéro de commande si connu (ex: "ORD-2026-0042"), sinon la dernière commande est utilisée' },
      },
    },
  },
  {
    name: 'switch_restaurant',
    description: 'Réinitialise la conversation pour permettre au client de choisir un autre restaurant (abandonne le panier en cours).',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'send_menu_photos',
    description:
      "Envoie au client des photos des plats du restaurant confirmé (menu du jour / plats vedettes), chacune avec son nom et son prix en légende. À utiliser quand le client demande à voir le menu en photos, des images, ou \"le menu du jour\". Nécessite un restaurant déjà confirmé.",
    input_schema: {
      type: 'object',
      properties: {
        count: { type: 'integer', minimum: 1, maximum: 5, description: 'Nombre de plats à montrer (défaut 3)' },
      },
    },
  },
];
