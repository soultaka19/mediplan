# Spec de design — Modernisation UI « Direction A · Bleu clinique »

- **Date** : 2026-07-09
- **Statut** : proposé (en attente de validation)
- **Périmètre** : évolution du design system frontend (Angular Material 3 + Tailwind v4), appliquée globalement à tous les écrans.
- **Fichier pivot** : `apps/frontend/src/styles/_theme.scss` (source unique des tokens `--mp-*`, pont `--mat-sys-*`, thème clair/sombre).

## 1. Objectif

Donner à MediPlan une **identité visuelle forte** de type « Clinique & confiance » (déclinaison **A · Bleu clinique**, maquette v2 validée), sans refondre la structure des écrans. La modernisation passe par :
1. un **re-tuning des tokens** de couleur/typo vers Direction A ;
2. l'ajout de **tokens manquants** (teal signifiant, conteneurs « soft », sémantique) ;
3. la **codification de conventions de composants** (KPI, nav, chips, focus) ;
4. un **contrat d'accessibilité** testable.

La structure des pages, la navigation, le shell et les états (chargement/vide/erreur) **ne changent pas**.

## 2. Contexte et acquis (ne pas refaire)

Le design system existe déjà et est solide (`_theme.scss`) :
- Source unique `--mp-*` → pont `--mat-sys-*` en **clair et sombre** (le point « délicat » d'un thème Material est déjà résolu).
- Élévations « sobres » (2 couches, opacité plafonnée ~14 %), motion (≤ 240 ms, `prefers-reduced-motion` respecté), espacement base 4, rayons, focus-ring : **déjà définis**.
- Inter auto-hébergée comme famille de **titrage** (`--mp-font-display-family`) ; corps en Roboto.
- Mode sombre déjà excellent (validé en audit Playwright).

La modernisation **s'appuie dessus** et ne réécrit pas ce socle.

## 3. Décisions de design (Direction A · v2)

### 3.1 Règle des 3 rôles de couleur (invariant central)
- **Bleu = marque + action** (boutons, liens, état actif).
- **Teal = décoratif uniquement** en mode clair (aplats, barres d'accent, fonds de pastilles « soft », badge de rôle). **Jamais** de texte, icône ou indicateur *porteur de sens* en teal vif sur fond clair.
- **Vert = succès / tendance positive** (sémantique), **toujours accompagné d'une icône ou d'un texte** — jamais la couleur seule.

Un teal « signifiant » existe pour les rares cas où l'accent doit porter du sens en clair : token dédié **foncé** (AA).

### 3.2 Tokens couleur — cible (mode clair)

Primitifs à ajuster / ajouter :

| Token | Actuel | Cible A | Note |
|-------|--------|---------|------|
| primary | `#1565c0` | **`#1E5FA8`** | bleu institutionnel, 6.6:1 sur blanc (AA) |
| primary-hover/strong | `#0d47a1` | **`#17518F`** | |
| accent (teal décoratif) | `#00897b` | **`#16A6A6`** | **décoratif seulement** (aplats/bg soft) |
| accent-ink (teal signifiant) | — (nouveau) | **`#0F766E`** | ~5.4:1 sur blanc (AA) — pour teal porteur de sens en clair |
| accent-soft (conteneur) | `teal-50 #e0f2f0` | **`#DEF3F3`** | fond de pastille d'icône, badge de rôle |
| success | `#2e7d32` | **`#15803D`** | tendance/statut positifs |
| success-soft | — (nouveau) | **`#E6F4EC`** | fond de pastille de tendance/statut |
| background | `#f7f9fc` | **`#F6F8FB`** | quasi identique |
| surface | `#ffffff` | inchangé | |
| surface-variant | `#f1f5f9` | inchangé | |
| text | `#1a2233` | inchangé | |
| text-secondary (muted) | `#4a5568` | inchangé | ≥ 5:1 ; ne pas descendre sous 14 px |
| border | `#e2e8f0` | `#E7ECF3` | doubler toujours d'une ombre `--mp-elevation-1` |

Tokens sémantiques dérivés (inchangés dans leur principe) : `--mp-color-warning`, `--mp-color-error`, `--mp-color-info`, `--mp-color-focus-ring`.

### 3.3 Tokens couleur — mode sombre
Le teal **change de token** selon le thème : en sombre, le teal vif (`#3fc9b7` déjà présent) **peut** porter du sens (clair sur foncé, AA OK). On conserve les valeurs sombres existantes ; on ajoute uniquement les équivalents sombres des nouveaux tokens (`accent-ink`, `accent-soft`, `success-soft`) avec contraste AA re-vérifié. Le logo dégradé bleu→teal reçoit un léger halo/bordure clair pour rester lisible sur navy.

### 3.4 Typographie
- **Inter en famille UI complète** (corps + titrage), repli Roboto/system. Passer `plain-family` à Inter dans `mat.theme` (aujourd'hui Roboto).
- Poids nécessaires : **400 / 500 / 600 / 700 / 800** (vérifier/compléter l'auto-hébergement `@fontsource`, aujourd'hui 400/600/700).
- Échelle : display 30–32 / titre section 20 / valeur KPI 30–34 (700–800) / corps 14 / label 13 (600) / caption 12.
- **Numéraux tabulaires** (`font-variant-numeric: tabular-nums`) obligatoires sur : valeurs KPI, heures, dates, compteurs. Prévoir une classe utilitaire `.mp-tnum`.

### 3.5 Conventions de composants
- **StatCard / KPI** : pastille d'icône (`accent-soft` + icône `primary-strong`), valeur en numéraux tabulaires, **tendance = pastille verte `success-soft` + flèche + chiffre** (jamais teal, jamais couleur seule). Prévoir la variante « remplie » pour quand les vraies données existeront (aujourd'hui `—`/`bientôt`).
- **Nav item actif** : `accent-soft` en fond + **barre d'accent teal** `inset 3px` + texte `primary-strong` + gras (3 signaux, déjà en place).
- **Boutons** : primaires bleus (`filled`), secondaires outline bleus. Rayons `--mp-radius-lg`.
- **Chips de statut** : le **libellé porte le sens** ; couleur = renfort. Succès en vert, jamais en teal.
- **Logo** : pastille dégradé `primary → accent`.
- **En-tête utilisateur** : afficher le **nom** (pas l'e-mail) — corrige l'incohérence relevée à l'audit (greeting = nom, header = e-mail). Repli initiales/nom court en mobile.

### 3.6 Contrat d'accessibilité (définition-de-fait)
- **Contraste** : tout texte/icône/indicateur porteur de sens ≥ AA (4.5:1 texte, 3:1 grand texte/composants). Teal vif interdit sur fond clair pour du sens.
- **Focus visible** : `:focus-visible` avec anneau ≥ 2 px et ≥ 3:1 sur **tous les éléments custom** (cartes KPI cliquables, boutons custom, pastille logo) — Material masque parfois le focus derrière ses state-layers.
- **Cibles tactiles** ≥ 44 px (nav, toggle thème, caret utilisateur, boutons).
- **Information jamais portée par la couleur seule** (icône/texte en renfort).
- **`prefers-reduced-motion`** respecté (déjà en place) ; motion sobre 150–200 ms, pas de bounce.
- **Responsive** : palier tablette (KPI en 2 colonnes) entre desktop (3) et mobile (1).

## 4. Portée et séquencement

Le changement de tokens est **global** : il se répercute automatiquement sur tous les écrans via `_theme.scss` + le pont Material. Séquence d'implémentation proposée (à détailler dans le plan) :
1. **Tokens** (`_theme.scss` + `tailwind.css` + `fonts.css`) : nouvelles valeurs et nouveaux tokens, clair + sombre.
2. **Vérification transverse** : dashboard, disponibilités, flux du jour, utilisateurs, auth — en clair, sombre, mobile.
3. **Composants signature** : StatCard (KPI + tendance), logo pastille, en-tête (nom).
4. **Correctif d'accessibilité** : focus-visible custom + cibles.

## 5. Hors périmètre (non-goals)
- Aucune refonte de structure d'écran, de navigation ou de flux.
- Aucune nouvelle fonctionnalité métier (l'annulation/décalage/notifications restent des sujets Sprint 4 séparés).
- Pas de refonte du mode sombre (déjà bon ; seulement extension des nouveaux tokens).
- Pas de changement de bibliothèque de composants (on reste Material 3 + Tailwind).

## 6. Risques et points de vigilance
- **Discipline teal** : Material 3 *veut* utiliser `tertiary` (teal) comme couleur sémantique réelle (chips, sélection). Il faut **empêcher** M3 de peindre du texte/composant en teal vif en clair — géré par le pont `--mat-sys-*` (déjà en place) + revue ciblée des composants Material utilisant `tertiary`.
- **Contraste teal** : le seul vrai piège. `#16A6A6` sur blanc = 2.97:1 → décoratif uniquement ; sens = `accent-ink #0F766E`.
- **Poids de police** : vérifier que les poids Inter 500/800 sont bien auto-hébergés avant de les utiliser (sinon repli silencieux).
- **Régression visuelle** : le re-tuning touche tous les écrans → la vérification transverse (§4.2) est obligatoire, idéalement captures avant/après via Playwright.

## 7. Critères d'acceptation
- Les tokens `--mp-*` reflètent Direction A (clair + sombre) ; aucun hex en dur ajouté hors `_theme.scss`.
- Aucun teal vif porteur de sens sur fond clair (audit de contraste OK sur les écrans clés).
- KPI : tendance en vert + icône ; valeurs en numéraux tabulaires.
- En-tête affiche le nom, pas l'e-mail.
- Focus visible conforme sur les éléments custom ; cibles ≥ 44 px.
- Build + lint OK ; les tests existants passent ; vérification Playwright clair/sombre/mobile sans régression.
