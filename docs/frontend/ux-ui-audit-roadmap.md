# MediPlan — Audit UX/UI, feuille de route & direction de design « premium »

> **Statut** : livrable de design / spécification. **Aucun code applicatif** n'est modifié par ce document.
> **Stack imposée** : Angular 22 (standalone, OnPush, Signals) + Angular Material 3 (`mat.theme`) + Tailwind CSS v4. Mode clair uniquement aujourd'hui.
> **Périmètre** : interface existante au Sprint 2 (shell, auth, dashboard) + composants `shared/ui`.
> **Source de vérité visuelle** : [`docs/frontend/design-system.md`](./design-system.md) — tokens `--mp-*`, source unique. Ce document **étend** le design system, il ne le remplace pas.
> **Référence d'observation** : code relevé dans `apps/frontend/src/app/` (shell `core/layout/layout-shell`, auth `features/auth/*`, dashboard `features/dashboard`, composants `shared/ui/*`).

---

## 1. Synthèse exécutive

L'interface MediPlan est aujourd'hui **propre, cohérente et accessible** : un design system mature et tokenisé (`--mp-*` comme source unique, pont Material 3 + Tailwind), une accessibilité AA réellement travaillée (skip link, focus visible, ARIA, cibles 44 px, contrastes vérifiés), un shell responsive correct (sidenav `side`/`over` au pivot 960 px, nav en pilules, menu utilisateur) et des écrans d'auth sobres et fonctionnels. **C'est une base saine — rien ici n'est à jeter.**

L'écart au « premium » ne vient pas de défauts, mais d'un **manque d'aboutissement perçu**. Trois symptômes dominent : (1) le **dashboard est quasi vide** — un titre et une carte d'identité, aucune valeur métier, aucune raison de revenir ; (2) le **langage visuel est trop plat et trop neutre** — élévations à 6-8 % d'opacité, hiérarchie typographique peu marquée, accent teal quasi absent, zéro micro-interaction ; (3) l'**identité de marque est minimale** (icône `add_circle` + texte). Le produit dit « correct et corporate », pas encore « haut de gamme et soigné ».

**Thèse de la refonte** : on n'ajoute pas de couleur ni d'effet, on **ajoute de la profondeur, de la hiérarchie et du contenu**. Élever « bleu clinique » au premium = surfaces feuilletées avec une échelle d'ombres plus riche mais sobre, une hiérarchie typographique plus affirmée (police de titrage Inter en option, repli Roboto), un dashboard qui délivre une vraie valeur par rôle, des micro-interactions discrètes et un jeu de composants premium (KPI cards, avatar + badge de rôle, skeletons). **Sans jamais trahir le registre médical** (confiance, calme, sérieux) ni casser l'AA et la règle « tokens = source unique ».

---

## 2. Audit heuristique de l'existant

