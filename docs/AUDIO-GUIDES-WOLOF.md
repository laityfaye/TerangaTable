# Guides audio — version Wolof

## Pourquoi des enregistrements

Les guides audio du site (landing, `/decouvrir`, dashboard) utilisent la
synthèse vocale du navigateur (Web Speech API) en français. Aucun navigateur
grand public (Chrome, Edge, Safari) n'embarque de voix wolof — il n'existe
donc pas d'équivalent "wo" à `speechSynthesis`. La version wolof de chaque
guide doit être un **vrai enregistrement audio** (voix humaine).

## Où les enregistrer

**Super Admin → Guides audio** (`/super-admin/audio-guides`). Cette page liste
chaque guide (landing, marketplace, un par rôle du dashboard) avec, pour
chacun :
- le texte français de référence et le brouillon wolof ci-dessous, affichés
  côte à côte comme aide-mémoire ;
- un bouton **Enregistrer au micro** (via le micro du navigateur) ou
  **Importer un fichier** (mp3/wav/m4a) ;
- une prévisualisation audio et un statut "Enregistré le …" une fois déposé.

Techniquement, l'upload passe par `POST /v1/audio-guides/:key`
(apps/api/src/modules/audio-guides/), qui stocke le fichier via le
`StorageService` existant (MinIO en prod, fallback disque local en dev) et
enregistre son URL dans la table `audio_guides`. Le widget correspondant
(`apps/web/src/hooks/use-voice-guide.ts` + `use-audio-guides.ts`) va chercher
cette URL au chargement de la page et n'affiche le bouton **Wolof** que si un
enregistrement existe — pas d'étape manuelle côté code une fois le fichier
déposé depuis l'interface.

> ⚠️ **Les scripts wolof ci-dessous sont un premier jet, non validé par un
> locuteur natif.** Ils sont fournis comme base de travail pour un enregistrement,
> pas comme texte à lire mot à mot. Fais-les relire/adapter par quelqu'un qui
> parle wolof couramment avant tout enregistrement définitif — surtout pour
> les guides métier (cuisine, livraison, caisse) où une mauvaise traduction
> peut prêter à confusion pour l'utilisateur.

## 1. Landing (`/`) — clé `landing`

**Français (référence) :**
> Bienvenue sur TérangaTable, le Shopify plus Odoo de la restauration en
> Afrique ! Si vous êtes restaurateur, découvrez nos fonctionnalités : caisse
> et P.O.S, menu digital, gestion des commandes, réservations, C.R.M et
> analytics, réunis dans un seul outil. Consultez nos tarifs adaptés à chaque
> taille de restaurant, avec quatorze jours gratuits et sans carte bancaire.
> Si vous cherchez plutôt où manger, cliquez sur Découvrir en haut de la page
> pour explorer les restaurants près de chez vous à Dakar, Abidjan,
> Casablanca et ailleurs. Bonne visite !

**Wolof (brouillon) :**
> Dalal ak jàmm ci TérangaTable, sistem bi ëpp solo ci gestion ak recherche
> restoran ci Afrik bépp. Boo di boroom restoran, dinga am kess ak P.O.S,
> menu ci digital, gestion commande yi, réservation yi, CRM ak analytics —
> lépp dañu koy fekk ci benn app rekk. Xool tarif yi, dañuy dëppoo ak sa
> restoran : am nga fukk ak ñeent fan (14 jours) yu gratis, amul carte
> bancaire war a am. Boo bëggee xam fu nga mëna lekk, bësal "Découvrir" ci
> kaw page bi, ngir gis restoran yi jege la ci Dakar, Abidjan, Casablanca ak
> yeneen dëkk. Jàmm ak diisoo !

## 2. Marketplace `/decouvrir` et `/decouvrir/[ville]` — clé `decouvrir`

Un seul enregistrement générique (pas de nom de ville) partagé entre la page
d'accueil de la marketplace et chaque page ville (ex. `/decouvrir/thies`),
puisqu'un enregistrement audio ne peut pas insérer dynamiquement le nom de la
ville comme le fait le texte français.

