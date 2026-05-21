# UI-SYSTEM — Design System TÉRANGATABLE

---

## Identité visuelle

**Nom :** TérangaTable
**Positionnement :** "Le Shopify + Odoo de la Restauration en Afrique"
**Esthétique :** Moderne, premium, chaleureux — inspiré des couleurs africaines (terracotta, or, vert profond) avec une touche tech épurée

---

## Typographie

| Rôle | Famille | Usage |
|---|---|---|
| Titres / Display | Plus Jakarta Sans | H1–H4, noms de produits, totaux |
| Corps / UI | DM Sans | Labels, descriptions, paragraphes |
| Monospace / Code | JetBrains Mono | Montants formatés, codes, debug |

```css
/* import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
```

---

## Palette de couleurs

### Primaires

```css
--color-terracotta:        #C8553D;  /* Principal, identitaire */
--color-terracotta-dark:   #A33D28;  /* Hover, pressed */
--color-terracotta-light:  #E8826F;  /* Backgrounds légers */
--color-gold:              #D4A843;  /* Accent, highlights */
--color-green-success:     #2D6A4F;  /* Succès, confirmé */
```

### Surfaces & Neutres

```css
--color-bg-dashboard:      #FAFAF8;  /* Fond principal dashboard */
--color-bg-dark:           #1A1A18;  /* Sidebar, dark mode */
--color-text-primary:      #1C1917;  /* Texte principal */
--color-text-secondary:    #57534E;  /* Texte secondaire, labels */
--color-border:            #E7E5E4;  /* Bordures, séparateurs */
--color-surface:           #FFFFFF;  /* Cards, modals */
--color-surface-alt:       #F5F4F2;  /* Alternance de surface */
```

### Sémantique des statuts de commandes

| Statut | Couleur | Hex | Usage |
|---|---|---|---|
| pending / en_attente | Amber | `#F59E0B` | Nouvelle commande non traitée |
| in_kitchen / en_cuisine | Blue | `#3B82F6` | En cours de préparation |
| ready / prête | Green | `#10B981` | Prête à servir ou livrer |
| delivered / livrée / servie | Gray | `#6B7280` | Terminée normalement |
| cancelled / annulée | Red | `#EF4444` | Annulée |

Ces couleurs correspondent aux `color` des `workflow_states` créés par défaut.

---

## Spacing (système 4px)

```css
--space-xs:   4px;
--space-sm:   8px;
--space-md:   16px;
--space-lg:   24px;
--space-xl:   32px;
--space-2xl:  48px;
--space-3xl:  64px;
```

---

## Border Radius

```css
--radius-sm:   6px;
--radius-md:   10px;
--radius-lg:   16px;
--radius-xl:   24px;
--radius-full: 9999px;
```

---

## Ombres

```css
--shadow-sm:  0 1px 3px rgba(0, 0, 0, 0.08);
--shadow-md:  0 4px 16px rgba(0, 0, 0, 0.10);
--shadow-lg:  0 8px 32px rgba(0, 0, 0, 0.12);
--shadow-glow: 0 0 0 3px rgba(200, 85, 61, 0.15); /* focus ring terracotta */
```

---

## Composants UI (`src/components/ui/`)

Tous les composants respectent ces règles :
- Utilisent `class-variance-authority (cva)` pour les variantes
- Acceptent `className` pour l'extension
- Gèrent l'accessibilité ARIA (aria-label, aria-disabled, role)
- Sont compatibles Radix UI pour les composants complexes (Dialog, Select, etc.)

---

### Button

```tsx
// Variantes
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

// Tailles
type ButtonSize = "sm" | "md" | "lg" | "xl";

// Mapping tailles → hauteurs
sm  → h-8  (32px)
md  → h-10 (40px)
lg  → h-11 (44px)
xl  → h-14 (56px) + touch target min 60px — obligatoire pour POS
```

```css
/* primary */
background: var(--color-terracotta);
color: white;
hover: background var(--color-terracotta-dark);

/* secondary */
border: 1px solid var(--color-border);
color: var(--color-text-primary);
hover: background var(--color-surface-alt);

/* ghost */
background: transparent;
color: var(--color-text-secondary);
hover: background var(--color-surface-alt);

/* danger */
background: #EF4444;
color: white;
hover: background: #DC2626;

/* success */
background: var(--color-green-success);
color: white;
```

---

### Input

- Label flottant (float label) ou label fixe au-dessus selon le contexte
- État error : bordure rouge `#EF4444` + message d'erreur en dessous en rouge
- Hint text : texte gris sous le champ (non-error)
- Required : astérisque rouge `*` à côté du label
- Focus ring : `--shadow-glow`

---

### Card

Structure : `Card > CardHeader > CardContent > CardFooter`

