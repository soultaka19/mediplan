# Charte visuelle — film de démonstration MediPlan

Toutes les valeurs viennent de `apps/frontend/src/styles/_theme.scss`. Le film
et le produit doivent se ressembler ; rien n'est inventé.

## Concept

**Le produit est éclairé sur une scène sombre.** L'application est claire ; on la
pose sur le fond sombre du thème MediPlan, dans un cadre de fenêtre fixe. Le
contraste sépare nettement le logiciel de son commentaire, et il tient au
vidéoprojecteur.

## Cadre

| | |
|---|---|
| Canevas | 1920 × 1080, 30 i/s |
| Fond de scène | `#0f1722` (`--mp-color-background`, thème sombre) |
| Surface secondaire | `#172234` |

### La fenêtre — géométrie fixe, jamais recalculée

```
x = 320    y = 168    largeur = 1280    hauteur = 660
```

Toutes les captures entrent dans **cette même boîte**, en `object-fit: contain`
sur un fond `#0f1722`. Conséquence voulue :

| Source | Native | Dans la boîte | Échelle |
|---|---|---|---|
| Larbi | 1280 × 606 | 1280 × 606 | **1,00 ×** — jamais agrandi |
| Souleymane | 1920 × 970 | 1280 × 647 | 0,67 × |
| Zakaria | 1912 × 1000 | 1259 × 660 | 0,66 × |

Les bandes résiduelles (≤ 27 px) font partie du cadre. La fenêtre ne bouge ni ne
change de taille d'un chapitre à l'autre : c'est ce qui tient le film ensemble
malgré trois définitions différentes.

Habillage de la fenêtre : rayon `14px`, filet `1px` en `#2a384f`, ombre portée
douce vers le bas. Pas de fausse barre de titre, pas de faux boutons macOS — le
film n'imite pas un navigateur, il encadre une capture.

### Zones

| Zone | Bande verticale | Contenu |
|---|---|---|
| Titre de chapitre | 72 → 150 | numéro en mono + intitulé |
| Fenêtre | 168 → 828 | la capture |
| Annotations | marges 0 → 320 et 1600 → 1920 | étiquettes, chiffres vectoriels |
| Sous-titres | 880 → 1000 | texte centré, largeur max 1500 |

## Couleurs

| Rôle | Valeur | Origine |
|---|---|---|
| Fond | `#0f1722` | `--mp-color-background` (sombre) |
| Surface | `#172234` | `--mp-color-surface` (sombre) |
| Filet | `#2a384f` | `--mp-color-border` (sombre) |
| Texte | `#e6eaf2` | `--mp-color-text` (sombre) |
| Texte secondaire | `#a9b4c6` | `--mp-color-text-secondary` |
| Primaire | `#5b9be8` | `--mp-color-primary` (sombre, AA sur navy) |
| Accent | `#3fc9b7` | `--mp-color-accent` (sombre, AA) |
| Succès | `#5dd27a` | `--mp-color-success` |
| Alerte | `#f0707a` | `--mp-color-error` |

### Pastilles de statut — reprises telles quelles du thème clair

Utilisées pour l'animation du cycle de vie, en surimpression de la capture, donc
sur fond clair :

| Statut | Fond | Texte |
|---|---|---|
| Réservé | `#eef2f7` | `#4a5568` |
| Arrivé | `#e8f0fb` | `#1e5fa8` |
| En consultation | `#def3f3` | `#0f766e` |
| Terminé | `#e6f4ec` | `#15803d` |
| Annulé | `#fbe9e7` | `#c62828` |

## Typographie

**IBM Plex Sans** et **IBM Plex Mono** — les polices réelles de l'interface,
embarquées en `.woff2` dans `assets/fonts/` (aucun appel réseau, donc rendu
identique en local et en nuage).

| Usage | Police | Taille | Graisse |
|---|---|---|---|
| Titre de chapitre | Plex Sans | 46 px | 600 |
| Numéro de chapitre | Plex Mono | 20 px | 500, `letter-spacing: .18em`, majuscules |
| Étiquette d'annotation | Plex Sans | 28 px | 600 |
| Chiffre mis en avant | Plex Mono | 96 px | 500, chiffres tabulaires |
| Sous-titre | Plex Sans | 42 px | 500 |
| Carton de titre | Plex Sans | 88 px | 700 |

## Sous-titres

Centrés, deux lignes maximum, largeur maximale 1500 px. Texte `#e6eaf2` sur une
plaque `#0f1722` à 82 % d'opacité, rayon 10 px, marge intérieure 18/28 px.
Apparition et disparition nettes — pas de fondu long, pas de mot à mot animé :
le sous-titre est un service, pas un effet.

## Mouvement

Trois outils, pas davantage. Détail dans `PLAN-MONTAGE.md` § 6.3.

1. **Rapprochement motivé** — on se rapproche de l'élément dont on parle, au
   moment où on en parle. Jamais de zoom décoratif.
2. **Annotation vectorielle** — cadre et étiquette sur la zone commentée.
3. **Enchaînement continu** — la fenêtre ne disparaît pas entre deux chapitres ;
   c'est son contenu qui change. Aucun fondu au noir en cours de film.

**Aucune animation d'attente.** Rien ne « respire » à vide : 76 % des rushes
étant des images fixes, la tentation serait d'ajouter du mouvement pour meubler.
Chaque mouvement doit servir une phrase précise du commentaire.
