# Modernisation UI « Direction A · Bleu clinique » — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire évoluer le design system frontend vers l'identité « Bleu clinique » (Direction A · v2) sans refondre la structure des écrans.

**Architecture:** Re-tuning de la source unique de tokens `--mp-*` (`apps/frontend/src/styles/_theme.scss`) qui se propage à tous les écrans via le pont `--mat-sys-*` (déjà en place, clair + sombre) et via `tailwind.css`. Ajout de tokens manquants (teal signifiant, conteneurs « soft »), correctifs ciblés de composants (StatCard, en-tête, focus), puis vérification visuelle transverse via Playwright.

**Tech Stack:** Angular 22 (standalone, Signals), Angular Material 3, Tailwind v4, SCSS/CSS custom properties, `@fontsource` (Inter/Roboto), Vitest/Jasmine (tests existants), playwright-cli (vérif visuelle).

## Global Constraints

- Source unique des tokens : `apps/frontend/src/styles/_theme.scss`. **Aucun hex en dur** hors de ce fichier.
- Règle des 3 rôles de couleur : **bleu = marque/action**, **teal = décoratif seul en mode clair**, **vert = succès/tendance (+ icône/texte)**. Jamais d'information portée par la couleur seule.
- Teal signifiant en mode clair = `#0F766E` (AA). Teal vif `#16A6A6` = décoratif uniquement.
- Contraste AA (4.5:1 texte, 3:1 grand texte/composants). `:focus-visible` ≥ 2 px / ≥ 3:1 sur éléments custom. Cibles tactiles ≥ 44 px. `prefers-reduced-motion` respecté.
- Aucune mention Claude / `Co-Authored-By` dans les commits (préférence projet).
- Chaque tâche se termine par : `pnpm --filter @mediplan/frontend lint` + `pnpm --filter @mediplan/frontend test` au vert (adapter le nom du filtre au `package.json`), puis commit.

---

### Task 1 : Tokens couleur Direction A (clair + sombre)

**Files:**
- Modify: `apps/frontend/src/styles/_theme.scss` (primitifs `:root` ~L17-31, sémantiques ~L34-54, bloc `[data-theme='dark']` ~L157-177)
- Modify: `apps/frontend/src/styles/tailwind.css` (réexposition `@theme` ~L25-38)

**Interfaces:**
- Produces (nouveaux tokens sémantiques consommés par les tâches suivantes) :
  `--mp-color-accent-ink`, `--mp-color-accent-soft`, `--mp-color-success-soft`
  (+ classes Tailwind `text-accent-ink`, `bg-accent-soft`, `bg-success-soft`).

- [ ] **Step 1 : Mettre à jour les primitifs (mode clair)** dans `_theme.scss` `:root`

Remplacer les valeurs primitives par la palette Direction A et ajouter les 3 nouvelles :

```scss
  // --- 1) Tokens primitifs (palette « Bleu clinique » — Direction A) ---------
  --mp-blue-900: #17518f; // primary-strong / hover
  --mp-blue-700: #1e5fa8; // primary (6.6:1 sur blanc, AA)
  --mp-blue-50:  #e8f0fb;
  --mp-teal-600: #16a6a6; // teal VIF — décoratif uniquement en clair
  --mp-teal-700: #0f766e; // teal SIGNIFIANT (5.4:1 sur blanc, AA)
  --mp-teal-800: #00695c;
  --mp-teal-50:  #def3f3; // conteneur « soft »
  --mp-bg:       #f6f8fb;
  --mp-surface:  #ffffff;
  --mp-ink-900:  #1a2233;
  --mp-ink-600:  #4a5568;
  --mp-ink-400:  #6b7280;
  --mp-line-200: #e7ecf3;
  --mp-green-700: #15803d;
  --mp-green-50:  #e6f4ec; // success « soft »
  --mp-amber-800: #b45309;
  --mp-red-700:   #c62828;
```

- [ ] **Step 2 : Ajouter les tokens sémantiques (mode clair)** juste après `--mp-color-accent` (~L38)

```scss
  --mp-color-accent: var(--mp-teal-600);       // teal décoratif (aplats/bg soft)
  --mp-color-accent-ink: var(--mp-teal-700);   // teal porteur de sens (clair, AA)
  --mp-color-accent-soft: var(--mp-teal-50);   // fond de pastille d'icône / rôle
  --mp-color-on-accent: #ffffff;
```

et après `--mp-color-success` (~L51) :

