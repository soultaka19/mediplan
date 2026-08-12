# Présentation finale — jeudi 13 août 2026

Tout ce qui sert à présenter MediPlan devant le jury. Les supports des revues de
sprint précédentes sont dans [`../archives/presentations-intermediaires/`](../archives/presentations-intermediaires/).

---

## Les cinq pièces

| Fichier | Rôle |
|---|---|
| [`PLAN-FINALISATION.md`](PLAN-FINALISATION.md) | **Le document de pilotage.** Minutage, répartition de la parole, plan horaire, couverture de la grille d'évaluation, plan de repli |
| [`MediPlan-Presentation-Finale.pptx`](MediPlan-Presentation-Finale.pptx) | Le support — 16 diapositives, orateur et minutage portés sur chacune |
| [`SCENARIO-DEMO-Finale.md`](SCENARIO-DEMO-Finale.md) | Le parcours de démonstration, **écrit en le jouant sur l'application en ligne** : chaque libellé cité a été observé |
| [`CONTRIBUTIONS.md`](CONTRIBUTIONS.md) | Qui a fait quoi, retracé commit par commit — et la liste de questions que chacun doit savoir traiter |
| [`video/`](video/) | Le projet de montage de la vidéo de démonstration |

`build_presentation_finale_pptx.py` régénère le support (`pip install python-pptx`).

---

## La vidéo

**4 min 05**, 1920 × 1080, les trois voix, sous-titres incrustés. Elle sert deux
usages : livrable de la remise, et **solution de repli** si l'application ou le
réseau font défaut le jour J — la professeure l'a explicitement prévue comme
telle.

Le master est produit dans `video/out/mediplan-demo.mp4`. Il **n'est pas
versionné** : 58 Mo de rendu et 380 Mo de rushes n'ont pas leur place dans le
dépôt (voir `.gitignore`). La chaîne de fabrication, elle, l'est —
[`video/PLAN-MONTAGE.md`](video/PLAN-MONTAGE.md) documente l'analyse des rushes
et le conducteur, et le montage se régénère à partir des sources.

> ⚠️ Le jour de la présentation, la vidéo doit être **sur le disque du portable**.
> Une copie dans le cloud ne sert à rien au moment précis où le réseau tombe.

---

## Le geste indispensable avant de passer

**Réveiller l'application** : ouvrir l'URL et se connecter une fois. Les
conteneurs dorment (scale-to-zero) et le premier accès prend 10 à 15 secondes.
Ensuite la navigation est instantanée.

Application :
`https://ca-mediplan-frontend.ashytree-9ad5012f.canadacentral.azurecontainerapps.io`

Les comptes de démonstration sont dans [`SCENARIO-DEMO-Finale.md`](SCENARIO-DEMO-Finale.md).