```css
background: var(--color-surface);
border-radius: var(--radius-lg);
box-shadow: var(--shadow-sm);
border: 1px solid var(--color-border);
```

---

### Badge

```tsx
type BadgeVariant = "default" | "pending" | "active" | "suspended" | "info";
```

| Variante | Fond | Texte | Usage |
|---|---|---|---|
| default | `#F5F4F2` | `#1C1917` | Général |
| pending | `#FEF3C7` | `#92400E` | En attente |
| active | `#D1FAE5` | `#065F46` | Actif / validé |
| suspended | `#FEE2E2` | `#991B1B` | Suspendu / erreur |
| info | `#DBEAFE` | `#1E40AF` | Information |

**`BadgeOrderStatus`** : composant spécifique qui reçoit un `workflow_state` et applique automatiquement la couleur du state comme fond (avec opacité 20%) et le nom comme label.

---

### EmptyState

```tsx
<EmptyState
  icon={<IconRestaurant />}  // illustration SVG ligne africaine
  title="Aucune commande pour l'instant"
  description="Les commandes de vos clients apparaîtront ici."
  action={<Button>Créer une commande</Button>}  // optionnel
/>
```

---

### Skeleton

Animations `pulse` avec couleur terracotta subtile (`rgba(200, 85, 61, 0.08)`).

---

## Layout Dashboard

```
┌─────────────────────────────────────────────────┐
│ Header (60px) — logo, breadcrumb, notif, avatar  │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │                                       │
│ 240px    │  Contenu                              │
│ (60px    │  padding: 24px                        │
│ si       │  background: #FAFAF8                  │
│ collapsé)│  max-width: 1280px centré             │
└──────────┴──────────────────────────────────────┘
```

**Sidebar :**
- Fond : `#1A1A18` (sombre)
- Texte des liens : blanc (`#FFFFFF`)
- Lien actif : background `rgba(200, 85, 61, 0.15)` + bordure gauche 3px `#C8553D`
- Icônes : Lucide Icons (taille 20px)
- État collapsed : tooltip au survol avec le nom du lien

**Header :**
- Fond : `#FFFFFF`
- Ombre bottom : `var(--shadow-sm)`
- Breadcrumb : séparateur `/` en gris, dernier segment en gras

---

## Interface Kanban Commandes

Affichage principal de la vue commandes. Les colonnes = `workflow_states` ordonnés.

### Structure

```
┌──────────────────────────────────────────────────────────┐
│  [Nouvelle 3] →  [En cuisine 5] →  [Prête 2] →  [Servie] │
│  ┌──────────┐    ┌──────────┐     ┌──────────┐           │
│  │ORD-0042  │    │ORD-0039  │     │ORD-0041  │           │
│  │ Table 3  │    │ Emporté  │     │ Table 7  │           │
│  │...items  │    │...items  │     │...items  │           │
│  │ 6 500 F  │    │ 4 200 F  │     │12 000 F  │           │
│  │[→ Cuisine]│   │[→ Prête] │     │[→ Servie]│           │
│  └──────────┘    └──────────┘     └──────────┘           │
└──────────────────────────────────────────────────────────┘
```

### Colonne

```css
/* Header colonne */
background: {workflow_state.color}20;  /* 12% opacité */
border-top: 3px solid {workflow_state.color};
padding: var(--space-md);

/* Badge count */
background: {workflow_state.color};
color: white;
border-radius: var(--radius-full);
```

### Carte commande

```css
background: var(--color-surface);
box-shadow: var(--shadow-md);
border-radius: var(--radius-md);
border-left: 4px solid {workflow_state.color};
padding: var(--space-md);
```

**Contenu de la carte :**
1. Ligne 1 : numéro (`ORD-2026-XXXX`) en **bold** + icône type + heure
2. Ligne 2–3 : résumé items (max 2 lignes, overflow ellipsis)
3. Ligne 4 : total en bas à droite (JetBrains Mono)
4. Ligne 5 : boutons de transition (max 2 par carte)

**Badge d'alerte :** badge rouge pulsant (animation `ping`) si la commande n'a pas changé d'état depuis > 15 minutes.

**Son notification :** bip court (440Hz, 150ms) déclenché via Web Audio API à chaque nouvelle commande reçue (WebSocket).

---

## Interface POS (Point of Sale)

Conçue pour tablettes et terminaux tactiles. Layout plein écran 2 colonnes.