```scss
  --mp-color-success: var(--mp-green-700);
  --mp-color-success-soft: var(--mp-green-50); // fond de pastille tendance/statut
```

- [ ] **Step 3 : Ajouter les équivalents sombres** dans le bloc `[data-theme='dark']` (après `--mp-color-accent: #3fc9b7;`)

```scss
  --mp-color-accent: #3fc9b7;         // teal vif — peut signifier en sombre (AA)
  --mp-color-accent-ink: #5fded0;     // teal signifiant sombre (clair sur navy)
  --mp-color-accent-soft: #123b38;    // conteneur teal sombre
  --mp-color-success: #5dd27a;
  --mp-color-success-soft: #123320;   // conteneur succès sombre
```

- [ ] **Step 4 : Réexposer les nouveaux tokens à Tailwind** dans `tailwind.css` `@theme` (après `--color-accent`)

```css
  --color-accent: var(--mp-color-accent);
  --color-accent-ink: var(--mp-color-accent-ink);
  --color-accent-soft: var(--mp-color-accent-soft);
  --color-success: var(--mp-color-success);
  --color-success-soft: var(--mp-color-success-soft);
```

- [ ] **Step 5 : Vérifier le build**

Run: `pnpm --filter @mediplan/frontend build`
Expected: build OK, aucune erreur SCSS/PostCSS.

- [ ] **Step 6 : Vérifier visuellement le contraste teal en clair (Playwright)**

```bash
playwright-cli -s=uicheck open --browser=chrome
playwright-cli -s=uicheck goto "http://localhost:4200/login"
# connexion admin, dashboard, puis inspecter une pastille d'accent
playwright-cli -s=uicheck --raw eval "getComputedStyle(document.documentElement).getPropertyValue('--mp-color-accent-ink')"
playwright-cli -s=uicheck close
```
Expected: `--mp-color-accent-ink` = `#0f766e`. Aucun texte teal vif sur fond clair.

- [ ] **Step 7 : Lint + commit**

```bash
pnpm --filter @mediplan/frontend lint
git add apps/frontend/src/styles/_theme.scss apps/frontend/src/styles/tailwind.css
git commit -m "feat(ui): palette Direction A (bleu clinique) + tokens teal-ink/soft, clair et sombre"
```

---

### Task 2 : Typographie Inter (UI complète) + numéraux tabulaires

**Files:**
- Modify: `apps/frontend/src/styles/fonts.css` (imports `@fontsource/inter`)
- Modify: `apps/frontend/src/styles/_theme.scss` (`--mp-font-family` ~L57 ; `mat.theme(... typography.plain-family)` ~L124 et ~L191 ; ajout classe utilitaire)
- Modify: `package.json` (dépendance `@fontsource/inter` — vérifier présence des poids)

**Interfaces:**
- Produces : classe utilitaire globale `.mp-tnum` (numéraux tabulaires) consommée par Task 4.

- [ ] **Step 1 : Vérifier/compléter les poids Inter auto-hébergés**

Vérifier que `@fontsource/inter` fournit 500 et 800 :
```bash
ls apps/frontend/node_modules/@fontsource/inter/ | grep -E "^(500|800)\.css$"
```
S'ils existent, ajouter dans `fonts.css` (après les imports Inter existants) :
```css
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/800.css';
```
Sinon, ne PAS référencer un poids absent (repli silencieux) : conserver 400/600/700 et limiter l'échelle typo à ces poids à l'étape 3.

- [ ] **Step 2 : Passer la police UI (corps) à Inter** dans `_theme.scss`

Remplacer `--mp-font-family` (~L57) :
```scss
  --mp-font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
```
et dans les DEUX blocs `mat.theme(...)` (clair ~L124 et sombre ~L191), remplacer :
```scss
        plain-family: 'Inter, system-ui, sans-serif',
```

- [ ] **Step 3 : Ajouter la classe utilitaire numéraux tabulaires** en fin de `_theme.scss`

```scss
// Numéraux tabulaires : chiffres de largeur fixe (KPI, heures, dates, compteurs).
.mp-tnum {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}
```

- [ ] **Step 4 : Build + vérif visuelle rapide**

Run: `pnpm --filter @mediplan/frontend build`
Expected: build OK. Puis via Playwright, vérifier qu'un titre rend bien en Inter :
```bash
playwright-cli -s=uicheck open "http://localhost:4200/login"
playwright-cli -s=uicheck --raw eval "getComputedStyle(document.querySelector('h1')).fontFamily"
playwright-cli -s=uicheck close
```
Expected: la chaîne commence par `Inter`.

