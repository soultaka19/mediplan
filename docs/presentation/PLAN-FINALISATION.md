# Plan de finalisation — présentation du jeudi 13 août 2026

**MediPlan · projet intégrateur 030747 · Collège La Cité**
Souleymane DIALLO · Zakaria Lahouiri · Larbi Saib

> Écrit le **12 août 2026**, à J-1. Tout ce qui est affirmé « vérifié » ci-dessous
> l'a été le jour même, en exécutant la commande ou en ouvrant le fichier — pas de
> mémoire.

---

## 1. Ce qui est prêt, et comment nous le savons

| Livrable exigé | État | Vérification faite le 12 août |
|---|---|---|
| **PowerPoint** | ✅ 16 diapositives | `MediPlan-Presentation-Finale.pptx`, 16:9, orateur et minutage portés sur chaque diapositive |
| **Vidéo démonstrative ~5 min** | ✅ 4 min 05 | `video/out/mediplan-demo.mp4`, 1920×1080, −15,7 LUFS, les **trois voix** présentes |
| **Solution prête à être lancée** | ✅ en ligne | frontend HTTP 200 (9,9 s à froid) · `/health` 200 en 0,44 s · connexion `admin.demo` 200 en 0,99 s |
| **Jeu de démonstration du 13 août** | ✅ couvert | seed lancé le 10 août, fenêtre de 7 jours ; 24 créneaux, 9 RDV, 2 annulations, 15 libres |
| **Contributions individuelles** | ✅ rédigées | `CONTRIBUTIONS.md` — réalisations, difficulté, résolution et liste de questions par personne |
| **Tests et résultats** | ✅ 203 verts | `docs/tests/plan-et-resultats.md` — 70 backend, 133 frontend |
| **Scénario de démonstration** | ✅ écrit et joué | `SCENARIO-DEMO-Finale.md`, rejoué sur l'application en ligne le 10 et le 11 août |

Le fond est fait. Ce qui reste n'est pas de la production, c'est du **calage**.

---

## 2. Les cinq écarts à combler — par ordre de coût

### ① Le minutage annoncé dépasse le temps alloué — **1 min 15 de trop**

La somme des minutages portés sur les diapositives fait **16 min 15**, pour un
créneau de **15 minutes**. Et ce total suppose que personne ne dérive, ce qui
n'arrive jamais.

C'est le critère 2.7 (2 %), mais surtout c'est ce qui fait qu'on se fait couper
au milieu de la dernière diapositive — celle des contributions individuelles,
qui vaut 4 %.

**Correction : § 3.**

### ② Le scénario de démonstration fait 7 min 20 pour un créneau de 4 min

`SCENARIO-DEMO-Finale.md` compte 11 étapes minutées : 20 + 20 + 60 + 70 + 50 +
60 + 60 + 20 + 30 + 40 + 10 = **440 secondes**. La diapositive 8 alloue **4
minutes**. L'écart est de plus de 3 minutes.

C'est l'écart le plus dangereux des cinq : la démonstration pèse **6 %**, le plus
lourd de toute la grille, et c'est là que le temps s'effondre le plus vite.

**Correction : § 4.**

### ③ `AIDE-MEMOIRE.md` était périmé — et c'est la fiche qu'on aurait eue en main

> ✅ **Traité le 12 août** : le fichier est parti dans
> [`../archives/presentations-intermediaires/`](../archives/presentations-intermediaires/).
> La fiche du jour est le **§ 11 de ce document**. Ce qui suit explique pourquoi
> il ne fallait pas l'emporter.

Ce fichier datait du Sprint 2. Il disait :

- `http://127.0.0.1:4310` — nous démontrons sur **Azure** ;
- « les 3 compteurs sont des placeholders » — ils sont **alimentés** depuis la PR #29 ;
- « annuler = 1er ticket du Sprint 3 » — l'annulation est **livrée** (PR #15) ;
- `Grace Hopper` — le médecin de démonstration s'appelle **Sophie Bergeron** ;
- « 171 tests » — il y en a **203**.

Une fiche fausse est pire que pas de fiche. **Action : la remplacer par le § 11
de ce document, imprimé, ou la supprimer.**

### ④ La vidéo n'est ni versionnée ni déposée