```
┌─────────────────────────────┬───────────────────────┐
│  Catalogue  (60%)           │  Commande en cours    │
│                             │  (40%)                │
│  [Catégories tabs]          │                       │
│                             │  ┌─ item ─────────┐  │
│  ┌────┐ ┌────┐ ┌────┐      │  │ Thiéboudienne  │  │
│  │    │ │    │ │    │      │  │ x2  6 000 F   │  │
│  │prod│ │prod│ │prod│      │  └───────────────┘  │
│  │    │ │    │ │    │      │                       │
│  └────┘ └────┘ └────┘      │  Sous-total: 6 000F  │
│                             │  TVA:           0F   │
│  Grille 3 colonnes          │  ─────────────────   │
│  background: #FAFAF8        │  TOTAL:     6 000 F  │
│                             │                       │
│                             │  [Valider paiement]  │
└─────────────────────────────┴───────────────────────┘
```

**Règles POS :**
- Touch targets minimum **60px × 60px** pour TOUS les éléments interactifs
- Fond catalogue : `#FAFAF8`
- Fond commande : `#FFFFFF` avec ombre interne subtile
- Footer sticky : total + bouton de paiement toujours visible
- Bouton paiement : `xl` size, terracotta, pleine largeur

### Modal options produit

- Mobile : bottom sheet (slide-up depuis le bas)
- Tablette : modal centré `max-w-md`
- Clavier numérique custom pour saisie de montants :
  - Touches 60px × 60px minimum
  - Chiffres `0–9`, `,` (décimale), `←` (backspace), `OK`
  - Contraste élevé (fond noir, chiffres blancs)

---

## Site Vitrine Public

### SEO & Performance

```tsx
// generateMetadata dans chaque page vitrine
export async function generateMetadata({ params }): Promise<Metadata> {
  const tenant = await getTenantBySlug(params.slug);
  const settings = tenant.website_settings;
  return {
    title: settings.seo_title ?? `${tenant.name} — TérangaTable ${tenant.region.name}`,
    description: settings.seo_description,
    keywords: settings.seo_keywords,
    openGraph: {
      images: [settings.hero_image_url],
    },
  };
}

// ISR revalidation
export const revalidate = 300; // 5 min pour la page d'accueil
// Pour les pages menu :
export const revalidate = 60;  // 1 min
```

### Schema.org JSON-LD

À inclure dans chaque page vitrine (balise `<script type="application/ld+json">`).

```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "{tenant.name}",
  "servesCuisine": "African cuisine",
  "address": { "@type": "PostalAddress", "addressLocality": "{region.name}" },
  "hasMenu": {
    "@type": "Menu",
    "hasMenuSection": [
      {
        "@type": "MenuSection",
        "name": "{category.name}",
        "hasMenuItem": [
          {
            "@type": "MenuItem",
            "name": "{product.name}",
            "description": "{product.description}",
            "offers": { "@type": "Offer", "price": "{product.base_price}" }
          }
        ]
      }
    ]
  }
}
```

### Hero section

```css
/* Plein écran avec overlay gradient */
min-height: 100vh;
background-image: url({hero_image_url});
background-size: cover;
background-position: center;
/* Overlay */
::after {
  background: linear-gradient(
    to bottom,
    rgba(26, 26, 24, 0.3) 0%,
    rgba(26, 26, 24, 0.7) 100%
  );
}
/* Titre centré */
h1 {
  font-family: 'Plus Jakarta Sans';
  font-size: clamp(2rem, 5vw, 4rem);
  color: white;
  text-align: center;
}
```

### Navigation catégories (menu public)

```css
/* Sticky sous le header vitrine */
position: sticky;
top: 0;
z-index: 40;
/* Scroll horizontal sur mobile */
overflow-x: auto;
scrollbar-width: none; /* masquer scrollbar */
white-space: nowrap;
```

Grille produits : 2 colonnes mobile, 3 colonnes tablette/desktop.

---

## Tokens Tailwind (`tailwind.config.ts`)

```ts
extend: {
  colors: {
    terracotta: {
      DEFAULT: "#C8553D",
      dark: "#A33D28",
      light: "#E8826F",
    },
    gold: "#D4A843",
    "green-success": "#2D6A4F",
    "bg-dashboard": "#FAFAF8",
    "bg-dark": "#1A1A18",
    border: "#E7E5E4",
    surface: "#FFFFFF",
    "surface-alt": "#F5F4F2",
  },
  fontFamily: {
    display: ["Plus Jakarta Sans", "sans-serif"],
    body: ["DM Sans", "sans-serif"],
    mono: ["JetBrains Mono", "monospace"],
  },
  borderRadius: {
    sm: "6px",
    md: "10px",
    lg: "16px",
    xl: "24px",
  },
  boxShadow: {
    sm: "0 1px 3px rgba(0,0,0,0.08)",
    md: "0 4px 16px rgba(0,0,0,0.10)",
    lg: "0 8px 32px rgba(0,0,0,0.12)",
    glow: "0 0 0 3px rgba(200,85,61,0.15)",
  },
}
```