- [ ] **Step 5 : Lint + commit**

```bash
pnpm --filter @mediplan/frontend lint
git add apps/frontend/src/styles/fonts.css apps/frontend/src/styles/_theme.scss
git commit -m "feat(ui): Inter en police UI complète + utilitaire numéraux tabulaires"
```

---

### Task 3 : Correctif nom d'en-tête (DRY, jamais l'e-mail complet)

**Files:**
- Create: `apps/frontend/src/app/shared/user/display-name.ts`
- Create: `apps/frontend/src/app/shared/user/display-name.spec.ts`
- Modify: `apps/frontend/src/app/core/layout/layout-shell/layout-shell.ts` (displayName ~L99-106)
- Modify: `apps/frontend/src/app/features/dashboard/dashboard-page.ts` (greetingName ~L97-109)

**Interfaces:**
- Produces : `resolveDisplayName(user: { firstName?: string | null; lastName?: string | null; email?: string | null } | null): string`
  → « Prénom Nom » si présent, sinon la partie locale de l'e-mail (avant `@`), sinon `''`. Ne renvoie **jamais** un e-mail complet.

- [ ] **Step 1 : Écrire le test qui échoue** — `shared/user/display-name.spec.ts`

```ts
import { resolveDisplayName } from './display-name';

describe('resolveDisplayName', () => {
  it('renvoie « Prénom Nom » si présents', () => {
    expect(resolveDisplayName({ firstName: 'Grace', lastName: 'Hopper', email: 'g@x.io' })).toBe('Grace Hopper');
  });
  it('replie sur la partie locale de l’e-mail, jamais l’e-mail complet', () => {
    expect(resolveDisplayName({ firstName: null, lastName: null, email: 'admin.demo@mediplan.test' })).toBe('admin.demo');
  });
  it('gère un seul nom présent', () => {
    expect(resolveDisplayName({ firstName: 'Ada', lastName: null, email: 'a@x.io' })).toBe('Ada');
  });
  it('renvoie une chaîne vide si utilisateur null', () => {
    expect(resolveDisplayName(null)).toBe('');
  });
});
```

- [ ] **Step 2 : Lancer le test → échec attendu**

Run: `pnpm --filter @mediplan/frontend test -- display-name`
Expected: FAIL (`resolveDisplayName` introuvable).

- [ ] **Step 3 : Implémenter** — `shared/user/display-name.ts`

```ts
/** Utilisateur minimal pour dériver un nom affichable. */
export interface NameableUser {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

/**
 * Nom affichable : « Prénom Nom » si présent, sinon la partie locale de
 * l'e-mail (avant `@`). Ne renvoie jamais un e-mail complet (cf. spec Direction A
 * §3.5 : en-tête au nom, pas à l'e-mail).
 */
export function resolveDisplayName(user: NameableUser | null): string {
  if (!user) {
    return '';
  }
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (fullName) {
    return fullName;
  }
  const email = user.email?.trim() ?? '';
  return email.split('@')[0]?.trim() ?? '';
}
```

- [ ] **Step 4 : Lancer le test → succès attendu**

Run: `pnpm --filter @mediplan/frontend test -- display-name`
Expected: PASS (4 tests).

- [ ] **Step 5 : Utiliser le helper dans le shell** — `layout-shell.ts`

Remplacer le corps du `computed` `displayName` (~L99-106) par :
```ts
  readonly displayName = computed(() => resolveDisplayName(this.user()));
```
et ajouter l'import en tête : `import { resolveDisplayName } from '@shared/user/display-name';`

- [ ] **Step 6 : Utiliser le helper dans le dashboard** — `dashboard-page.ts`

