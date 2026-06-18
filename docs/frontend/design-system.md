# MediPlan — Design System & Wireframe du shell

> **Statut** : spécification de design (UX/UI). **Aucun code applicatif** ici — ce document guide l'agent `mediplan-angular-frontend` pour l'implémentation.
> **Stack cible** : Angular 22 (standalone, OnPush, Signals) + Angular Material v3 (Material 3, `mat.theme`) + Tailwind CSS v4.
> **Périmètre** : tokens, stratégie Material+Tailwind, shell (header + sidenav rétractable), inventaire de composants, états/feedback, accessibilité, restyle des écrans existants (login/register/dashboard).
> **Mode** : clair uniquement, mais tokens structurés pour permettre un thème sombre ultérieur.

État actuel observé dans `apps/frontend` (à compléter par l'implémentation) :
- Structure `core/ shared/ features/` en place ; écrans `login`, `register`, `dashboard` existants en **HTML natif** (pas encore Material).
- **Angular Material et Tailwind ne sont pas encore installés** (absents de `package.json`). L'installation fait partie du travail d'implémentation.
- Le shell (`core/layout`) **n'existe pas encore** : `app.html` ne contient qu'un `<router-outlet />`.

---

## 1. Design tokens

Principe directeur : **une seule source de vérité = variables CSS sémantiques** (custom properties), définies au `:root`. Material 3 et Tailwind consomment ces mêmes variables, ce qui évite toute divergence et prépare le thème sombre (il suffira de redéfinir les variables sous un sélecteur `.theme-dark` / `[data-theme="dark"]`).

Convention de nommage : préfixe `--mp-` (MediPlan) + catégorie + rôle. On distingue les **tokens primitifs** (valeurs brutes, ex. `--mp-blue-700`) des **tokens sémantiques** (rôle d'usage, ex. `--mp-color-primary`). **Le code applicatif n'utilise QUE les tokens sémantiques**, jamais les primitifs ni les hex en dur.

### 1.1 Couleurs — primitifs (palette « Bleu clinique apaisant »)

| Variable primitive | Hex | Origine |
|---|---|---|
| `--mp-blue-900` | `#0D47A1` | Primaire foncé (client) |
| `--mp-blue-700` | `#1565C0` | Primaire (client) |
| `--mp-blue-50` | `#E8F0FB` | Teinte claire dérivée (surfaces sélectionnées) |
| `--mp-teal-600` | `#00897B` | Accent teal (client) |
| `--mp-teal-50` | `#E0F2F0` | Teinte claire dérivée |
| `--mp-bg` | `#F7F9FC` | Fond (client) |
| `--mp-surface` | `#FFFFFF` | Surface (client) |
| `--mp-ink-900` | `#1A2233` | Texte principal (client) |
| `--mp-ink-600` | `#4A5568` | Texte secondaire (dérivé) |
| `--mp-ink-400` | `#6B7280` | Texte désactivé / placeholder (dérivé) |
| `--mp-line-200` | `#E2E8F0` | Bordures / séparateurs (dérivé) |
| `--mp-green-700` | `#2E7D32` | Succès |
| `--mp-amber-800` | `#B45309` | Avertissement (texte/icône sur clair) |
| `--mp-red-700` | `#C62828` | Erreur |
| `--mp-blue-info-700` | `#1565C0` | Info (réutilise la primaire) |

### 1.2 Couleurs — sémantiques (à utiliser dans le code)

| Variable sémantique | Valeur (clair) | Rôle |
|---|---|---|
| `--mp-color-primary` | `var(--mp-blue-700)` | Actions principales, liens, état actif |
| `--mp-color-primary-hover` | `var(--mp-blue-900)` | Survol/pressé des actions primaires |
| `--mp-color-primary-container` | `var(--mp-blue-50)` | Fond d'item de nav actif, puces |
| `--mp-color-on-primary` | `#FFFFFF` | Texte/icône sur fond primaire |
| `--mp-color-accent` | `var(--mp-teal-600)` | Accent secondaire (badges, focus secondaire) |
| `--mp-color-on-accent` | `#FFFFFF` | Texte/icône sur accent |
| `--mp-color-background` | `var(--mp-bg)` | Fond de page / zone contenu |
| `--mp-color-auth-bg-tint` | `color-mix(in srgb, var(--mp-color-primary) 4%, transparent)` | Teinte primaire **très basse** (≤ 4 %) du dégradé d'arrière-plan des écrans d'auth (jamais sur du texte ni des données — cf. roadmap §3.2/§3.7) |
| `--mp-color-surface` | `var(--mp-surface)` | Cartes, toolbar, sidenav, dialogs |
| `--mp-color-surface-variant` | `#F1F5F9` | Surfaces alternées (lignes, en-têtes de table) |
| `--mp-color-text` | `var(--mp-ink-900)` | Texte principal |
| `--mp-color-text-secondary` | `var(--mp-ink-600)` | Texte secondaire, labels |
| `--mp-color-text-disabled` | `var(--mp-ink-400)` | Texte désactivé |
| `--mp-color-border` | `var(--mp-line-200)` | Bordures, séparateurs, outline form-field |
| `--mp-color-focus-ring` | `var(--mp-blue-700)` | Anneau de focus clavier |
| `--mp-color-success` | `var(--mp-green-700)` | Confirmations |
| `--mp-color-warning` | `var(--mp-amber-800)` | Avertissements |
| `--mp-color-error` | `var(--mp-red-700)` | Erreurs, validation invalide |
| `--mp-color-info` | `var(--mp-blue-info-700)` | Messages informatifs |

> Les couleurs de feedback (succès/erreur/avertissement) sont volontairement **désaturées et foncées** : registre médical = sobre et sérieux, pas de couleurs criardes. Voir §6 pour les ratios de contraste.

### 1.2bis Mode sombre (`[data-theme='dark']`) — implémenté (P2)

Le mode sombre **redéfinit uniquement les tokens sémantiques `--mp-color-*`** sous le sélecteur `[data-theme='dark']` (posé sur `<html>` par `ThemeService`). **Aucun markup à changer** — bénéfice direct de la tokenisation. Côté Material, un second `@include mat.theme((... theme-type: dark ...))` est appliqué sous ce sélecteur, puis le **pont `--mat-sys-*`** est réaffirmé pour garder la source unique (voie la plus fiable avec Material 3 : on ne touche pas aux classes `.mat-*`, on bascule le thème + on repointe les system tokens).

Cibles (roadmap §3.2) et contrastes re-vérifiés (AA : texte ≥ 4.5:1, UI/grand texte ≥ 3:1) :

| Token sémantique | Valeur (sombre) | Rôle | Contraste vérifié |
|---|---|---|---|
| `--mp-color-background` | `#0F1722` | Fond de page | — |
| `--mp-color-surface` | `#172234` | Cartes, toolbar, sidenav | — |
| `--mp-color-surface-variant` | `#1F2B3E` | Surfaces alternées | — |
| `--mp-color-text` | `#E6EAF2` | Texte principal | sur surface `#172234` ≈ 13.5:1 ✅ AAA |
| `--mp-color-text-secondary` | `#A9B4C6` | Texte secondaire | sur surface ≈ 7.1:1 ✅ AAA |
| `--mp-color-text-disabled` | `#7E8AA0` | Texte désactivé | sur surface ≈ 4.6:1 ✅ AA |
| `--mp-color-border` | `#2A384F` | Bordures, séparateurs | UI sur surface ≈ 1.4:1 (décoratif, non porteur de sens) |
| `--mp-color-primary` | `#5B9BE8` | Actions, état actif, focus | texte `#0F1722` sur primaire ≈ 7.6:1 ✅ ; primaire sur fond ≈ 4.9:1 ✅ (UI) |
| `--mp-color-primary-hover` | `#7DB2EF` | Survol primaire | — |
| `--mp-color-primary-container` | `#1E3149` | Fond d'item de nav actif | texte primaire `#5B9BE8` dessus ≈ 3.6:1 ✅ (grand texte/UI) |
| `--mp-color-on-primary` | `#0F1722` | Texte sur primaire | voir primaire |
| `--mp-color-accent` | `#3FC9B7` | Filets/icônes/badges (jamais texte normal blanc dessus) | filet décoratif ; sur fond ≈ 6.5:1 ✅ (UI) |
| `--mp-color-success` | `#5DD27A` | Confirmations | sur surface ≈ 8.9:1 ✅ |
| `--mp-color-warning` | `#E0A23C` | Avertissements | sur surface ≈ 7.4:1 ✅ |
| `--mp-color-error` | `#F0707A` | Erreurs, validation | sur surface ≈ 6.0:1 ✅ |
| `--mp-color-info` | `#5B9BE8` | Messages informatifs | = primaire |
| `--mp-color-focus-ring` | `#5B9BE8` | Anneau de focus clavier | visible sur toutes surfaces sombres ✅ |
| `--mp-color-auth-bg-tint` | inchangé (`color-mix` 4 % primaire) | dégradé d'arrière-plan auth | hors texte/données |

> **Élévations en sombre** : les ombres `--mp-elevation-*` restent identiques (rgba sombre) ; sur fond sombre la séparation des plans repose surtout sur le **contraste de surfaces** (`background` → `surface` → `surface-variant`), pas sur l'ombre. Acceptable et sobre.
> **Garde-fou** : la primaire est éclaircie (`#5B9BE8`) pour rester lisible ; l'accent teal reste réservé aux **filets/icônes/badges grand texte**, jamais texte normal blanc dessus.

### 1.3 Typographie

Deux familles (cf. roadmap UX §3.3) : **Inter** pour le **titrage** (display/title/subtitle — rendu « produit », pensée écran) et **Roboto** pour le **corps** (lisible, neutre). Les deux sont **auto-hébergées** via `@fontsource` (aucun CDN — décision DS n°6). Repli garanti : si Inter ne charge pas, Roboto prend le relais sans casse.

| Variable | Valeur | Usage |
|---|---|---|
| `--mp-font-family` | `'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif` | Corps de texte (défaut) |
| `--mp-font-display-family` | `'Inter', 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif` | **Titrage** (display/title/subtitle/KPI) — repli Roboto |

Échelle révisée (contraste de poids accru, `letter-spacing` léger négatif sur les grands titres, `line-height` corps ≥ 1.4 conservé). Les titres utilisent `--mp-font-display-family`.

| Variable | Valeur | Usage |
|---|---|---|
| `--mp-text-display` | `32px / 40px, 700, letter-spacing -0.5px`, famille display | Titre de page (H1) — était 28/600 |
| `--mp-text-title` | `22px / 30px, 600, letter-spacing -0.2px`, famille display | Titres de section / cartes (H2) — était 20/600 |
| `--mp-text-subtitle` | `16px / 24px, 600`, famille display | Sous-titres (H3) |
| `--mp-text-body` | `14px / 22px, 400` | Corps de texte, champs (line-height ≥ 1.4) |
| `--mp-text-body-strong` | `14px / 22px, 600` | Mise en exergue dans le corps |
| `--mp-text-caption` | `12px / 16px, 500, letter-spacing 0.2px` | Légendes, aides, badges |
| `--mp-text-button` | `14px / 20px, 500` | Libellés de boutons (pas de majuscules forcées) |

Tokens de titrage exposés (pour appliquer l'échelle sans valeurs en dur dans les composants) :

| Variable | Valeur |
|---|---|
| `--mp-font-display-size` / `-line` / `-weight` / `-spacing` | `32px` / `40px` / `700` / `-0.5px` |
| `--mp-font-title-size` / `-line` / `-weight` / `-spacing` | `22px` / `30px` / `600` / `-0.2px` |

> **Inter** : installé via `@fontsource/inter` (poids 400/600/700), importé dans `styles/fonts.css`. Si le paquet venait à manquer (réinstallation hors-ligne), le repli Roboto de `--mp-font-display-family` garantit l'absence de régression — réinstaller avec `pnpm --filter ./apps/frontend add @fontsource/inter`.

**Valeur de KPI** (StatCard du dashboard, cf. roadmap UX §3.3/§3.6). Token dédié pour ne pas coder la grande taille en dur dans le composant :

| Variable | Valeur | Usage |
|---|---|---|
| `--mp-font-kpi-size` | `34px` | Taille de la valeur d'une StatCard (KPI) |
| `--mp-font-kpi-line` | `40px` | Hauteur de ligne de la valeur de KPI |
| `--mp-font-kpi-weight` | `700` | Graisse de la valeur de KPI |

Règles : pas de `text-transform: uppercase` sur les boutons (lisibilité). Line-height jamais < 1.4 sur le corps de texte.

### 1.4 Espacement (échelle 4 px)

| Variable | Valeur | Usage type |
|---|---|---|
| `--mp-space-1` | `4px` | Micro-espacements (icône↔texte) |
| `--mp-space-2` | `8px` | Espacement serré |
| `--mp-space-3` | `12px` | Intérieur compact |
| `--mp-space-4` | `16px` | Padding standard de carte/champ |
| `--mp-space-5` | `24px` | Gouttière entre sections |
| `--mp-space-6` | `32px` | Marges de page |
| `--mp-space-8` | `48px` | Séparations majeures |

### 1.5 Rayons de bordure

| Variable | Valeur | Usage |
|---|---|---|
| `--mp-radius-sm` | `4px` | Champs, puces |
| `--mp-radius-md` | `8px` | Boutons, cartes |
| `--mp-radius-lg` | `12px` | Cartes auth, dialogs |
| `--mp-radius-full` | `9999px` | Avatars, badges ronds |

### 1.6 Ombres / élévations

Échelle **feuilletée mais sobre** : deux couches par niveau (ombre ambiante diffuse + ombre directionnelle courte) pour créer une perception de profondeur premium **sans couleur**. Registre médical = calme : opacité d'ombre **plafonnée à ~14 %**, aucun effet « carte qui lévite » (cf. roadmap UX §3.1, constat T1).

| Variable | Valeur | Usage |
|---|---|---|
| `--mp-elevation-0` | `none` | Surfaces à plat (séparées par bordure) |
| `--mp-elevation-1` | `0 1px 2px rgba(26,34,51,.08), 0 2px 6px rgba(26,34,51,.06)` | Cartes au repos, toolbar |
| `--mp-elevation-2` | `0 2px 4px rgba(26,34,51,.08), 0 8px 20px rgba(26,34,51,.10)` | Cartes flottantes (auth), menus, sidenav overlay mobile |
| `--mp-elevation-3` | `0 8px 16px rgba(26,34,51,.10), 0 24px 48px rgba(26,34,51,.14)` | Dialogs |
| `--mp-elevation-hover` | `0 4px 8px rgba(26,34,51,.10), 0 12px 28px rgba(26,34,51,.12)` | Élévation interactive au survol (transition cartes) |

> **Surfaces feuilletées** : fond `--mp-color-background` (#F7F9FC) → cartes `--mp-color-surface` (#FFF) en `elevation-1` → carte mise en avant en `elevation-2`. La hiérarchie de plans crée la perception premium sans ajouter de couleur.
> **Garde-fou** : on ne dépasse pas ~14 % d'opacité d'ombre.

### 1.6bis Motion (transitions & animations)

Système de motion **discret, pro** (cf. roadmap UX §3.5). Toute animation respecte `@media (prefers-reduced-motion: reduce)` (translations désactivées, changements d'état instantanés). Garde-fou : aucune animation > 240 ms, aucun effet bounce/élastique.

| Variable | Valeur | Usage |
|---|---|---|
| `--mp-motion-fast` | `120ms` | Hover, focus, ripple |
| `--mp-motion-base` | `180ms` | Entrée de carte, expand |
| `--mp-motion-slow` | `240ms` | Entrée de page, overlay |
| `--mp-motion-shimmer` | `1400ms` | Boucle de shimmer des skeletons (lente, sobre) |
| `--mp-ease-standard` | `cubic-bezier(.2, 0, 0, 1)` | Courbe Material standard |

### 1.7 Breakpoints responsive

Alignés sur les conventions Material/Tailwind. Le pivot du shell est **`md` (≥ 960 px)** : au-dessus, sidenav en `side` (poussant le contenu) ; en dessous, sidenav en `over` (overlay).

| Variable / alias | Valeur | Rôle |
|---|---|---|
| `--mp-bp-sm` | `600px` | Petit (téléphone large) |
| `--mp-bp-md` | `960px` | **Pivot sidenav** (tablette/desktop) |
| `--mp-bp-lg` | `1280px` | Desktop large (largeur contenu plafonnée) |

> En Angular, détecter le pivot avec `BreakpointObserver` du CDK (`max-width: 959.98px` → mode overlay), exposé en signal dans le composant shell.

### 1.8 Mapping vers Material 3 et Tailwind

**Material 3 (`mat.theme`)** : définir le thème dans un SCSS global (ex. `src/styles.scss` ou un partial `src/styles/_theme.scss`). On utilise l'API `mat.theme(...)` avec les palettes générées à partir de la primaire `#1565C0` et de l'accent teal. Ensuite, **surcharger les system variables Material avec nos tokens sémantiques** pour garder une source unique. Recommandation concrète :

```scss
// src/styles/_theme.scss  (pseudo-spec, à implémenter par le dev frontend)
@use '@angular/material' as mat;

:root {
  // 1) Tokens primitifs + sémantiques MediPlan
  --mp-blue-700: #1565C0;
  /* … (voir §1.1 / §1.2) … */
  --mp-color-primary: var(--mp-blue-700);
  /* … */

  // 2) Thème Material 3 (clair) basé sur la primaire et l'accent
  @include mat.theme((
    color: (
      theme-type: light,
      primary: mat.$blue-palette,   // ou palette custom générée depuis #1565C0
      tertiary: mat.$teal-palette,  // accent
    ),
    typography: Roboto,
    density: 0,
  ));
}

// 3) Pont : faire pointer les system tokens Material vers nos variables
//    (là où l'on veut garantir l'identité visuelle exacte)
:root {
  --mat-sys-primary: var(--mp-color-primary);
  --mat-sys-surface: var(--mp-color-surface);
  --mat-sys-background: var(--mp-color-background);
  --mat-sys-on-surface: var(--mp-color-text);
  // … selon les besoins ; documenter chaque pont
}
```

**Tailwind v4** : Tailwind v4 se configure **en CSS** via `@theme` (plus de `tailwind.config.js` obligatoire). On **réexpose les mêmes variables** comme tokens Tailwind, afin que `bg-surface`, `text-secondary`, `gap-4`, etc. tirent des mêmes valeurs :

```css
/* src/styles.css ou bloc dans styles.scss */
@import "tailwindcss";

@theme {
  --color-primary: var(--mp-color-primary);
  --color-surface: var(--mp-color-surface);
  --color-background: var(--mp-color-background);
  --color-text: var(--mp-color-text);
  --color-text-secondary: var(--mp-color-text-secondary);
  --color-border: var(--mp-color-border);
  --color-success: var(--mp-color-success);
  --color-error: var(--mp-color-error);
  /* espacements : Tailwind a déjà une échelle 4px (gap-1=4px…) cohérente avec §1.4 */
  --radius-md: var(--mp-radius-md);
}
```

Résultat : **changer une couleur = modifier une seule variable** ; Material et Tailwind suivent. Le thème sombre = un bloc `[data-theme="dark"] { --mp-color-* : … }` (et `theme-type: dark` côté Material) ajouté plus tard, **sans toucher au markup**.

---

## 2. Stratégie d'intégration Material + Tailwind (recommandation)

**Répartition des responsabilités (règle ferme) :**

| Material 3 | Tailwind v4 |
|---|---|
| **Composants** : toolbar, sidenav, boutons, form-field/input, menu, list, icon, snackbar, spinner, dialog, card | **Layout & utilities** : flex/grid, espacements (`p-`, `gap-`, `m-`), largeurs/hauteurs, responsive (`md:`), alignements, `hidden`/`block` |

Règle : on **n'utilise pas Tailwind pour recolorer ou redimensionner l'intérieur d'un composant Material** (on passe par le theming Material / les system tokens). On **n'écrit pas de composants UI custom là où Material en fournit un** (KISS).

**Éviter les conflits (points concrets pour Angular 22 + Material 3 + Tailwind v4) :**

1. **Preflight/reset Tailwind vs styles Material.** Le reset Tailwind (ex. `button { all: unset }`-like, `border-color` par défaut) peut « aplatir » des composants Material. Mitigations :
   - Charger Tailwind **avant** les styles Material dans l'ordre d'import, et encapsuler le reset dans son layer : `@layer base` (Tailwind) passe **avant** les styles composants Material non-layerisés, donc Material gagne en cas d'égalité de spécificité.
   - Si un reset casse un composant (typiquement les `<button mat-button>`), **ne pas** désactiver tout le preflight ; cibler le correctif. Tailwind v4 permet d'importer sélectivement : `@import "tailwindcss/utilities";` + `@import "tailwindcss/theme";` sans `preflight` si nécessaire — à n'utiliser qu'en dernier recours.

2. **Ordre des `@layer`.** Déclarer explicitement l'ordre pour rendre la cascade prévisible :
   ```css
   @layer base, components, utilities;  /* utilities en dernier = priorité aux classes Tailwind ponctuelles */
   ```
   Les styles Material vivent hors de ces layers (spécificité de classe normale) ; les utilities Tailwind dans `utilities` peuvent donc surcharger le layout sans `!important`.

3. **`!important` / scoping.** **Interdire `!important` par défaut.** Si une utility Tailwind doit absolument l'emporter sur un style Material, préférer (dans l'ordre) : (a) cibler un wrapper, (b) augmenter la spécificité via le sélecteur de composant, (c) en tout dernier recours le préfixe `!` de Tailwind (`!p-0`) **documenté**. Ne jamais styliser les classes internes `.mat-*` à la main (fragile entre versions) — utiliser les system tokens et les API de theming.

4. **Où définir quoi :**
   - **Thème Material + variables CSS** : un partial SCSS global unique (`src/styles/_theme.scss`) importé par `src/styles.scss`. Source unique des tokens.
   - **Config Tailwind** : bloc `@theme` dans le CSS global, réexposant les variables (§1.8).
   - **Material global** : importer les typographies/densité globalement ; **ne pas** importer Material par composant.
   - **`provideAnimationsAsync()`** dans `app.config.ts` (requis par les composants Material animés : sidenav, menu, snackbar).
   - **Icônes** : `mat-icon` avec la police Material Symbols (déclarée une fois dans `index.html` ou via le font CSS). Éviter les SVG inline custom au Sprint 2 (YAGNI).

5. **Pas de `bypassSecurityTrustHtml`** (rappel sécurité) : aucun rendu HTML dynamique non sanitizé, y compris dans les snackbars/dialogs — passer par des composants/templates, jamais par injection de chaîne.

---

## 3. Wireframe du shell (ASCII)

Le shell vit dans `core/layout` (ex. `LayoutShellComponent`). Composants Material : `mat-sidenav-container` > (`mat-sidenav` + `mat-sidenav-content`), `mat-toolbar`, `mat-nav-list` + `a mat-list-item`, `mat-icon`, `mat-menu` + `matMenuTriggerFor`, `mat-icon-button`/`mat-button`, `mat-divider`. Le `<router-outlet>` est dans `mat-sidenav-content`.

### 3.1 Desktop (≥ 960 px) — sidenav déplié, mode `side`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ mat-toolbar (color=surface, elevation-1)                                   │
│ [☰]  ⊕ MediPlan                                            [ A.Dupont ▾ ]  │ ← mat-menu trigger
└───────────────┬────────────────────────────────────────────────────────────┘
│ mat-sidenav   │  mat-sidenav-content  (background = --mp-color-background)  │
│ (side, 256px) │  ┌──────────────────────────────────────────────────────┐ │
│               │  │  zone contenu (max-width ~1200px, centrée, padding 24) │ │
│ ▣ Tableau de  │  │                                                        │ │
│   bord  (actif)│ │            <router-outlet />                            │ │
│ ▢ Rendez-vous │  │                                                        │ │
│ ▢ Profil      │  │                                                        │ │
│               │  │                                                        │ │
│ ─────────────  │  │                                                       │ │
│ (footer nav    │  │                                                       │ │
│  optionnel)    │  └───────────────────────────────────────────────────────┘ │
└───────────────┴────────────────────────────────────────────────────────────┘
```

Menu utilisateur (mat-menu ouvert depuis `[ A.Dupont ▾ ]`) :
```
                                             ┌───────────────────────────┐
                                             │ Aurélie Dupont            │  ← nom (body-strong)
                                             │ a.dupont@clinique.ca      │  ← email (caption, secondaire)
                                             ├───────────────────────────┤
                                             │ ⎋  Se déconnecter         │  ← mat-menu-item
                                             └───────────────────────────┘
```

### 3.2 Desktop — sidenav replié (après clic sur ☰)

Deux options ; **recommandation : le replier complètement** (`opened=false`, contenu pleine largeur) plutôt qu'un mode « rail » d'icônes (plus simple, KISS pour le Sprint 2). Le mode rail (icônes seules, 72 px) est noté « plus tard ».

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [☰]  ⊕ MediPlan                                            [ A.Dupont ▾ ]  │
└──────────────────────────────────────────────────────────────────────────┘
│  zone contenu pleine largeur                                               │
│            <router-outlet />                                               │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Mobile (< 960 px) — sidenav en overlay (mode `over`)

Au repos, le sidenav est fermé ; le contenu occupe toute la largeur. Le burger l'ouvre **par-dessus** le contenu, avec un **backdrop** (scrim) cliquable qui referme.

```
Fermé (état par défaut)                    Ouvert (overlay + scrim)
┌────────────────────────────┐            ┌──────────────┬─────────────┐
│ [☰] ⊕ MediPlan      [▾]    │            │ mat-sidenav  │░░ scrim ░░░░│
├────────────────────────────┤            │ (over, 256)  │░░░░░░░░░░░░░│
│                            │            │ ▣ Tableau    │░ (contenu  ░│
│      <router-outlet />     │            │   de bord    │░  grisé,   ░│
│                            │            │ ▢ Rendez-vous│░  cliquer  ░│
│                            │            │ ▢ Profil     │░  ferme)   ░│
│                            │            │              │░░░░░░░░░░░░░│
└────────────────────────────┘            └──────────────┴─────────────┘
```

Comportement : à chaque navigation (clic sur un item), **fermer automatiquement** le sidenav en mode `over`. Le bouton menu utilisateur peut se réduire à un avatar/icône `[▾]` sur mobile.

---

## 4. Inventaire des composants du design system

KISS/YAGNI : on ne crée que ce qui sert au **shell + login/register/dashboard**. Le reste est marqué « plus tard ».

### 4.1 Shell / layout — `core/layout`
| Composant | Rôle | Material utilisé |
|---|---|---|
| `LayoutShellComponent` | Conteneur du shell (header + sidenav + outlet), gère ouvert/fermé et le mode responsive (signal via `BreakpointObserver`) | `mat-sidenav-container`, `mat-sidenav`, `mat-sidenav-content` |
| `HeaderToolbarComponent` (ou inline dans le shell) | Burger, logo MediPlan, menu utilisateur (nom/email + déconnexion) | `mat-toolbar`, `mat-icon-button`, `mat-icon`, `mat-menu`, `mat-divider` |
| `SidenavNavComponent` (ou inline) | Liste de navigation (Tableau de bord, Rendez-vous, Profil — placeholders) avec état actif via `routerLinkActive` | `mat-nav-list`, `a mat-list-item`, `mat-icon` |

> Le menu utilisateur lit `currentUser` de `AuthFacade` (déjà en place) et appelle `logout()`. Le shell ne contient pas de logique métier.

### 4.2 Éléments réutilisables — `shared/ui`
Au Sprint 2, **privilégier l'usage direct des composants Material** plutôt que de les wrapper. On ne crée un wrapper que s'il porte une vraie valeur ajoutée (cohérence/répétition). Candidats :

| Élément | Décision | Justification |
|---|---|---|
| Boutons | **Material direct** (`matButton`, `matButton="filled"`, etc.) | Pas de wrapper nécessaire ; la cohérence vient du thème |
| Champs de formulaire | **Material direct** (`mat-form-field` + `matInput`) | idem |
| Carte (`mat-card`) | **Material direct** | suffit pour cartes auth/dashboard |
| `LoadingSpinnerComponent` | **Créer** (petit wrapper) | spinner centré réutilisable (page/section) → `mat-progress-spinner` |
| `EmptyStateComponent` | **Créer (léger)** | icône + titre + texte + action optionnelle ; réutilisé dès que des listes vides apparaissent (Rendez-vous bientôt) |
| `AlertComponent` (bandeau inline) | **Créer (léger)** | message contextuel persistant (erreur de formulaire serveur, info) — distinct du snackbar ; encapsule le rôle ARIA |
| Notifications transitoires | **Material `MatSnackBar`** via un petit service `NotificationService` | centralise durée/position/typage (succès/erreur) — voir §5 |
| Avatar / badge de rôle | **Plus tard** | non requis par les écrans actuels |
| Table de données | **Plus tard** (`mat-table`) | arrive avec la liste des rendez-vous |
| Dialog de confirmation | **Plus tard** (`MatDialog`) | utile à l'annulation de RDV (hors Sprint 2) |

---

## 5. États & feedback

**Règles d'état pour chaque écran/action :**

- **Loading**
  - Soumission de formulaire (login/register) : bouton **désactivé** + libellé « … » (déjà le pattern actuel) ; optionnellement `mat-progress-bar` fin en haut de la carte. Ne jamais masquer le formulaire.
  - Chargement de page/section (futur) : `LoadingSpinnerComponent` centré dans la zone, avec `aria-busy="true"` sur le conteneur.
- **Vide** : `EmptyStateComponent` (icône neutre + phrase explicative + action « Créer… » si pertinent). Pas de page blanche.
- **Erreur**
  - Erreur de **champ** : message sous le champ via `mat-error` (form-field Material), couleur `--mp-color-error`.
  - Erreur **serveur** d'un formulaire (401/409/423…) : `AlertComponent` inline en haut de la carte, `role="alert"` (pattern déjà présent dans login). Mapper les codes via le helper existant `shared/http/http-error-message.ts`.
  - Le **423 Locked** (compte verrouillé 15 min) : message explicite et rassurant (« Trop de tentatives. Réessayez dans quelques minutes. »), pas de jargon.
- **Focus / hover / disabled** : fournis par Material (états par défaut), recolorés via tokens. Focus clavier **toujours visible** (§6). `disabled` = `--mp-color-text-disabled`, jamais d'opacité seule (contraste).

**Règles d'usage des snackbars/toasts (`MatSnackBar`) :**
- Réserver le snackbar aux **confirmations transitoires d'action réussie** (« Rendez-vous annulé », « Profil mis à jour ») et aux **erreurs non bloquantes** ponctuelles.
- **Ne pas** utiliser le snackbar pour une erreur de validation de formulaire (→ inline) ni pour une info que l'utilisateur doit pouvoir relire (→ Alert inline).
- Durée : succès ~3 s ; erreur ~5 s + action « Fermer ». Position : bas-centre (cohérent). Un seul snackbar à la fois (Material empile/remplace). `politeness="assertive"` pour les erreurs, `polite` pour les confirmations.
- Centraliser dans un `NotificationService` (signatures `success(msg)`, `error(msg)`) pour garantir durée/position/ARIA homogènes.

---

## 6. Accessibilité

### 6.1 Contrastes (vérification AA sur fond clair)

Ratios calculés (texte normal AA = ≥ 4.5:1 ; éléments UI/grand texte = ≥ 3:1) :

| Couple | Ratio approx. | Verdict |
|---|---|---|
| Texte `#1A2233` sur fond `#F7F9FC` | ~14:1 | ✅ AAA |
| Texte `#1A2233` sur surface `#FFFFFF` | ~15.8:1 | ✅ AAA |
| Texte secondaire `#4A5568` sur `#FFFFFF` | ~8.0:1 | ✅ AAA |
| Texte désactivé `#6B7280` sur `#FFFFFF` | ~5.0:1 | ✅ AA (et reste lisible) |
| Blanc `#FFFFFF` sur primaire `#1565C0` | ~5.0:1 | ✅ AA (texte normal) |
| Blanc `#FFFFFF` sur primaire-hover `#0D47A1` | ~8.6:1 | ✅ AAA |
| Blanc `#FFFFFF` sur accent teal `#00897B` | ~3.3:1 | ⚠️ **Échoue AA pour texte normal** (OK pour grand texte/UI ≥3:1) |
| Erreur `#C62828` sur `#FFFFFF` | ~5.7:1 | ✅ AA |
| Succès `#2E7D32` sur `#FFFFFF` | ~4.9:1 | ✅ AA |
| Avertissement `#B45309` sur `#FFFFFF` | ~4.9:1 | ✅ AA |

**Point d'attention signalé : `--mp-color-accent` teal `#00897B` ne passe pas AA pour du texte normal en blanc dessus (~3.3:1).** Règle imposée :
- N'utiliser le teal **que** comme couleur d'élément/accent (bordures, icônes ≥ 24 px, badges avec grand texte, état de focus secondaire), **jamais** comme fond de bouton portant du texte normal blanc.
- Si un bouton/texte teal est nécessaire, prévoir une variante foncée `--mp-teal-800 = #00695C` (blanc dessus ≈ 4.7:1 ✅). À ajouter aux primitifs si le besoin se confirme.

### 6.2 Focus visible
- Anneau de focus **toujours visible** au clavier : `outline: 2px solid var(--mp-color-focus-ring); outline-offset: 2px;` sur les éléments interactifs. Ne **jamais** faire `outline: none` sans alternative visible. Material fournit déjà des indicateurs de focus ; les conserver et les recolorer via tokens.

### 6.3 Navigation clavier (sidenav + menu)
- **Sidenav** : items focusables et activables au clavier (Tab/Shift+Tab, Entrée). En mode `over` (mobile), **piéger le focus** dans le panneau ouvert ; `Échap` ferme et **rend le focus au burger**. Le scrim est cliquable ET le panneau refermable au clavier.
- **Menu utilisateur** (`mat-menu`) : ouverture au clavier, navigation flèches, `Échap` ferme et rend le focus au déclencheur (comportement Material par défaut — le conserver).
- Burger : `mat-icon-button` avec `aria-label="Ouvrir le menu"` / `"Fermer le menu"` (libellé dynamique selon l'état), `aria-expanded` reflétant l'état du sidenav.

### 6.4 ARIA / labels
- **Skip link** « Aller au contenu » en tout premier élément focusable, pointant vers l'id de la zone `<router-outlet>` (`<main id="main-content">`).
- Tous les `mat-icon-button` ont un `aria-label` explicite (les icônes seules n'ont pas de texte).
- La zone de contenu = balise `<main>` ; le sidenav = `<nav aria-label="Navigation principale">`.
- Un seul `<h1>` par page (titre de page) ; hiérarchie de titres respectée.
- Messages d'erreur reliés aux champs par `aria-describedby` (déjà fait dans login — généraliser via `mat-form-field`/`mat-error` qui gère ce lien nativement).
- `lang="fr"` sur `<html>`.

### 6.5 Cibles tactiles
- Toute cible interactive ≥ **44 × 44 px** (items de nav, burger, menu, boutons). Material respecte cela à `density: 0` ; ne pas réduire la densité sous 0 sur les éléments tactiles.

### 6.6 À tester (checklist)
- [ ] Parcours complet au clavier (login → dashboard → ouvrir/fermer sidenav → menu → déconnexion) sans souris.
- [ ] Skip link fonctionnel.
- [ ] Focus jamais perdu / jamais invisible.
- [ ] Lecteur d'écran : annonce des erreurs (`role="alert"`), du titre de page, des libellés de boutons icône.
- [ ] Zoom navigateur 200 % sans perte de contenu/fonction.
- [ ] Contraste vérifié sur les états hover/disabled réels (pas seulement repos).

---

## 7. Restyle des écrans existants

Deux layouts distincts. Login/register sont **publics** → **hors shell**, en layout « auth » centré. Le dashboard est **protégé** → **dans le shell**.

### 7.1 Layout « auth » (login, register) — hors shell
Écran centré, sobre, sans toolbar ni sidenav. Carte unique sur fond `--mp-color-background`.

```
┌───────────────────────────────────────────────┐
│            (fond --mp-color-background)         │
│                                                 │
│              ⊕  MediPlan                        │  ← logo + nom (centré)
│        ┌─────────────────────────────┐          │
│        │  mat-card (radius-lg, elev-1)│          │
│        │  H1  Connexion               │          │
│        │  [AlertComponent si erreur]  │          │
│        │  mat-form-field  E-mail      │          │
│        │  mat-form-field  Mot de passe│          │
│        │  [ Se connecter ] (filled)   │          │
│        │  Pas de compte ? Créer un... │          │
│        └─────────────────────────────┘          │
│                                                 │
└───────────────────────────────────────────────┘
```
Restyle concret (mapping de l'existant) :
- `<section class="auth-card">` → `mat-card` centrée (largeur max ~420 px, centrée via Tailwind `mx-auto` + flex container plein écran).
- `<label> + <input>` natifs → `mat-form-field` + `matInput` (le lien label/erreur/`aria-describedby` devient natif). Conserver `autocomplete`, `data-testid`, et la logique Signals/validators déjà en place.
- `<p class="auth-error" role="alert">` → `AlertComponent` (conserve `role="alert"` et `data-testid`).
- Bouton submit → `matButton="filled"`, état `loading()` → `disabled` + libellé « Connexion… » (inchangé). Optionnel : `mat-progress-bar` en tête de carte.
- Lien « Créer un compte » → `a matButton` ou lien stylé (conserver `routerLink`).
- Register : même gabarit, champs supplémentaires, mêmes règles.
- **Layout component** : un `AuthLayoutComponent` léger dans `core/layout` (ou `features/auth`) qui centre la carte — réutilisé par login et register. Les routes login/register ne passent **pas** par `LayoutShellComponent`.

### 7.2 Layout « app » (dashboard et écrans protégés) — dans le shell
Le dashboard devient un **enfant du `LayoutShellComponent`** : il s'affiche dans `<router-outlet>`, entouré du header + sidenav.

Restructuration de routing recommandée (à confirmer, voir §8) : envelopper les routes protégées sous une route parente portant le shell.
```
routes:
  - { path: 'login',  canActivate:[guestGuard], → LoginPage }     // hors shell (AuthLayout)
  - { path: 'register', canActivate:[guestGuard], → RegisterPage } // hors shell (AuthLayout)
  - { path: '', component: LayoutShellComponent, canActivate:[authGuard], children: [
        { path: 'dashboard', → DashboardPage },
        // futurs: appointments, profile
        { path: '', pathMatch:'full', redirectTo:'dashboard' },
    ]}
  - { path: '**', redirectTo: 'dashboard' }
```
Restyle du dashboard existant :
- `<section class="dashboard-card">` → `mat-card`. Le bouton « Se déconnecter » **déménage dans le menu utilisateur du header** (évite la double déconnexion) ; on peut le retirer de la carte ou le conserver provisoirement le temps de la migration.
- `<dl class="user-info">` (email, rôle) → conservé, stylé via tokens (typo body / caption). `displayName()`, `roleLabel()`, `data-testid` inchangés.
- Le titre « Tableau de bord » reste le `<h1>` de la page (un seul H1, le logo du header n'est pas un titre).

---

## Points à valider avec le client avant implémentation

1. **Comportement du sidenav replié sur desktop** : repli complet (recommandé, simple) **vs** mode « rail » d'icônes. → proposition : repli complet au Sprint 2, rail « plus tard ».
2. **Accent teal `#00897B`** : confirmer qu'il restera **réservé aux accents/icônes** et **pas** comme fond de bouton à texte blanc (échoue AA en texte normal). Si un bouton teal est voulu, valider l'ajout d'une variante foncée `#00695C`.
3. **Restructuration des routes** (route parente `LayoutShellComponent` enveloppant les écrans protégés) : impacte `app.routes.ts` actuel — à confirmer avec l'architecte/dev frontend.
4. **Emplacement du bouton « Se déconnecter »** : uniquement dans le menu utilisateur du header (recommandé) — confirme qu'on le retire de la carte dashboard.
5. **Items de navigation** : « Tableau de bord / Rendez-vous / Profil » sont des **placeholders** ; « Rendez-vous » et « Profil » n'ont pas encore d'écran. Afficher dès maintenant (désactivés/« bientôt ») ou n'afficher que « Tableau de bord » ? → proposition : afficher les 3, désactiver ceux sans écran.
6. **Police Roboto** : auto-hébergée (recommandé, hors-ligne/perf) vs Google Fonts CDN. → proposition : auto-hébergée.
```
