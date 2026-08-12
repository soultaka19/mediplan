---
workflow: general-video
flow: automation
storyboard: no
message: "Une plage saisie une fois génère ses créneaux — et un créneau annulé repart à la vente"
destination: presentation
aspect: 1920x1080
language: fr
length: 3m45s
audience: "Jury académique — Collège la Cité, présentation finale du 13 août 2026"
angle: parcours
---

## Intent

Film de démonstration de MediPlan, plateforme de gestion de rendez-vous
médicaux, pour la présentation finale du projet intégrateur. Il sert deux
usages : appui de la démonstration orale, et **solution de repli** si
l'application en ligne ou le réseau font défaut le jour J — la professeure l'a
explicitement prévue comme telle.

Le fil n'est pas « voici nos fonctionnalités », c'est **une journée à la
réception d'une clinique**. Chaque étape s'enchaîne par une raison métier.

Ton : sobre et démonstratif. Le film doit **prouver** des règles métier plutôt
que faire défiler des écrans — les deux sommets sont la génération automatique
des créneaux à partir d'une seule plage saisie, et l'annulation, qui exige un
motif avant de laisser confirmer.

## Assets

- `media/soul-clean.mp4` — capture Souleymane, recadrée (1920×970) et normalisée à −16 LUFS. Connexion, tableau de bord, publication d'une plage.
- `media/larbi-clean.mp4` — capture Larbi, recadrée (1280×606, barre des tâches retirée) et normalisée. Statistiques et rôle médecin.
- `media/zak-clean.mp4` — capture Zakaria, recadrée (1912×1000, bandeau navigateur et infobulle `localhost` retirés) et normalisée. Réservation, cycle de vie, conclusion. Deux plans utilisent `videoIn` pour écarter la fenêtre 27,5–33,2 s, où l'autocomplétion de Chrome expose son nom réel.
- `assets/annulation-dialogue.png` — recadré depuis `audit-12-cancel-confirm.png` : le dialogue d'annulation, motif obligatoire et confirmation désactivée. C'est la matière du chapitre 04, qu'aucun rush ne filme.
- `PLAN-MONTAGE.md` — l'analyse mesurée des rushes et le conducteur en 15 repères. Source de vérité du montage.
- `../../../apps/frontend/src/styles/_theme.scss` — les jetons de design du produit. La palette du film en est tirée, elle n'est pas inventée.

## Customizations

- **Sous-titres français incrustés** sur toute la durée — audibilité en salle,
  accessibilité, et correction des tournures fautives sans réenregistrer les
  voix (décision utilisateur).
- **La scène** : aucune capture n'occupe le cadre entier. Chacune est posée dans
  un cadre de fenêtre à **1280 px de large**, ce qui met les trois définitions
  à la même taille optique et évite tout agrandissement de la capture 720p.
- **Chiffres redonnés en typographie vectorielle** sur les passages de Larbi
  (186 RDV · 7,5 % no-show · 66 % occupation), avec défilement de compteur : sa
  capture 720p ne supporte pas le rapprochement.
- **Pastilles de statut animées** au rythme des clics, aux couleurs réelles du
  thème (Réservé → Arrivé → En consultation → Terminé).

## Notes

- **76 % des rushes sont des images fixes.** Le film est porté par la voix ;
  tout le mouvement est de la mise en scène. Aucune animation d'attente : chaque
  mouvement sert une phrase.
- Les trois voix sont calées à **−16,1 / −16,0 / −16,1 LUFS** — l'écart d'origine
  de 7,2 LU est corrigé. Ne pas y retoucher.
- **Aucune nouvelle prise ne sera tournée** (décision du 12 août). Le chapitre 04
  est monté à partir de la capture d'audit. Le film montre que l'annulation
  exige un motif ; il **ne montre pas** le créneau qui repart à la vente, faute
  d'asset — et aucun texte à l'écran ne l'affirme.
- Ne jamais laisser apparaître `localhost`, une barre des tâches, ni la moindre
  donnée personnelle. C'est la raison d'être des recadrages.
- Pas de musique tant qu'elle n'est pas demandée : un jury académique n'en
  attend pas.