**Français (référence, version générique) :**
> Bienvenue sur TérangaTable ! Découvrez les meilleurs restaurants d'Afrique
> en un seul endroit. Choisissez votre ville pour voir les restaurants
> disponibles, tapez un plat ou un nom de restaurant dans la recherche, ou
> activez votre position pour découvrir ce qui est ouvert près de vous. Bonne
> découverte !

**Wolof (brouillon) :**
> Dalal ak jàmm ci TérangaTable ! Seetaan restoran yu gën a baax ci Afrik,
> lépp ci benn xarala rekk. Tànn sa dëkk ngir gis restoran yi fa nekk, bind
> turu benn pénc walla benn restoran ci recherche bi, walla ubbi position bi
> ngir gis lu ubbi jege la léegi. Jàmm ak diisoo !

## 3. Dashboard — un enregistrement par rôle

Clés : `dashboard-owner`, `dashboard-manager`, `dashboard-serveur`,
`dashboard-caissier`, `dashboard-cuisinier`, `dashboard-livreur`, et
`dashboard-default` en secours si le rôle connecté n'a pas d'enregistrement
dédié. Scripts volontairement plus courts que la version française — ce sont
des points clés à reformuler naturellement à l'oral, pas une traduction mot à
mot.

### Owner — clé `dashboard-owner`
FR : *Propriétaire : accès à tout — Menu, Équipe dans Réglages, Tables, ventes
dans Analytics, site vitrine dans Mon Site.*
Wolof (brouillon) : *Yaw mi bokk restoran bi, danga am accès ci lépp : Menu
bi, équipe bi ci Réglages, Tables yi, dinga gis vente yi ci Analytics, ak sa
site ci "Mon Site". Jëfandikoo menu bi ci ëllëg ngir dem ci bépp waxtaan.*

### Manager — clé `dashboard-manager`
FR : *Manager : commandes en cours, réservations et paiements, équipe,
statistiques dans Analytics.*
Wolof (brouillon) : *Yaw mi jiite operation yi bés bu nekk : xool commande yi
di dox, réservation yi ak paiement yi, jiite équipe bi, te seet statistique
yi ci Analytics.*

### Serveur — clé `dashboard-serveur`
FR : *Serveur : créer une commande pour une table, suivre son statut, marquer
comme servie, alertes sonores.*
Wolof (brouillon) : *Yaw mi serveur, ci "Commandes" bindal commande bu bees
ngir benn table, xool statut bi, walisi "servie" bu commande bi jekk. Ubbil
alerte yi ngir dégg bu commande bi paree ci kuisin.*

### Caissier — clé `dashboard-caissier`
FR : *Caissier : encaisser dans Caisse, historique dans Paiements, créer une
commande, alertes sonores.*
Wolof (brouillon) : *Yaw mi caissier, jëfandikoo "Caisse" bi ngir jël xaalis
bi, seet historique bi ci "Paiements". Mën nga itam bind commande bu bees.
Ubbil alerte yi ngir dul yàqu commande.*

### Cuisinier — clé `dashboard-cuisinier`
FR : *Cuisinier : les commandes arrivent automatiquement, passer En
préparation puis Prête, alertes sonores.*
Wolof (brouillon) : *Yaw mi cuisinier, commande yi dañuy agsi ci sa écran ci
boppam. Walisi "En préparation" bu tàmbalee, "Prête" bu paree. Ubbil alerte
yi ngir dégg bu commande bu bees agsi.*

### Livreur — clé `dashboard-livreur`
FR : *Livreur : livraisons assignées dans Livraison, mettre à jour le statut
jusqu'à la remise, alertes sonores.*
Wolof (brouillon) : *Yaw mi livreur, gis nga sa livraison yi ci "Livraison".
Yeesalal statut bi ba mu jeexee, ba nga jébbal client bi. Ubbil alerte yi
ngir dégg bu livraison bu bees jox la.*

### Défaut (rôle inconnu) — clé `dashboard-default`
FR : *Utilisez le menu à gauche pour accéder aux sections de votre espace.*
Wolof (brouillon) : *Jëfandikoo menu bi ci ëllëg ngir dem ci bépp waxtaan ci
sa espace.*