`video/out/` est ignoré par git (à raison : 380 Mo de rushes + 58 Mo de master
n'ont rien à faire dans le dépôt). Conséquence : **le master n'existe qu'à un
seul endroit, sur un seul disque.**

Il pèse **57,7 Mo**. Si eCité refuse ce poids, il faut une copie allégée
**avant** de se retrouver devant le formulaire de dépôt.

**Action : § 5, créneau de ce soir.**

### ⑤ L'ordre de passage n'est pas connu

Bloc 1 (12 h – 15 h) ou bloc 2 (16 h – 19 h) : cela change l'heure de réveil des
conteneurs, l'heure de la répétition, et rien d'autre. Le plan du § 5 est écrit
en **T-x** relatifs pour être valable dans les deux cas.

---

## 3. Le minutage refait — cible 14 min 20, marge 40 s

On ne retouche pas le diaporama à J-1. On retouche **le débit et ce qu'on dit**,
diapositive par diapositive. Le principe : chaque diapositive garde son idée
maîtresse et perd ses exemples secondaires — ils reviennent en questions, où ils
comptent double.

| # | Diapositive | Annoncé | **Cible** | Ce qu'on retire |
|---|---|---|---|---|
| 2 | Le problème | 1 min | **50 s** | Lire 3 irritants sur 5, pas les 10 puces |
| 3 | Notre solution | 1 min | **55 s** | Les 3 colonnes sont lues en survol, pas puce à puce |
| 4 | Comment nous avons travaillé | 1 min | **45 s** | Ne pas relire les trois colonnes : nommer le découpage vertical |
| 5 | Jira et GitHub | 1 min | **45 s** | Les 4 chiffres, puis **uniquement** la dérive d'intégration |
| 6 | Architecture générale | 1 min 30 | **1 min 15** | Les 3 colonnes en 3 phrases ; garder le bandeau « comment ça se parle » |
| 7 | La double réservation | 1 min | **55 s** | Garder intacte — c'est le cœur du critère 2.3 |
| 8 | Intro démonstration | 30 s | **20 s** | Annoncer le fil, pas les 9 étapes |
| — | **Démonstration en direct** | 4 min | **4 min 15** | Voir § 4 |
| 10 | Ce que ça change | 45 s | **30 s** | 3 lignes sur 6, à voix haute ; la diapositive porte les autres |
| 11 | Tests et validation | 1 min | **50 s** | Le chiffre, la stratégie (« ce qui casse en silence »), l'aveu du bout-en-bout |
| 12 | Bogues corrigés | 1 min | **45 s** | 2 bogues racontés sur 4 ; les autres restent lisibles |
| 13 | Nos limites | 45 s | **40 s** | Une limite par colonne |
| 14 | La suite | 45 s | **40 s** | Les 3 titres + la phrase sur les rappels automatiques |
| 15 | Qui a fait quoi | 1 min | **55 s** | ~18 s chacun, chronométrées |
| | **Total** | **16 min 15** | **14 min 20** | |

### Répartition du temps de parole après recalage

| | Diapositives | Démonstration | Total |
|---|---|---|---|
| Souleymane | 2, 3, 6, 7 | annulation + patient | **5 min 33** |
| Larbi | 4, 5, 11, 12 | réservation + statistiques | **4 min 28** |
| Zakaria | 8, 10, 13, 14 | connexion → flux du jour | **4 min 18** |

Écart maximal : 1 min 15 sur 14. C'est équilibré au sens du critère 2.7, et
chacun parle **de ce qu'il a construit** — ce qui alimente directement 2.5 et
2.6.

---

## 4. La démonstration ramenée à 4 min 15

### La règle : un seul pilote au clavier, trois voix

Zakaria tient la souris du début à la fin. Personne ne change de place, personne
ne se passe l'ordinateur. Chacun **parle** quand vient sa partie ; le pilote
suit. C'est exactement la convention de la vidéo, et cela supprime le risque
principal d'une démo à trois : les 15 secondes perdues à chaque échange de siège.

### Le déroulé

| Étape | Voix | Annoncé | **Cible** | Pourquoi elle reste |
|---|---|---|---|---|
| 0 · Connexion | Zakaria | 20 s | **15 s** | Établit le rôle et le profil serveur |
| 1 · Tableau de bord | Zakaria | 20 s | **15 s** | Chiffres réels, calculés en base |
| 2 · Publier une plage | Zakaria | 60 s | **40 s** | **Sommet n° 1** : une plage saisie une fois génère ses créneaux |
| 3 · Réserver au téléphone | **Larbi** | 70 s | **45 s** | Le cas d'usage central — et sa fonctionnalité |
| 4 · Flux du jour | Zakaria | 60 s | **40 s** | La vue partagée réception / médecin |
| 5 · Annulation + preuve | **Souleymane** | 60 s | **45 s** | **Sommet n° 2** : le motif est obligatoire, le créneau est libéré |
| 3 bis · Le patient réserve seul | **Souleymane** | 50 s | **35 s** | Enchaîne sur le créneau qu'on vient de libérer |
| 7 · Statistiques | **Larbi** | 30 s | **20 s** | Ferme sur la valeur métier — et sa fonctionnalité |
| | | **6 min 10** | **4 min 15** | |

### Ce qu'on retire du direct — et pourquoi ce n'est pas une perte

| Étape retirée | Où elle survit |
|---|---|
| 6 · Export CSV (20 s) | Diapositive 3 ; démontrable en question |
| 8 · Le RBAC vu à l'écran (40 s) | Diapositive 6 ; démontrable en question, en 20 s |
| 9 · Mode sombre (10 s) | Anecdotique — un clic si on a de l'avance |

Aucune n'est un critère d'évaluation. Toutes les trois restent **prêtes à être
jouées** si une question les appelle : c'est même la meilleure façon de les
montrer, parce qu'à ce moment-là c'est le jury qui les a demandées.

### Le point à vérifier en répétition

L'enchaînement **étape 5 → étape 3 bis** est le plus fort de toute la
démonstration : on annule un rendez-vous, puis un patient reprend le créneau
libéré, en libre-service. Cela prouve d'un seul geste la règle métier *et* le
second canal.

Mais il exige deux conditions : le rendez-vous annulé doit être **à venir**, et
le patient de démonstration doit être dans **la même clinique**. Les deux sont
vraies dans le jeu de démonstration actuel — **à confirmer en rejouant le
parcours ce soir**. Si l'enchaînement ne tient pas, on garde les deux étapes
séparées et on l'annonce en mots au lieu de le montrer.

---

## 5. Le plan, créneau par créneau

### Ce soir, 12 août — 1 h 30

| | Quoi | Qui | Fait |
|---|---|---|---|
| 30 min | **Répétition intégrale chronométrée**, diapositives + démonstration, sur l'application en ligne. Un chronomètre visible. On ne s'arrête pas, on note. | tous | ☐ |
| 10 min | Vérifier l'enchaînement **annulation → réservation patient** (§ 4) | Souleymane | ☐ |
| 10 min | Copier `video/out/mediplan-demo.mp4` sur **clé USB** + **OneDrive/Drive** + garder l'original sur le portable de présentation | Souleymane | ☐ |
| 5 min | Produire une **copie allégée** au cas où eCité refuse 57,7 Mo : `ffmpeg -i mediplan-demo.mp4 -c:v libx264 -crf 26 -preset slow -c:a aac -b:a 128k mediplan-demo-leger.mp4` | Souleymane | ☐ |
| 10 min | **Déposer le PPTX et la vidéo sur eCité** — ne pas attendre demain (§ 9) | Souleymane | ☐ |
| 10 min | **Imprimer le § 11** de ce document, une copie chacun *(`AIDE-MEMOIRE.md` est déjà archivé)* | Larbi | ☐ |
| 15 min | Chacun relit **sa** section de `CONTRIBUTIONS.md` et répond à voix haute aux questions de sa liste | tous | ☐ |

> ⚠️ Si la répétition dépasse 15 min, **on coupe encore** — dans la démonstration
> d'abord (étape 1, puis étape 4), jamais dans les contributions individuelles.

### Demain matin, avant de partir

| | Quoi | Qui |
|---|---|---|
| ☐ | Portable **chargé**, chargeur dans le sac | chacun |
| ☐ | Clé USB avec `mediplan-demo.mp4` **et** le PPTX | Souleymane |
| ☐ | PPTX ouvert **une fois** pour vérifier qu'il s'ouvre sur la machine de présentation | Souleymane |
| ☐ | Fiche § 11 imprimée × 3 | Larbi |

### T-30 minutes — dans le bâtiment

| | Quoi | Qui |
|---|---|---|
| ☐ | **Réveiller l'application** : ouvrir l'URL, se connecter en `admin.demo`, naviguer 3 écrans, se déconnecter. Compter 10 à 15 s au premier accès. | Zakaria |
| ☐ | Vérifier que le **flux du jour du 13 août n'est pas vide** — c'est le seul symptôme qui impose de basculer sur la vidéo | Zakaria |
| ☐ | Ouvrir la vidéo **depuis le disque local** (pas depuis le cloud) pour confirmer qu'elle se lit | Souleymane |
| ☐ | Fermer Teams, Discord, Outlook, notifications Windows ; **un seul onglet** | tous |
| ☐ | Fenêtre de navigation privée, **F11 plein écran** — pas de barre d'adresse, pas de barre des tâches | Zakaria |

### T-5 minutes

| | Quoi |
|---|---|
| ☐ | Session **fermée** sur l'écran de connexion — on saisit les identifiants devant la salle |
| ☐ | PPTX en mode présentateur, diapositive 1 affichée |
| ☐ | Vidéo ouverte dans un lecteur, **en pause**, dans un second espace — pas à chercher en cas de panne |
| ☐ | Chronomètre lancé par celui qui ne parle pas en premier |

---

## 6. Couverture des consignes — élément par élément

### Éléments à préparer

| Consigne | Où | État |
|---|---|---|
| PowerPoint prêt **et soumis sur eCité** | `MediPlan-Presentation-Finale.pptx` | ✅ prêt · ☐ **à soumettre** |
| Vidéo démonstrative ~5 min, tutoriel du **point de vue utilisateur** | `video/out/mediplan-demo.mp4` — 4 min 05 | ✅ prêt · ☐ **à soumettre** |
| **Chaque membre participe à la vidéo** | Les trois voix, sous-titrées et identifiées | ✅ |
| Solution prête à être lancée | Azure Container Apps, vérifiée le 12 août | ✅ |

### Éléments à présenter

| # | Exigé | Diapositive | État |
|---|---|---|---|
| 1a | Titre du projet | 1 | ✅ |
| 1b | Problématique / besoin | 2 | ✅ |
| 1c | Solution proposée | 3 (colonne « Ce que fait MediPlan ») | ✅ |
| 1d | Utilisateurs / clients visés | 3 (colonne « Pour qui » — 4 rôles) | ✅ |
| 1e | Objectifs du projet | 3 (colonne « Nos objectifs ») | ✅ |
| 2a | Organisation du travail en équipe | 4 | ✅ |
| 2b | Répartition des responsabilités | 4 | ✅ |
| 2c | Utilisation de Jira et GitHub | 5 (51 tickets, 21 PR, 7 épiques, le flux) | ✅ |
| 2d | Principales étapes du développement | 5 (le flux ticket → branche → PR → CI) | ⚠️ **implicite** — voir ci-dessous |
| 3a | Architecture générale | 6 (bandeau « comment les parties se parlent ») | ✅ |
| 3b | Frontend | 6 | ✅ |
| 3c | Backend | 6 | ✅ |
| 3d | Base de données | 6 | ✅ |
| 3e | Principales fonctionnalités | 3 et 10 | ✅ |
| 3f | Lien entre les parties | 6, bandeau du bas | ✅ |
| 4a | Scénario de démonstration clair | 9 + `SCENARIO-DEMO-Finale.md` | ✅ |
| 4b | Fonctionnalités principales | démonstration, § 4 | ✅ |
| 4c | Fonctionnement général | démonstration | ✅ |
| 4d | Lien avec les besoins utilisateurs | 10 (irritant → réponse, ligne à ligne) | ✅ |
| 4e | Valeur ajoutée | 10 | ✅ |
| 5a | Tests réalisés | 11 | ✅ |
| 5b | Résultats obtenus | 11 (203 verts) | ✅ |
| 5c | Bogues identifiés | 12 | ✅ |
| 5d | Corrections apportées | 12 | ✅ |
| 5e | Stabilité | 11 + « aucune erreur console », vérifié le 10 août | ✅ |
| 6a | Limites actuelles | 13 | ✅ |
| 6b | Ce qui pourrait être amélioré | 13 | ✅ |
| 6c | Fonctionnalités futures | 14 | ✅ |
| 6d | Stratégies de progression | 14 (bandeau du bas) | ✅ |
| 7 | Contribution individuelle × 3 | 15 + `CONTRIBUTIONS.md` | ✅ |

**Le seul trou : 2d, « principales étapes du développement ».** La diapositive 5
décrit *comment* on travaillait, pas *par quoi on est passé*. Il n'y a rien à
ajouter au diaporama — **une phrase à dire** suffit, par Larbi, en ouvrant la
diapositive 5 :

> « Nous sommes passés par quatre étapes : la conception — cahier des charges et
> diagrammes ; puis le socle — monorepo, Docker, CI ; puis l'authentification et
> les rôles ; puis le rendez-vous, de la disponibilité jusqu'à l'annulation. La
> mise en ligne a été faite en parallèle de la dernière étape, pas à la fin. »

---

## 7. Couverture de la grille — où se gagnent les 30 %

| Critère | % | Ce qui le sert déjà | Ce qui le mettrait en danger |
|---|---|---|---|
| **2.1** Structure et clarté | 5 | L'ordre problème → solution → démarche → architecture → démo → tests → limites → suite suit la grille point par point | Dériver sur la technique en diapositive 6 ou 7 |
| **2.2** Support visuel | 4 | 16 diapositives, orateur et minutage portés dessus, chiffres en gros | **Lire les puces à voix haute** — la faute la plus coûteuse ici |
| **2.3** Explication des choix | 5 | Diapositive 7 (double réservation), diapositive 6 (ingress interne → pas de CORS), les migrations, Azure vs Railway | Dire « on a choisi X » sans dire *contre quoi* |
| **2.4** Démonstration | **6** | Scénario joué et vérifié deux fois en ligne ; deux sommets métier ; vidéo de repli | Déborder, déboguer devant la salle, ou tomber sur un flux du jour vide |
| **2.5** Participation individuelle | 4 | 5 min 33 / 4 min 28 / 4 min 18, et chacun démontre sa propre fonctionnalité | Qu'une personne réponde à la place d'une autre |
| **2.6** Réponses individuelles | 4 | `CONTRIBUTIONS.md` porte une liste de questions par personne | Improviser sur la partie d'un autre |
| **2.7** Temps et fluidité | 2 | Minutage recalé à 14 min 20 | Les transitions non préparées entre orateurs |

### Les trois réflexes qui rapportent le plus

1. **Ne jamais lire une puce.** La diapositive est lue par le jury pendant qu'on
   parle. On raconte ce qui n'est pas écrit dessus.
2. **Chacun répond pour lui.** Si une question tombe sur la partie de quelqu'un
   d'autre, on dit « c'est la partie de X » et on lui laisse la parole. Le
   critère 2.6 est **individuel** : répondre à la place de quelqu'un lui coûte
   ses points.
3. **Assumer les limites.** La diapositive 13 dit que le décalage en bloc n'est
   pas intégré et que la définition de « terminé » a été trop souple. C'est ce
   qui distingue « Excellent » de « Très satisfaisant » : un jury croit une
   équipe qui sait où elle a échoué.

---

## 8. Ce que chacun doit maîtriser pour les 5 minutes de questions

Les listes complètes sont dans `CONTRIBUTIONS.md`. Voici les questions les plus
probables, celles qu'un jury pose quand la démonstration s'est bien passée.

### Souleymane

- Pourquoi le backend n'a-t-il aucune adresse publique ?
- Comment les secrets sont-ils gérés ?
- Pourquoi des migrations plutôt que la synchronisation automatique du schéma ?
- Un patient peut-il réserver au nom de quelqu'un d'autre ?
- Pourquoi un patient ne peut-il pas annuler lui-même ?
- **Qu'est-ce qu'un index unique *partiel*, et pourquoi partiel ?**

### Zakaria

- Comment les créneaux sont-ils générés à partir d'une plage ?
- Qui reçoit une notification, et à quel moment ?
- Pourquoi le décalage en bloc n'est-il pas dans le produit ?
- **Que feriez-vous différemment sur la gestion de vos branches ?**

### Larbi

- Que se passe-t-il si deux personnes réservent le même créneau en même temps ?
- Pourquoi le patient de comptoir n'a-t-il pas de compte ?
- Que mesurent vos statistiques, et pourquoi celles-là ?
- Les statistiques sont-elles bornées par clinique ?

### La question piège, pour tout le monde

> « Qu'est-ce qui, dans ce projet, ne marcherait pas dans une vraie clinique ? »

La réponse est déjà écrite en diapositive 13 : pas de pagination serveur, pas de
notification vers l'extérieur, multi-clinique peu outillé côté interface, et
aucun test de charge. **On la donne franchement.** Chercher à défendre le produit
sur ce terrain fait perdre plus que l'aveu.

---

## 9. La remise eCité

À déposer **ce soir**, pas demain matin :

1. `docs/presentation/MediPlan-Presentation-Finale.pptx`
2. `docs/presentation/video/out/mediplan-demo.mp4` *(ou la copie allégée si le
   poids est refusé)*

Liens à joindre si la zone de remise le permet — le format est déjà rodé dans
`docs/conception/SOUMISSION-eCITE.md` :

- Dépôt : `https://github.com/soultaka19/mediplan`
- Jira : `https://diallosouleymanetaka.atlassian.net/jira/software/projects/MEDIPLAN/boards`
- Application : `https://ca-mediplan-frontend.ashytree-9ad5012f.canadacentral.azurecontainerapps.io`

☐ Vérifier que **StephanieKa-2022** a bien accès au dépôt GitHub et à Jira — la
case était encore ouverte dans `SOUMISSION-eCITE.md`.

---

## 10. Le plan de repli — trois niveaux

La professeure a explicitement prévu la vidéo comme solution de remplacement.
L'utiliser n'est **pas** un échec : hésiter cinq minutes devant la salle, si.

| Niveau | Symptôme | Réaction | Décidé par |
|---|---|---|---|
| **1** | Une action échoue, ou l'écran ne réagit pas | **Une seule** nouvelle tentative. Pendant ce temps, continuer à parler. | le pilote |
| **2** | La seconde tentative échoue, ou le flux du jour est vide | Basculer sur la vidéo, au chapitre concerné. Dire : « on passe sur la démonstration enregistrée ». | Souleymane |
| **3** | Le réseau tombe, ou l'application ne répond plus du tout | Vidéo complète, en local, du début à la fin — 4 min 05, exactement le format du créneau de démonstration | Souleymane |

**Jamais** : ouvrir la console, relancer la page, expliquer ce qui se passe,
tenter une troisième fois. Le jury évalue la stabilité perçue, pas la ténacité.

> La vidéo doit être **sur le disque du portable**. Une vidéo hébergée dans le
> cloud ne sert à rien au niveau 3 — c'est précisément le niveau où le réseau est
> tombé.

---

## 11. La fiche du jour — à imprimer, une par personne

### Comptes

Dans `SCENARIO-DEMO-Finale.md` § « Comptes ». Réception = **Alice Tremblay**,
médecin = **Sophie Bergeron**, patiente = **Julie Caron**.

### Le déroulé de la démonstration — 4 min 15

```
Z  0 · Connexion ................. 15 s   session fermée au départ
Z  1 · Tableau de bord ........... 15 s   ne cliquer sur rien
Z  2 · Publier une plage ......... 40 s   ★ les créneaux se génèrent seuls
L  3 · Réserver au téléphone ..... 45 s   patient léger créé au comptoir
Z  4 · Flux du jour .............. 40 s   arrivé → consultation → terminé
S  5 · Annuler + la preuve ....... 45 s   ★ motif obligatoire, créneau libéré
S  3bis · Le patient réserve seul . 35 s   il reprend le créneau libéré
L  7 · Statistiques .............. 20 s   occupation, absences, par médecin
```

### Les interdits

1. **Jamais de F5.**
2. **Ne pas taper les dates au clavier** — passer par l'icône du calendrier.
3. **Ne pas cliquer l'accès rapide grisé « Médecins »** : cet écran n'existe pas.
4. **Ne pas supprimer une plage qui porte des rendez-vous** : refusé, volontairement.
5. **Ne pas promettre le décalage en bloc** — codé, non intégré, et c'est assumé.
6. **Ne pas lancer le seed.** Il écrase tout.
7. **Ne jamais déboguer devant la salle.** Une tentative, puis la vidéo.

### Les chiffres justes

| | |
|---|---|
| Tests automatisés verts | **203** — 70 backend, 133 frontend |
| Tickets Jira | **51**, 7 épiques |
| Pull requests | **21** |
| Fonctionnalités livrées | **9** |
| Coût d'hébergement | **~0 $/mois** |
| Contributeurs sur `main` | **3** |

### Si la page met du temps au premier accès

> « Nos conteneurs s'arrêtent quand personne ne les utilise. C'est ce qui met
> l'hébergement à zéro dollar par mois. »

C'est vrai, c'est un choix, et cela transforme dix secondes d'attente en argument.

---

## 12. Ce qu'il reste à décider, et par qui

| Question | Qui tranche | Quand |
|---|---|---|
| Garder ou non l'enchaînement annulation → réservation patient | Souleymane, après la répétition | ce soir |
| Bloc 1 ou bloc 2 — décale toute la colonne T-x du § 5 | l'ordre de passage, communiqué séparément | dès réception |
| Copie allégée de la vidéo nécessaire ou non | la limite de dépôt eCité | ce soir, au dépôt |

---

*Document de travail — à relire une fois ce soir après la répétition, et à ne
plus toucher ensuite.*