Remplacer le corps du `computed` `greetingName` (~L97-109) par :
```ts
  readonly greetingName = computed(() => resolveDisplayName(this.user()));
```
et ajouter l'import : `import { resolveDisplayName } from '@shared/user/display-name';`
(Conserver `displayName` local s'il sert ailleurs ; sinon le remplacer aussi par le helper.)

- [ ] **Step 7 : Vérifier en live que l'en-tête n'affiche plus l'e-mail (Playwright)**

```bash
playwright-cli -s=uicheck open "http://localhost:4200/login"
playwright-cli -s=uicheck fill "getByTestId('login-email')" "admin.demo@mediplan.test"
playwright-cli -s=uicheck fill "getByTestId('login-password')" "Adm1n!Secret"
playwright-cli -s=uicheck click "getByTestId('login-submit')"
playwright-cli -s=uicheck --raw eval "document.querySelector('[data-testid=shell-user-name]')?.textContent?.trim() ?? document.querySelector('.mp-toolbar__user-name')?.textContent?.trim()"
playwright-cli -s=uicheck close
```
Expected: « Alan Turing » (nom), pas « admin.demo@mediplan.test ».

- [ ] **Step 8 : Lint + commit**

```bash
pnpm --filter @mediplan/frontend lint
git add apps/frontend/src/app/shared/user/ apps/frontend/src/app/core/layout/layout-shell/layout-shell.ts apps/frontend/src/app/features/dashboard/dashboard-page.ts
git commit -m "fix(ui): en-tête affiche le nom (partie locale de l'e-mail en repli, jamais l'e-mail complet)"
```

---

### Task 4 : StatCard modernisé (numéraux tabulaires + pastille d'icône + tendance verte optionnelle)

**Files:**
- Modify: `apps/frontend/src/app/shared/ui/stat-card/stat-card.ts`
- Modify: `apps/frontend/src/app/shared/ui/stat-card/stat-card.html`
- Modify: `apps/frontend/src/app/shared/ui/stat-card/stat-card.scss`
- Modify: `apps/frontend/src/app/shared/ui/stat-card/stat-card.spec.ts`

**Interfaces:**
- Consumes : classe `.mp-tnum` (Task 2), tokens `--mp-color-accent-soft`, `--mp-color-success`, `--mp-color-success-soft` (Task 1).
- Produces : `StatCard` gagne deux entrées optionnelles `trend: string` (ex. `'+2'`) et `trendUp: boolean`. La tendance rend un **texte + icône** (jamais couleur seule), en vert sémantique. Absente par défaut → aucun rendu (YAGNI : pas de fausse donnée).

- [ ] **Step 1 : Écrire le test qui échoue** — ajouter dans `stat-card.spec.ts`

```ts
it('affiche la tendance en texte + icône quand fournie', () => {
  fixture.componentRef.setInput('label', 'RDV du jour');
  fixture.componentRef.setInput('value', '8');
  fixture.componentRef.setInput('trend', '+2');
  fixture.componentRef.setInput('trendUp', true);
  fixture.detectChanges();
  const trend = fixture.nativeElement.querySelector('.mp-stat__trend');
  expect(trend).toBeTruthy();
  expect(trend.textContent).toContain('+2');
  // Information non portée par la seule couleur : une icône accompagne le texte.
  expect(trend.querySelector('mat-icon')).toBeTruthy();
});

it('ne rend aucune tendance par défaut', () => {
  fixture.componentRef.setInput('label', 'RDV du jour');
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('.mp-stat__trend')).toBeNull();
});
```

- [ ] **Step 2 : Lancer → échec attendu**

Run: `pnpm --filter @mediplan/frontend test -- stat-card`
Expected: FAIL (`.mp-stat__trend` inexistant / input `trend` inconnu).

- [ ] **Step 3 : Ajouter les entrées** dans `stat-card.ts` (après `hint`)

```ts
  /** Tendance optionnelle (ex. « +2 »). Vide = non affichée. */
  readonly trend = input('');
  /** Sens de la tendance : true = hausse (icône ↑), false = baisse (icône ↓). */
  readonly trendUp = input(true);
  /** Vrai si une tendance est fournie. */
  readonly hasTrend = computed(() => this.trend().trim().length > 0);
```

- [ ] **Step 4 : Rendre la tendance** dans `stat-card.html` (après le bloc `mp-stat__value`, avant `hint`)

```html
    @if (hasTrend()) {
      <p class="mp-stat__trend" [class.mp-stat__trend--down]="!trendUp()">
        <mat-icon aria-hidden="true">{{ trendUp() ? 'trending_up' : 'trending_down' }}</mat-icon>
        <span class="mp-tnum">{{ trend() }}</span>
      </p>
    }
```

Et ajouter la classe `.mp-tnum` sur la valeur numérique (`mp-stat__number`) :
```html
      <span
        class="mp-stat__number mp-tnum"
        [class.mp-stat__number--placeholder]="isPlaceholder()"
        aria-hidden="true"
        >{{ value() }}</span
      >
```

- [ ] **Step 5 : Styliser** dans `stat-card.scss` (pastille d'icône teal-soft + tendance verte)

```scss
.mp-stat__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--mp-radius-lg);
  background: var(--mp-color-accent-soft);
  color: var(--mp-color-primary-hover);
}

.mp-stat__trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 8px 0 0;
  padding: 3px 9px;
  border-radius: var(--mp-radius-full);
  font-size: 12px;
  font-weight: 700;
  color: var(--mp-color-success);
  background: var(--mp-color-success-soft);

  mat-icon {
    font-size: 16px;
    width: 16px;
    height: 16px;
  }

  &--down {
    color: var(--mp-color-error);
    background: color-mix(in srgb, var(--mp-color-error) 12%, transparent);
  }
}
```

- [ ] **Step 6 : Lancer → succès attendu**

Run: `pnpm --filter @mediplan/frontend test -- stat-card`
Expected: PASS (tests existants + 2 nouveaux).

- [ ] **Step 7 : Lint + commit**

```bash
pnpm --filter @mediplan/frontend lint
git add apps/frontend/src/app/shared/ui/stat-card/
git commit -m "feat(ui): StatCard — pastille d'icône teal-soft, numéraux tabulaires, tendance verte (texte+icône)"
```

---

### Task 5 : Contrat d'accessibilité — focus visible custom + cibles tactiles

**Files:**
- Modify: `apps/frontend/src/styles/_theme.scss` (ajout d'une règle globale `:focus-visible`)
- Modify: `apps/frontend/src/app/features/availabilities/availabilities-page.html` (si des boutons icône < 44 px)
- Modify: `apps/frontend/src/app/core/layout/layout-shell/layout-shell.scss` (logo pastille) et `auth-layout.scss`
- Modify: `apps/frontend/src/app/features/dashboard/dashboard-page.scss` (grille KPI tablette)

**Interfaces:** aucune (styles globaux).

- [ ] **Step 1 : Ajouter l'anneau de focus global** en fin de `_theme.scss`

```scss
// Focus visible homogène sur les éléments interactifs custom (Material masque
// parfois le focus derrière ses state-layers). Anneau ≥ 2px, ≥ 3:1.
:where(a, button, [tabindex], .mp-stat, .mp-quick__item):focus-visible {
  outline: 3px solid var(--mp-color-accent-ink);
  outline-offset: 2px;
  border-radius: var(--mp-radius-md);
}
@media (prefers-reduced-motion: reduce) {
  * { scroll-behavior: auto; }
}
```

- [ ] **Step 2 : Build**

Run: `pnpm --filter @mediplan/frontend build`
Expected: build OK.

- [ ] **Step 3 : Vérifier le focus au clavier (Playwright)**

```bash
playwright-cli -s=uicheck open "http://localhost:4200/login"
playwright-cli -s=uicheck press Tab
playwright-cli -s=uicheck --raw eval "const el=document.activeElement; getComputedStyle(el).outlineStyle"
playwright-cli -s=uicheck close
```
Expected: `outlineStyle` = `solid` sur l'élément focalisé.

- [ ] **Step 4 : Vérifier les cibles tactiles ≥ 44 px** (boutons icône de Disponibilités)

Inspecter `availabilities-page.html` (boutons `matIconButton` « Voir les créneaux » / « Supprimer », ~L159-175). Si leur hauteur de rendu < 44 px, ajouter une classe et une règle dans `_theme.scss` :
```scss
.mp-touch-target { min-width: 44px; min-height: 44px; }
```
Appliquer `class="mp-touch-target"` sur ces boutons.

- [ ] **Step 5 : Logo pastille dégradé** (signature §3.5) — dans `layout-shell.scss`, styliser `.mp-toolbar__logo`

```scss
.mp-toolbar__logo {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, var(--mp-color-primary), var(--mp-color-accent));
}
```
Faire de même pour `.mp-auth__logo` dans `auth-layout.scss`. En mode sombre, ajouter un léger halo pour la lisibilité sur navy :
```scss
[data-theme='dark'] .mp-toolbar__logo,
[data-theme='dark'] .mp-auth__logo {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.14);
}
```

- [ ] **Step 6 : KPI en 2 colonnes sur tablette** (§3.6) — dans `dashboard-page.scss`, sur `.dashboard-stats`

```scss
@media (max-width: 1024px) and (min-width: 641px) {
  .dashboard-stats { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .dashboard-stats { grid-template-columns: 1fr; }
}
```
(Adapter le sélecteur si la grille est déjà déclarée ; ne dupliquer que les paliers manquants.)

- [ ] **Step 7 : Build + vérif responsive (Playwright)**

Run: `pnpm --filter @mediplan/frontend build`
Puis vérifier à 800 px que les KPI sont sur 2 colonnes :
```bash
playwright-cli -s=uicheck open "http://localhost:4200/login"
# (connexion admin comme Task 3, puis)
playwright-cli -s=uicheck resize 800 1000
playwright-cli -s=uicheck goto "http://localhost:4200/dashboard"
playwright-cli -s=uicheck --raw eval "getComputedStyle(document.querySelector('.dashboard-stats')).gridTemplateColumns.split(' ').length"
playwright-cli -s=uicheck close
```
Expected: `2`.

- [ ] **Step 8 : Lint + commit**

```bash
pnpm --filter @mediplan/frontend lint
git add apps/frontend/src/styles/_theme.scss apps/frontend/src/app/features/availabilities/availabilities-page.html apps/frontend/src/app/core/layout/ apps/frontend/src/app/features/dashboard/dashboard-page.scss
git commit -m "feat(ui): focus visible, cibles >= 44px, logo pastille degrade, KPI tablette 2 colonnes"
```

---

### Task 6 : Vérification visuelle transverse (clair / sombre / mobile)

**Files:**
- Create: `docs/reflexion-ux-ui/audit-apres-modernisation.md` (récap + chemins des captures)

**Interfaces:** aucune (vérification, pas de code applicatif).

- [ ] **Step 1 : Capturer chaque écran avant régression** (les 3 rôles, clair + sombre + mobile)

```bash
SS="docs/reflexion-ux-ui/audit-after"
mkdir -p "$SS"
playwright-cli -s=uicheck open --browser=chrome
playwright-cli -s=uicheck resize 1440 900
# admin
playwright-cli -s=uicheck goto "http://localhost:4200/login"
playwright-cli -s=uicheck fill "getByTestId('login-email')" "admin.demo@mediplan.test"
playwright-cli -s=uicheck fill "getByTestId('login-password')" "Adm1n!Secret"
playwright-cli -s=uicheck click "getByTestId('login-submit')"
for r in dashboard availabilities clinic-flow/today admin/users; do
  playwright-cli -s=uicheck goto "http://localhost:4200/$r"
  playwright-cli -s=uicheck screenshot --filename="$SS/admin-${r//\//-}.png"
done
# sombre + mobile
playwright-cli -s=uicheck goto "http://localhost:4200/dashboard"
playwright-cli -s=uicheck click "getByTestId('shell-theme-toggle')"
playwright-cli -s=uicheck screenshot --filename="$SS/dark-dashboard.png"
playwright-cli -s=uicheck resize 390 844
playwright-cli -s=uicheck screenshot --filename="$SS/mobile-dashboard.png"
playwright-cli -s=uicheck close
```

- [ ] **Step 2 : Contrôler les erreurs console = 0 sur chaque écran**

Pendant la navigation ci-dessus, après chaque `goto`, exécuter `playwright-cli -s=uicheck console error` et vérifier « Errors: 0 ».
Expected: 0 erreur sur tous les écrans/rôles.

- [ ] **Step 3 : Rédiger le récap** dans `docs/reflexion-ux-ui/audit-apres-modernisation.md`

Contenu : tableau écran × (clair/sombre/mobile) avec statut OK/écart, confirmation « teal jamais signifiant sur fond clair », « en-tête = nom », « focus visible », « 0 erreur console ». Lister les captures.

- [ ] **Step 4 : Vérification finale + commit**

```bash
pnpm --filter @mediplan/frontend lint
pnpm --filter @mediplan/frontend test
pnpm --filter @mediplan/frontend build
git add docs/reflexion-ux-ui/audit-apres-modernisation.md docs/reflexion-ux-ui/audit-after/
git commit -m "docs(ui): vérification visuelle transverse post-modernisation (clair/sombre/mobile)"
```

---

## Notes d'exécution
- Prérequis : app lancée (`pnpm dev`), comptes démo disponibles (admin/doctor/patient — voir plan). Adapter le nom exact du filtre pnpm au `package.json` (ex. `@mediplan/frontend` ou `frontend`).
- Après chaque tâche, une revue visuelle clair/sombre est recommandée avant de passer à la suivante (le changement de tokens est transverse).
- Ne pas généraliser avant d'avoir confirmé le contraste teal (Task 1, Step 6).
