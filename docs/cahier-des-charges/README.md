# Cahier des charges — LIV-05

Deux versions, et c'est délibéré.

| Version | Fichier | Date | Ce qu'elle dit |
|---|---|---|---|
| **v1.0** | [`Cahier_des_charges_MediPlan.docx`](Cahier_des_charges_MediPlan.docx) | 28 mai 2026 | Ce que nous avions **prévu**, avant d'écrire la moindre ligne de code |
| **v2.0** | [`Cahier-des-charges-v2.md`](Cahier-des-charges-v2.md) · [`.docx`](Cahier_des_charges_MediPlan_v2.docx) | 12 août 2026 | Ce que nous avons **fait**, et **où les deux s'écartent** |

## Pourquoi la v1.0 n'a pas été corrigée

Elle se terminait par cet engagement :

> « Il sera maintenu vivant tout au long du projet : toute évolution du périmètre
> ou des exigences entraînera une nouvelle révision documentée. »

Une révision documentée, pas une réécriture silencieuse. Modifier la v1.0 après
coup pour la faire coïncider avec le résultat effacerait précisément ce qui a de
la valeur : **l'écart entre l'intention et la livraison**, et ce qu'il apprend.

La v1.0 reste donc la référence de ce qui était prévu. La v2.0 est la référence
de ce qui existe.

## Conformité au gabarit fourni

La v2.0 suit le gabarit section par section, dans l'ordre :

| Gabarit | v2.0 |
|---|---|
| 1. Présentation du projet — 1.1 Contexte · 1.2 Objectifs · 1.3 Périmètre | § 1.1 · 1.2 · 1.3 |
| 2. Description fonctionnelle — 2.1 Besoins et exigences métiers *(problématique, utilisateurs cibles, scénarios)* · 2.2 Fonctionnalités · 2.3 Interface · 2.4 Conditions d'utilisation | § 2.1 · 2.2 · 2.3 · 2.4 |
| 3. Description technique — 3.1 Technologies · 3.2 Architecture · 3.3 Sécurité · 3.4 Performance et scalabilité | § 3.1 · 3.2 · 3.3 · 3.4 |
| 4. Planification et livrable — 4.1 Phases *(avec dates)* · 4.2 Livrables | § 4.1 · 4.2 *(+ 4.3 Suivi)* |
| 5. Modalité de validation | § 5 |
| 6. Conclusion | § 6 |

Deux ajouts, permis par la mention *« largement adapté en fonction des
particularités de vos projets »* : la **note de révision** en tête, et **quatre
annexes** (hypothèses, risques survenus, pistes d'évolution, références).

Le gabarit demande un diagramme de cas d'utilisation en § 2.1 et des dates en
§ 4.1 : les deux y sont — le diagramme par renvoi au dossier de conception, les
dates **relevées dans l'historique du dépôt**, pas reconstituées.

## Ce que la v2.0 apporte

- les **six écarts structurants**, chiffrés et qualifiés (dépassement,
  réorientation, réduction, non tenu) ;
- l'état de livraison de **chacune des 11 fonctionnalités** et des 11 livrables ;
- la section sécurité réécrite en deux colonnes : **ce qui est en place**, et
  **ce qui manque**, nommé sans détour ;
- les 7 indicateurs de succès d'origine, dont aucun n'a été mesuré selon la
  méthode annoncée, remplacés par **7 indicateurs réellement vérifiés** ;
- les risques de la matrice initiale confrontés à ceux qui se sont réellement
  produits — dont **deux qui n'y figuraient pas**, et qui ont coûté le plus cher.

Le `.md` est la source ; le `.docx` en est généré et sert à la remise.