Légende sévérité : **Bloquant** (nuit à l'usage / perception premium critique) · **Majeur** (écart net) · **Mineur** (polissage).

### 2.0 Ce qui est déjà bon (à NE PAS réécrire)

- **Tokenisation** : source unique `--mp-*`, pont `--mat-sys-*` + `@theme` Tailwind. Architecture exemplaire — toute la refonte passera par ces tokens.
- **Accessibilité AA** : skip link en tête du shell, `<main tabindex="-1">`, `<nav aria-label>`, `aria-current="page"` sur l'item actif, `aria-expanded`/`aria-label` dynamique du burger, `mat-error` + `aria-describedby` natif sur les form-fields, `role="alert"` sur les bandeaux, cibles 44 px. **C'est l'atout le plus solide du produit — chaque proposition ci-dessous le préserve.**
- **Responsive** : pivot 960 px géré par `BreakpointObserver`, sidenav `side`/`over`, fermeture auto en overlay, nom utilisateur masqué < 600 px.
- **Patterns de feedback** : `mat-progress-bar` en tête de carte auth pendant le chargement, bouton désactivé + libellé « Connexion… », `Alert` inline distinct du snackbar. Cohérent et juste.
- **RBAC d'affichage** : `visibleNavItems()` (fonction pure testée) filtre la nav par rôle. Propre.

### 2.1 Shell (`core/layout/layout-shell`)

| # | Constat | Heuristique | Sévérité | Recommandation |
|---|---|---|---|---|
| S1 | La toolbar et la zone de contenu partagent quasi le même blanc/gris très clair ; la séparation ne tient qu'à `--mp-elevation-1` (ombre à 6 %). Manque de **feuilletage** entre les plans. | Hiérarchie visuelle, profondeur | Majeur | Renforcer la séparation toolbar/contenu : ombre révisée (§3.1) + éventuel filet `--mp-color-border` bas de toolbar. Sidenav légèrement plus « posé » sur le fond. |
| S2 | Logo = `mat-icon add_circle` + texte 20 px. Identité **générique**, peu mémorable, peu premium. | Identité de marque | Majeur | Logo wordmark dédié (§3.4) : marque verrouillée (icône + « MediPlan ») avec espacement et poids maîtrisés ; option pictogramme SVG sobre. |
| S3 | Item de nav actif = simple pilule `--mp-color-primary-container`. Correct mais sans relief ni accent. | Cohérence, micro-interactions | Mineur | Ajouter une **barre d'accent** teal (2-3 px) en bord d'item actif + transition douce hover→actif (§3.5). Le teal trouve enfin un emploi AA-safe (filet, pas de texte). |
| S4 | Bouton menu utilisateur = `account_circle` générique. Pas d'avatar, pas de badge de rôle ; l'utilisateur ne « se voit » pas. | Reconnaissance, identité | Majeur | `AvatarComponent` avec initiales (déterministe) + `RoleBadgeComponent` (§3.6) dans la toolbar et l'en-tête du menu. |
| S5 | Aucune transition d'entrée de route / aucun feedback de navigation. Le contenu « apparaît » sec. | Micro-interactions | Mineur | Fondu/translation discret (120-160 ms) à l'entrée de page (§3.5), respectant `prefers-reduced-motion`. |
| S6 | Toolbar sans fil d'Ariane ni titre contextuel : sur une app multi-écrans, on perd le repère. | Repérage (Nielsen : visibilité de l'état) | Mineur (deviendra majeur avec plus d'écrans) | Réserver une zone de titre contextuel dans la toolbar (ou laisser le `<h1>` de page jouer ce rôle). À traiter quand Rendez-vous/Profil arrivent. |

### 2.2 Écrans d'authentification (`features/auth/*`)

| # | Constat | Heuristique | Sévérité | Recommandation |
|---|---|---|---|---|
| A1 | Login/register/forgot/reset : `mat-card` outlined ~420 px centrée sur fond uni `--mp-color-background`. Fonctionnel mais **sobre au point d'être terne** — première impression peu premium. | Esthétique, identité | Majeur | Fond travaillé : dégradé tonal très léger primary→background (sobre, médical) ou motif géométrique discret à faible opacité. Carte `elevation-2` révisée pour « flotter » légèrement (§3.1, wireframe §3.7). |
| A2 | Le logo est absent des écrans auth (la maquette du design system le prévoyait au-dessus de la carte, pas encore posé). | Identité, cohérence | Majeur | Poser le wordmark au-dessus de la carte (cohérent avec S2) — premier contact de marque. |
| A3 | Carte `appearance="outlined"` (bordure, ombre plate). Cohérent mais ne « sort » pas du fond. | Profondeur | Mineur | Passer la carte auth en surface élevée (`elevation-2` révisée) plutôt qu'outlined, pour la détacher du fond travaillé. |
| A4 | Hiérarchie interne plate : H1 « Connexion » puis champs, sans sous-titre ni respiration. | Hiérarchie typographique | Mineur | Sous-titre rassurant sous le H1 (« Accédez à votre espace de gestion des rendez-vous »), espacement vertical accru (§3.3). |
| A5 | Pas de toggle « afficher le mot de passe ». Friction réelle (saisie longue, erreurs). | Ergonomie (prévention d'erreur) | Mineur | `matSuffix` icône `visibility`/`visibility_off` sur le champ mot de passe, avec `aria-label` et `aria-pressed`. |

**Points déjà bons (auth)** : `mat-progress-bar` de chargement, états d'erreur de champ via `mat-error`, erreur serveur via `Alert role="alert"`, `autocomplete` correct, `data-testid` partout. Ne pas y toucher.

### 2.3 Dashboard (`features/dashboard`)

| # | Constat | Heuristique | Sévérité | Recommandation |
|---|---|---|---|---|
| D1 | **Écran quasi vide** : `<h1>` + une carte « Bienvenue, {nom} » + `<dl>` (email, rôle). Aucune donnée, aucun widget, aucune action, aucune hiérarchie. **Pas de valeur perçue.** | Adéquation au besoin, esthétique, hiérarchie | **Bloquant** (pour la perception premium) | Refonte complète en vrai tableau de bord **par rôle** (§3.8) : zone de bienvenue + KPI/stat cards + accès rapides + zone « prochain RDV » (placeholder tant que la feature RDV n'existe pas). |
| D2 | La carte d'identité (email/rôle) occupe seule l'écran alors que c'est une info secondaire. | Hiérarchie de l'information | Majeur | Déplacer l'identité en carte secondaire / la condenser ; mettre en avant ce qui compte par rôle (RDV à venir pour patient, KPIs pour admin). |
| D3 | Aucun état de chargement (skeleton). Quand les données arriveront, l'écran « sautera ». | Visibilité de l'état, micro-interactions | Majeur (anticipé) | `SkeletonComponent` pour les cartes (§3.6) pendant le fetch ; pas de spinner plein écran. |
| D4 | Aucun état vide illustré (patient sans RDV, admin clinique sans activité). | Prévention de la page blanche | Majeur (anticipé) | Utiliser/enrichir `EmptyState` existant avec une illustration sobre (§3.6, §3.9). |
| D5 | `max-width: 32rem` sur la carte → le dashboard n'exploite pas la largeur de 1200 px du shell. | Densité d'information, layout | Mineur | Grille responsive (Tailwind `grid md:grid-cols-3`) exploitant la largeur, cartes alignées sur l'échelle d'espacement. |

### 2.4 Transversal (design system & composants)

| # | Constat | Heuristique | Sévérité | Recommandation |
|---|---|---|---|---|
| T1 | **Élévations trop plates** : `elevation-1` à 6-8 % d'opacité ; toutes les surfaces semblent sur le même plan → effet « wireframe gris », pas premium. | Profondeur, esthétique | Majeur | Échelle d'ombres révisée (§3.1) : un peu plus de présence, deux couches (ambient + directionnelle), **toujours sobre** (médical). Reste pilotée par tokens. |
| T2 | **Accent teal sous-exploité** : `--mp-color-accent` quasi invisible dans l'UI réelle. La palette se réduit au bleu + gris. | Couleur, identité | Majeur | Donner un rôle systématique au teal **AA-safe** : filets d'accent (item actif, bord supérieur de KPI card), icônes, badges grand texte — **jamais** texte normal blanc sur teal (échec AA ~3.3:1, déjà documenté §6 du DS). |
| T3 | **Hiérarchie typographique peu marquée** : Roboto partout, display 28 / title 20 ; les pages se ressemblent toutes. | Typographie, hiérarchie | Majeur | Échelle premium (§3.3) : envisager **Inter** (ou Sora) pour le titrage, contraste de poids accru (600/700 sur titres, 400 sur corps), `letter-spacing` négatif léger sur les grands titres. Repli Roboto conservé. |
| T4 | **Aucune micro-interaction** : pas de transition hover/actif, pas d'entrée de page, pas de skeleton. L'app paraît statique. | Micro-interactions, feedback | Majeur | Système de motion sobre (§3.5) : durées 120-200 ms, easing standard Material, `prefers-reduced-motion` respecté. |
| T5 | **Pas de mode sombre** (structure token-ready mais non implémentée). Attendu d'un produit premium en 2026. | Cohérence, confort | Mineur (priorité basse) | Implémenter `[data-theme="dark"]` en redéfinissant les `--mp-*` (§3.2). Aucun markup à changer — bénéfice direct de la tokenisation. |
| T6 | Composants premium manquants : pas d'avatar, badge, skeleton, table, dialog, KPI card. | Cohérence, montée en charge | Majeur (anticipé) | Compléter `shared/ui` au fil des besoins (§3.6), en restant KISS/YAGNI (ne créer que ce que les écrans utilisent). |
| T7 | Iconographie minimale et fonctionnelle (Material Symbols bruts). | Identité | Mineur | Style d'icônes homogène (poids/grade Material Symbols cohérent : `FILL 0, wght 400, GRAD 0` partout), tailles alignées sur l'échelle. |

---

## 3. Direction de design « premium »

Principe directeur : **profondeur + hiérarchie + contenu, pas de surcharge.** Médical = confiance et calme. On élève la finition, jamais le « flash ». Tout passe par les tokens `--mp-*` (source unique) — aucune valeur en dur dans le code.

### 3.1 Profondeur & élévation (révision)

Remplacer l'échelle plate par une échelle **feuilletée mais sobre** (deux couches : ombre ambiante diffuse + ombre directionnelle courte). À porter dans `design-system.md §1.6`.

```
--mp-elevation-0 : none;                                                  /* à plat, séparé par bordure */
--mp-elevation-1 : 0 1px 2px rgba(26,34,51,.08),
                   0 2px 6px rgba(26,34,51,.06);                          /* cartes au repos */
--mp-elevation-2 : 0 2px 4px rgba(26,34,51,.08),
                   0 8px 20px rgba(26,34,51,.10);                         /* cartes flottantes, menus, sidenav over */
--mp-elevation-3 : 0 8px 16px rgba(26,34,51,.10),
                   0 24px 48px rgba(26,34,51,.14);                        /* dialogs */
/* nouveau : élévation interactive au survol (transition) */
--mp-elevation-hover : 0 4px 8px rgba(26,34,51,.10),
                       0 12px 28px rgba(26,34,51,.12);
```

**Surfaces feuilletées** : fond `--mp-color-background` (#F7F9FC) → cartes `--mp-color-surface` (#FFF) en `elevation-1` → carte mise en avant en `elevation-2`. La hiérarchie de plans crée la perception premium sans couleur.

> Garde-fou : on **ne dépasse pas** ~14 % d'opacité d'ombre. Registre médical = pas d'effet « carte qui lévite ».

### 3.2 Couleur & mode sombre

- **Bleu primary** : reste l'identité (actions, état actif, focus). Inchangé.
- **Teal accent — rôle enfin systématique (AA-safe)** : filet d'accent (2-3 px) sur l'item de nav actif et le bord supérieur des KPI cards ; icônes de KPI ; badges « grand texte ». Jamais de texte normal blanc sur fond teal (cf. DS §6 : ~3.3:1). Si un fond teal avec texte est requis, ajouter le primitif `--mp-teal-800 #00695C` (blanc ≈ 4.7:1).
- **Dégradés sobres** : autorisés uniquement en arrière-plan d'écrans d'accueil/auth, très basse opacité (ex. `linear-gradient` primary 4 % → transparent). Jamais sur du texte ni des composants de données.
- **Surfaces tonales** : `--mp-color-surface-variant` (#F1F5F9) pour en-têtes de table, lignes alternées, fonds de section secondaire — crée du rythme sans bordure.
- **Mode sombre (token-ready, P2)** : bloc `[data-theme="dark"]` redéfinissant les `--mp-*` + `theme-type: dark` côté Material. Cibles indicatives : background `#0F1722`, surface `#172234`, surface-variant `#1F2B3E`, text `#E6EAF2`, text-secondary `#A9B4C6`, primary clarifié `#5B9BE8` (AA sur fond sombre), border `#2A384F`. **Aucun markup à changer.** À valider en contraste AA avant livraison.

### 3.3 Typographie premium

Recommandation : **Inter** pour le titrage (display/title/subtitle), **Roboto conservé** pour le corps — ou Inter partout. Argumentaire :

- **Inter** est gratuite (OFL), pensée écran, lisible en petites tailles, avec un rendu plus « produit » que Roboto. Elle modernise sans rompre la neutralité médicale (pas de fantaisie). Alternatives équivalentes : **Sora** (plus géométrique, titres), **Plus Jakarta Sans**.
- **Repli garanti** : `'Inter', 'Roboto', system-ui, …` — si Inter ne charge pas, Roboto prend le relais sans casse.
- **Auto-hébergement** (cohérent avec décision DS n°6) : perf + hors-ligne.

Échelle révisée (contraste de poids accru, `line-height` ≥ 1.4 sur le corps maintenu) :

```
--mp-font-display  : 700, 32px / 40px, letter-spacing -0.5px   /* H1 page (était 28/600) */
--mp-font-title    : 600, 22px / 30px, letter-spacing -0.2px   /* H2 section / carte */
--mp-font-subtitle : 600, 16px / 24px                          /* H3 */
--mp-font-kpi      : 700, 34px / 40px                          /* valeur de KPI card (nouveau) */
--mp-font-body     : 400, 14px / 22px                          /* corps */
--mp-font-body-strong : 600, 14px / 22px
--mp-font-caption  : 500, 12px / 16px, letter-spacing 0.2px    /* labels, légendes, badges */
--mp-font-button   : 500, 14px / 20px                          /* pas d'uppercase forcé (règle DS) */
```

> Garde-fou : pas d'`uppercase` sur les boutons, `line-height` corps ≥ 1.4 — règles DS conservées.

### 3.4 Identité de marque / logo

- **Wordmark verrouillé** : pictogramme + « MediPlan » avec espacement et poids fixes, réutilisé toolbar + écrans auth. Court terme : conserver `mat-icon` mais affiner (taille, couleur primary, gap). Moyen terme : **pictogramme SVG sobre** (ex. croix médicale stylisée intégrée à un « M », ou point/marqueur de calendrier) — un seul SVG inline statique, **pas** de `bypassSecurityTrustHtml** (asset `assetUrl`/`mat-icon` registre SVG).
- **Favicon + couleur de thème** alignés sur primary.

### 3.5 Micro-interactions & motion

Système discret, pro, respectant `@media (prefers-reduced-motion: reduce)` (désactive translations, garde les changements d'état instantanés).

```
--mp-motion-fast   : 120ms;   /* hover, focus, ripple */
--mp-motion-base   : 180ms;   /* entrée de carte, expand */
--mp-motion-slow   : 240ms;   /* entrée de page, overlay */
--mp-ease-standard : cubic-bezier(.2, 0, 0, 1);   /* Material standard */
```

Applications : hover des cartes (`elevation-1 → elevation-hover` + translateY -2px) ; item de nav (transition fond + filet teal) ; entrée de page (fade + translateY 8px→0 sur le contenu de route) ; toggle mot de passe et menus (transitions Material par défaut conservées) ; skeleton shimmer (gradient animé lent, ~1.4 s).

> Garde-fou : aucune animation > 240 ms, aucun bounce/élastique. Sobre.

### 3.6 Composants premium à ajouter (`shared/ui`, KISS/YAGNI)

| Composant | Quand | Material / Tailwind | Notes a11y |
|---|---|---|---|
| `StatCardComponent` (KPI) | Dashboard refonte (P1) | `mat-card` + slot icône + valeur (`--mp-font-kpi`) + label + delta optionnel | valeur + label liés ; pas d'info portée par la seule couleur |
| `AvatarComponent` | Shell (P1) | div tokenisé, initiales déterministes, `--mp-radius-full` | `aria-label` = nom complet ; fallback initiales |
| `RoleBadgeComponent` | Shell + dashboard (P1) | puce tokenisée (teal/primary selon rôle) | texte lisible (pas couleur seule), contraste AA |
| `SkeletonComponent` | Dashboard + futures listes (P1/P2) | bloc tokenisé + shimmer (motion) | `aria-hidden="true"` + conteneur `aria-busy="true"` |
| `EmptyState` (enrichir l'existant) | RDV / listes vides | ajouter slot illustration SVG sobre | déjà a11y ; conserver titre + action |
| `mat-table` soigné | Liste RDV / Utilisateurs (P3, dépend backend) | `mat-table` + surface-variant en-tête, lignes alternées, tri | en-têtes `scope`, tri annoncé |
| `MatDialog` confirmation | Annulation RDV (P3, dépend feature) | `MatDialog` | focus trap natif Material |

> Tous pilotés par tokens. On ne crée un composant que lorsqu'un écran l'utilise réellement.

### 3.7 Wireframe — Login premium (ASCII)

```
┌───────────────────────────────────────────────────────────────────┐
│  fond : --mp-color-background + dégradé tonal primary 4% (haut-G)   │
│                                                                     │
│                      ⊕  MediPlan          ← wordmark (primary)      │
│                                                                     │
│            ┌─────────────────────────────────────────┐             │
│            │  mat-card  (radius-lg, ELEVATION-2)       │  ← flotte   │
│            │  ▔▔▔▔▔▔▔▔▔ (mat-progress-bar si loading)  │             │
│            │                                           │             │
│            │  H1  Connexion            (display 32/700)│             │
│            │  Accédez à votre espace de gestion        │  ← sous-    │
│            │  des rendez-vous.         (body, secondaire)│   titre   │
│            │                                           │             │
│            │  [ app-alert error ]      (si erreur serveur)│          │
│            │                                           │             │
│            │  ┌─ Adresse e-mail ───────────────────┐   │  ← mat-     │
│            │  │ …                                   │   │   form-     │
│            │  └─────────────────────────────────────┘   │   field    │
│            │  ┌─ Mot de passe ──────────────── 👁 ─┐    │  ← suffix   │
│            │  │ ••••••••                            │   │   toggle    │
│            │  └─────────────────────────────────────┘   │            │
│            │              Mot de passe oublié ? (lien)  │            │
│            │                                           │             │
│            │  [ ███████  Se connecter  ███████ ]       │  ← filled,  │
│            │                                  (transition hover)     │
│            │                                           │             │
│            │  Pas encore de compte ?  Créer un compte  │             │
│            └─────────────────────────────────────────┘             │
│                                                                     │
└───────────────────────────────────────────────────────────────────┘
```

Changements vs existant : fond travaillé (dégradé sobre), wordmark posé, carte en `elevation-2` (flotte), sous-titre rassurant, toggle mot de passe, hover du bouton. **Tout le reste (form controls, validators, `Alert`, `data-testid`, progress-bar) est conservé tel quel.**

### 3.8 Wireframe — Dashboard premium par rôle (ASCII) — PRIORITÉ

Layout commun : zone d'accueil (avatar + salutation + badge rôle) → grille de cartes responsive (`grid md:grid-cols-3`, plein 1200 px) → contenu principal par rôle. Skeletons pendant le chargement, EmptyState illustré si pas de données.

**Vue PATIENT** (orientée « mon prochain RDV + actions ») :

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ( A )  Bonjour, Aurélie     [ badge: Patient ]      (display 32/700)      │
│        Voici un aperçu de vos rendez-vous.          (body, secondaire)    │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐  ┌───────────────┐  ┌───────────────┐         │
│ │ ▌PROCHAIN RENDEZ-VOUS   │  │ 🗓  À venir    │  │ ✓  Passés     │  ← Stat │
│ │  (filet teal à gauche)  │  │  ── 2 ──      │  │  ── 5 ──      │   Cards │
│ │  Dr. Martin — Cardio    │  │  rendez-vous  │  │  rendez-vous  │         │
│ │  Jeu. 19 juin · 14:30   │  └───────────────┘  └───────────────┘         │
│ │  Clinique Centre-ville  │                                               │
│ │  [ Voir ]  [ Annuler ]  │   (si aucun RDV → EmptyState illustré :       │
│ └─────────────────────────┘    « Aucun rendez-vous » + [ Prendre RDV ])    │
├─────────────────────────────────────────────────────────────────────────┤
│ Accès rapides                                                             │
│ [ ＋ Prendre un rendez-vous ]  [ 🗓 Mes rendez-vous ]  [ 👤 Mon profil ]   │
│  (cartes-actions ; désactivées « bientôt » tant que la feature manque)    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Vue ADMIN DE CLINIQUE** (orientée « pilotage du jour ») :

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ( D )  Bonjour, Dr Diallo   [ badge: Admin clinique ]                     │
│        Activité de la Clinique Centre-ville — aujourd'hui.                │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  ← Stat Cards│
│ │ ▌RDV jour  │ │ Médecins   │ │ Annulations│ │ Taux rempl.│   (filet     │
│ │  ── 24 ──  │ │  actifs 8  │ │   du jour 3│ │    87 %    │    teal +    │
│ │  +3 vs hier│ │            │ │            │ │            │    icône)    │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘              │
├──────────────────────────────────────────┬────────────────────────────── │
│ Rendez-vous du jour (table soignée)        │ Accès rapides                │
│ ┌────────────────────────────────────────┐│ [ 👥 Utilisateurs ]          │
│ │ Heure │ Patient    │ Médecin │ Statut   ││ [ 🏥 Médecins ]              │
│ │ 09:00 │ M. Tremblay│ Dr Roy  │ ● Confirmé││ [ 🗓 Disponibilités ]       │
│ │ 09:30 │ …          │ …       │ ○ En att.││  (selon features livrées)    │
│ └────────────────────────────────────────┘│                              │
│  (skeleton pendant fetch ; EmptyState si vide)                            │
└──────────────────────────────────────────┴────────────────────────────── ┘
```

> **Dépendance honnête** : les chiffres et la table dépendent des features RDV/stats **non encore livrées**. Le wireframe est la cible ; au Sprint 2 on livre la **structure** (grille, StatCards, zones) avec **placeholders / skeletons / EmptyState**, branchée sur les vraies données quand le backend RDV existera. La carte d'identité (email/rôle) actuelle devient une carte « Mon compte » secondaire ou migre dans le profil.

### 3.9 Imagerie / illustrations

Illustrations **sobres, line-art monochrome** (teinte primary/teal, fond transparent) pour les EmptyState et l'accueil. Pas de photos stock, pas d'illustrations colorées « SaaS ». Sources gratuites compatibles (ex. unDraw recoloré sur primary). SVG statiques en assets — jamais d'injection HTML dynamique.

---

## 4. Feuille de route priorisée

Notation : **Impact** (perception premium) · **Effort** (équipe de 3, contexte académique) · **Dépendances**. On distingue **UI pure** (aucun backend) de ce qui **dépend de features non livrées** (RDV, stats).

### P0 — Quick wins visuels (UI pure, < 1 jour cumulé)
| Item | Impact | Effort | Dépendances |
|---|---|---|---|
| Révision de l'échelle d'ombres `--mp-elevation-*` (§3.1) | Élevé | Très faible (tokens) | — |
| Carte auth en `elevation-2`, fond auth + dégradé tonal sobre (§3.7) | Élevé | Faible | ombres P0 |
| Toggle « afficher mot de passe » (A5) | Moyen | Faible | — |
| Sous-titre + respiration verticale sur écrans auth (A4) | Moyen | Très faible | — |
| Filet d'accent teal + transition sur item de nav actif (S3) | Moyen | Faible | — |
| Cohérence Material Symbols (poids/grade) (T7) | Faible | Très faible | — |

→ **Effet immédiat** sur la perception, zéro risque, zéro backend. À faire en premier.

### P1 — Refonte du dashboard + composants de base (UI pure, structure)
| Item | Impact | Effort | Dépendances |
|---|---|---|---|
| `AvatarComponent` + `RoleBadgeComponent` (toolbar + dashboard) (§3.6) | Élevé | Faible | — |
| `StatCardComponent` (§3.6) | Élevé | Moyen | tokens P0 |
| `SkeletonComponent` (§3.6) | Moyen | Faible | motion |
| **Refonte dashboard** : grille responsive, zone d'accueil, StatCards en placeholder, accès rapides, EmptyState (§3.8) | **Élevé** | Moyen | composants ci-dessus ; **données = placeholders** |
| Wordmark affiné toolbar + auth (S2, A2) | Moyen | Faible | — |

→ Transforme la pièce maîtresse (dashboard) sans attendre le backend : on pose la **structure** et on branche plus tard.

### P2 — Motion & mode sombre (UI pure)
| Item | Impact | Effort | Dépendances |
|---|---|---|---|
| Système de motion + transitions hover/entrée de page (§3.5) | Moyen | Moyen | `prefers-reduced-motion` |
| Police de titrage Inter (auto-hébergée) + échelle typo révisée (§3.3) | Moyen-élevé | Faible-moyen | repli Roboto |
| **Mode sombre** `[data-theme="dark"]` + toggle (§3.2) | Moyen | Moyen | tokens (déjà prêts) ; re-vérif AA |

→ Finition « produit ». Le mode sombre est peu risqué grâce à la tokenisation, mais re-valider l'AA.

### P3 — Composants data premium (DÉPEND DE FEATURES non livrées)
| Item | Impact | Effort | Dépendances |
|---|---|---|---|
| `mat-table` soignée (liste RDV / Utilisateurs) | Élevé | Moyen | **API RDV / users** (backend) |
| `MatDialog` de confirmation (annulation RDV) | Moyen | Faible | **feature annulation RDV** |
| EmptyState illustrés (illustrations SVG) (§3.9) | Moyen | Faible | — (mais utile avec listes réelles) |
| Branchement des KPIs/“prochain RDV” sur vraies données (§3.8) | Élevé | Moyen | **API stats / RDV** |

### Séquencement recommandé (équipe de 3, académique)
1. **P0 d'abord** (une demi-journée, 1 personne) : ratio impact/effort imbattable, démontrable immédiatement au client/prof.
2. **P1 en parallèle léger** : 1 personne sur les composants (`Avatar`/`Badge`/`StatCard`/`Skeleton`), 1 personne sur la refonte dashboard qui les consomme. Livrable « waouh » pour la démo.
3. **P2** : motion + typo en continu (faible risque) ; mode sombre **seulement si le temps le permet** (nice-to-have, non bloquant pour la note).
4. **P3** : **piloté par le backend** — à n'entamer que quand les features RDV/stats/users sont livrées. Ne pas construire de table sans données réelles (YAGNI).

> **Règle de découplage** : tout P0/P1/P2 est livrable **sans aucune dépendance backend**. Seul P3 attend les features. Cela protège la démo : même sans RDV livrés, le dashboard premier (structure + placeholders) est présentable.

---

## 5. Garde-fous (ce qu'il NE faut PAS casser)

1. **Accessibilité AA** : conserver skip link, `<main tabindex="-1">`, `aria-current`, `aria-expanded`/`aria-label` du burger, `mat-error`/`aria-describedby`, `role="alert"`, cibles ≥ 44 px, focus **toujours visible** (jamais `outline:none` sans alternative). Toute nouvelle couleur/surface re-vérifiée AA (texte 4.5:1, UI 3:1). Mode sombre = re-validation complète des contrastes.
2. **Tokens = source unique** : aucune valeur hex/px en dur dans les composants ; tout via `--mp-*`. Les nouvelles ombres/typo/motion s'ajoutent **dans `design-system.md`**, pas dans les composants.
3. **Teal AA-safe** : jamais de texte normal blanc sur fond teal `#00897B` (~3.3:1). Teal = accents/filets/icônes/badges grand texte uniquement (ou variante `#00695C` si fond requis).
4. **KISS / YAGNI** : ne créer un composant que lorsqu'un écran l'utilise. Pas de table/dialog avant la feature correspondante. Repli complet du sidenav (pas de mode rail) au Sprint 2.
5. **Sécurité** : **pas de `bypassSecurityTrustHtml`** ; logos/illustrations = SVG statiques en assets ou `MatIconRegistry`, jamais d'injection de chaîne (y compris snackbar/dialog).
6. **Registre médical sobre** : pas de « SaaS flashy ». Ombres ≤ ~14 % d'opacité, motion ≤ 240 ms sans bounce, dégradés ≤ ~4 % et hors texte/données, couleurs de feedback désaturées (règle DS conservée). Élever la finition, pas le bruit.
7. **Material + Tailwind** : composants via Material (theming/system tokens), layout via Tailwind ; ne pas recolorer l'intérieur d'un composant Material avec Tailwind ; `!important` interdit par défaut (règles DS §2 conservées).
8. **Ne pas régresser l'existant** : conserver `data-testid`, validators/Signals, `autocomplete`, patterns de chargement déjà en place sur l'auth.

---

*Ce document complète `design-system.md`. Les tokens nouveaux (ombres révisées, typo premium, motion) doivent y être reportés pour rester source unique avant implémentation par `mediplan-angular-frontend`.*
