# Rapport final de projet — MediPlan

**Plateforme web de gestion des rendez-vous médicaux**

| | |
|---|---|
| Cours | Projet intégrateur 030747 — Programmation informatique |
| Établissement | Collège La Cité |
| Session | Printemps 2026 |
| Équipe | Souleymane DIALLO · Zakaria Lahouiri · Larbi Saib |
| Date | 12 août 2026 |
| Application | `https://ca-mediplan-frontend.ashytree-9ad5012f.canadacentral.azurecontainerapps.io` |
| Dépôt | `https://github.com/soultaka19/mediplan` |

---

## 1 · L'idée du projet

MediPlan est un agenda partagé pour une clinique médicale de petite ou moyenne
taille. Il fait tenir dans un seul écran ce qui, aujourd'hui, est éparpillé entre
un téléphone, un cahier et un fichier de calcul : les disponibilités des médecins,
les rendez-vous, l'état de la journée en cours, et les chiffres qui permettent de
piloter l'activité.

L'idée tient en une phrase : **outiller la réception, pas remplacer le
téléphone.** Nous n'avons pas cherché à construire un Doctolib. Nous avons cherché
à donner à la personne qui décroche le téléphone un outil qui l'empêche de se
tromper.

---

## 2 · Le problème identifié

Dans une partie des cliniques de proximité, la prise de rendez-vous reste
organisée avec des outils hétérogènes. La littérature en gestion des services de
santé documente les conséquences ; nous en avons retenu cinq, parce qu'elles se
traduisent toutes en gestes concrets à l'accueil.

| L'irritant | Ce qu'il coûte |
|---|---|
| Deux personnes réservent le même créneau | Une double réservation à démêler **devant le patient** |
| Un rendez-vous annulé n'est jamais remis en circulation | Un créneau perdu, donc du temps médecin non facturé |
| Personne n'a de vue partagée sur la journée | On se lève pour demander qui est arrivé |
| Le patient doit se créer un compte pour exister | Friction inutile : au téléphone, il n'ouvre pas de compte |
| Aucune donnée n'est mesurée | Impossible de savoir si l'agenda est bien rempli ou si les absences dérapent |

**Le constat qui a orienté tout le projet.** Notre cahier des charges initial
posait le patient comme utilisateur principal, sur le modèle des plateformes grand
public. En travaillant le besoin, nous avons retenu un constat plus resserré :
**dans une petite clinique, le patient appelle — il ne s'inscrit pas.**
L'utilisateur qui vit le problème n'est pas le patient, c'est la réception.

Ce déplacement d'angle est le choix produit le plus structurant que nous ayons
fait, et il a réorganisé le reste : le modèle de données, l'ordre des écrans, et
jusqu'au fil de la démonstration.

### Les utilisateurs visés

Quatre rôles : l'**administrateur de clinique** (la réception — l'utilisateur
principal), le **médecin**, le **patient**, et le **super administrateur**. Chacun
ne voit que les données de sa clinique, et cette séparation est appliquée par le
serveur, pas par l'affichage.

---

## 3 · La solution développée

### Ce que fait l'application

**Le médecin publie une plage de disponibilité** — une date, deux bornes horaires,
une durée de créneau. Le système **génère tout seul** les créneaux réservables. Une
plage de 9 h à 12 h en créneaux de 30 minutes produit six créneaux, sans autre
saisie. C'est le geste qui économise le plus de temps dans l'application.

**La réception réserve pour un patient au téléphone.** Trois gestes : le médecin,
le créneau, le patient. Le patient est créé au comptoir sous forme de **patient
léger** — il existe dans le système, sans compte ni mot de passe.

**Un patient inscrit peut aussi réserver seul.** C'est le second canal. Les deux
empruntent la même transaction, le même verrou et le même index : la garantie ne
dépend pas du canal utilisé.

**La journée se suit dans le flux du jour**, vue partagée entre la réception et le
médecin. Chaque rendez-vous parcourt un cycle : Réservé → Arrivé → En consultation
→ Terminé, ou Annulé.

**L'annulation exige un motif.** Le bouton de confirmation reste inactif tant que
le champ est vide. Le créneau libéré **redevient immédiatement réservable**.

**Les statistiques** donnent le volume de rendez-vous, le taux d'absence et le taux
d'occupation, filtrables par période et par médecin.

### Le choix technique dont nous sommes le plus fiers

Empêcher qu'un créneau soit réservé deux fois paraît simple : on vérifie qu'il est
libre, puis on écrit. **Cette approche ne peut pas marcher.** Entre la vérification
et l'écriture, une autre requête peut passer. Les deux voient le créneau libre, les
deux réservent. Le défaut n'apparaît que sous charge — donc jamais pendant les
tests manuels, et toujours le jour où deux personnes travaillent en même temps.

Nous avons donc **sorti la garantie du code applicatif pour la poser dans la base**,
sous forme de contrainte d'unicité sur le créneau. Ce n'est plus notre code qui
arbitre la course, c'est PostgreSQL.

La contrainte a ensuite été transformée en **index unique partiel**, excluant les
rendez-vous annulés. C'est ce détail qui rend l'annulation possible : sans lui, un
créneau annulé resterait bloqué à jamais.

> **Ce que nous en retenons.** Quand une garantie dépend de la discipline du
> développeur, elle finit par tomber. Une garantie posée dans la base tient même si
> une fonctionnalité future oublie de vérifier.

### L'architecture

```
Navigateur
    │  HTTPS
Frontend Angular servi par nginx     ── Azure Container Apps (ingress public)
    │  proxy /api/
API REST NestJS                       ── Azure Container Apps (ingress INTERNE)
    │
PostgreSQL infogéré                   ── Neon
```

Trois décisions structurent cette architecture :

1. **Le backend n'a aucune adresse publique.** Il n'est joignable que par le
   frontend. Cela le met hors d'atteinte directe depuis Internet — et supprime tout
   besoin de configuration CORS, puisqu'il n'y a jamais de requête inter-origines.
2. **Toute l'infrastructure naît d'un template Bicep.** Aucune ressource n'a été
   créée à la main, et chaque déploiement est prévisualisé avant d'être appliqué.
3. **Le schéma de base est piloté uniquement par des migrations versionnées.**
   N'importe qui reconstruit exactement le même schéma.

Le coût d'hébergement est maintenu à **environ 0 $ par mois** — contrainte d'un
crédit étudiant non renouvelable. Le prix payé est un démarrage à froid de 10 à
15 secondes, assumé.

---

## 4 · Les principales étapes du travail

| Étape | Ce qui a été fait |
|---|---|
| **Conception** | Cahier des charges, 7 cas d'utilisation, diagramme de classes, 3 diagrammes de séquence, diagramme entité-association |
| **Socle technique** | Monorepo Turborepo + pnpm, conteneurisation Docker Compose, intégration continue GitHub Actions |
| **Authentification et sécurité** | Inscription, connexion JWT, hachage bcrypt, verrouillage après échecs, réinitialisation, contrôle d'accès à 4 rôles |
| **Le rendez-vous** | Disponibilités et génération des créneaux, patient léger, réservation, flux du jour, annulation, notifications |
| **Mesure et second canal** | Tableaux de bord et statistiques, export CSV, réservation en libre-service par le patient |
| **Mise en ligne** | Infrastructure Azure en Bicep, base infogérée, publication des images |
| **Consolidation** | Réintégration des branches restées à l'écart, remise en cohérence de Jira avec le dépôt |

**Ces étapes ne se sont pas succédé, elles se sont chevauchées.** Nous avons
découpé le travail **par tranche verticale** : chacun mène sa fonctionnalité de la
migration jusqu'à l'écran, plutôt qu'une séparation « un front / un back ». La mise
en ligne, en particulier, a été faite **en parallèle** du dernier sprint et non à
la fin — c'est ce qui nous a permis de découvrir tôt les écarts entre
l'environnement local et la production.

### L'organisation

**Jira** (projet MEDIPLAN) — 51 tickets, 7 épiques. **GitHub** — 21 pull requests,
3 contributeurs sur `main`. Le flux : un ticket → une branche → une pull request →
une revue → l'intégration continue. **La CI bloque la fusion** si la compilation ou
les tests échouent.

---

## 5 · Ce qui a changé pendant le projet

C'est la section la plus utile de ce rapport, parce que c'est là que nous avons
appris quelque chose.

### 5.1 · Le patient est passé du premier au second plan

Prévu : le patient réserve en ligne, comme sur Doctolib.
Réalisé : la réception réserve pour lui, **et** il peut réserver seul.

Ce n'est pas un renoncement, c'est une correction de cible. Le modèle du « patient
léger » — un patient sans compte, créé au comptoir — est né de ce déplacement. Le
canal libre-service a été livré tard, en complément, et non comme fondation.

### 5.2 · Le déploiement local est devenu un déploiement réel

Le cahier des charges initial écrivait noir sur blanc : *« aucun hébergement cloud
requis pour la validation »*. Nous avons mis l'application en ligne quand même.

La raison n'était pas l'ambition, c'était le doute : une application qui ne tourne
que sur nos machines ne prouve pas grand-chose. La mise en ligne a immédiatement
révélé trois défauts **invisibles en local** — nous y revenons au § 7.

### 5.3 · Les disponibilités récurrentes ont été abandonnées

Prévu : des plages récurrentes avec exceptions.
Réalisé : des **plages datées**, plus des congés.

C'était un risque identifié dès le départ dans notre matrice (« complexité du
modèle de disponibilités »), et il s'est réalisé. Nous l'avons traité en réduisant
le périmètre plutôt qu'en repoussant la livraison. Une plage hebdomadaire se
saisit donc semaine par semaine — c'est moins confortable, mais c'est livré et ça
marche.

### 5.4 · Notre définition de « terminé » a dû être réécrite

C'est le changement le plus important, et il est né d'un échec.

**Des branches sont restées non fusionnées pendant des semaines** — jusqu'à
**56 commits de retard** sur `main`, dont une refonte complète de l'interface.
Quand il a fallu intégrer, le code était bon mais il ne s'appliquait plus sur rien
de reconnaissable. Et surtout : **cinq tickets étaient marqués « Terminé » dans
Jira sans exister dans le produit.**

Nous avons corrigé en trois temps :

1. **Réintégration branche par branche**, en pull requests revues, conflit par
   conflit. La règle que nous nous sommes donnée : *conserver les deux côtés* — ces
   conflits n'étaient pas des désaccords, c'étaient deux ajouts au même endroit.
2. **Deux branches n'ont pas été reprises** — configuration de clinique et décalage
   en bloc. À trois jours de l'échéance, les rejouer par-dessus l'interface refondue
   faisait courir un risque de régression sur le cœur du produit. Les tickets sont
   repassés « À faire » dans Jira, **avec la raison écrite**.
3. **La définition de « terminé » a été resserrée** : *terminé = fusionné dans
   `main`, CI verte*.

> **Ce que nous en retenons.** Un ticket n'est pas terminé quand le code est écrit,
> il est terminé quand il est fusionné. Une branche qui vit trois semaines coûte
> plus cher à intégrer qu'elle n'a coûté à écrire. Et une définition de « terminé »
> que l'outillage ne vérifie pas n'est pas une définition, c'est une intention.

### 5.5 · Un *Could* a été livré pendant qu'un *Must* ne l'était pas

Notre priorisation MoSCoW classait l'export CSV en *Could* et la gestion des
médecins en *Must*. L'export est livré ; la gestion des médecins ne l'est pas.

L'explication est simple et peu flatteuse : l'export était rapide et bien cerné, la
gestion des médecins était longue et floue. **Nous avons suivi la facilité au lieu
de la priorité.** C'est exactement ce que MoSCoW sert à empêcher — et nous ne
l'avons pas relu une seule fois en cours de projet.

---

## 6 · L'état actuel de la solution

**L'application est en ligne, fonctionnelle et démontrable de bout en bout.**
Vérifié le 12 août 2026 : la page d'accueil répond en 9,9 secondes à froid, la
sonde de disponibilité en 0,44 seconde, la connexion en 0,99 seconde.

### Les neuf fonctionnalités livrées

1. Authentification complète — inscription, connexion, verrouillage,
   réinitialisation
2. Contrôle d'accès par rôle, à 4 rôles, borné par clinique
3. Disponibilités par plages datées, avec génération automatique des créneaux
4. Réservation par la réception, avec création du patient léger
5. Réservation en libre-service par le patient
6. Flux clinique du jour et transitions de statut
7. Annulation avec motif obligatoire, et libération du créneau
8. Notifications internes sur les trois événements du cycle de vie
9. Tableaux de bord et statistiques, plus l'export CSV

### Le bilan par rapport au cahier des charges

Sur les 11 fonctionnalités du cahier des charges initial : **7 livrées** (dont une
classée *Could*), **3 partiellement**, **1 absente**. Sur les 11 livrables :
**9 produits**.

Deux éléments ont été livrés **en plus** de ce qui était demandé : la mise en ligne
réelle, jamais exigée, et le second canal de réservation.

Le détail exigence par exigence est dans le
[cahier des charges v2.0](cahier-des-charges/Cahier-des-charges-v2.md).

---

## 7 · Tests réalisés et résultats

### Ce que nous avons choisi de tester

Nous n'avons pas cherché une couverture uniforme. À trois, sur un semestre, elle
aurait consommé le temps du développement sans rien garantir de plus. Nous avons
testé **ce qui casse silencieusement** :

| Priorité | Ce que ça recouvre | Pourquoi |
|---|---|---|
| 1 | Les règles métier | Une transition de statut invalide ou un créneau réservé deux fois corrompt des données **sans message d'erreur** |
| 2 | La sécurité | Un défaut de contrôle d'accès ne se voit jamais à l'usage : tout fonctionne, simplement trop de monde y a accès |
| 3 | Le comportement des écrans | Un formulaire qui accepte une saisie invalide produit une erreur serveur incompréhensible |
| hors périmètre | L'apparence | Un test qui vérifie une couleur casse à chaque retouche et n'attrape aucun défaut réel |

### Les résultats

**203 tests automatisés, tous verts** au 12 août 2026 — **70 côté backend**
(11 suites) et **133 côté frontend** (28 suites).

Le parcours complet est validé **manuellement** avant chaque démonstration, selon
un scénario écrit en le jouant sur l'application en ligne. Le passage du 10 août a
vérifié 14 points, dont : génération automatique des créneaux, retrait du créneau
réservé de la liste, cycle de vie complet, motif obligatoire à l'annulation,
créneau effectivement libéré, notifications émises sur les trois événements, RBAC
visible à l'écran, export CSV, statistiques sur données réelles — et **aucune
erreur dans la console du navigateur**.

**La garantie anti-double-réservation a été vérifiée en concurrence réelle** sur
l'application déployée : deux réservations simultanées sur le même créneau, une
requête en 201, l'autre en 409.

### Les quatre bogues qui nous ont le plus appris

**Le 404 invisible en local.** Une fois en ligne, tous les appels à l'API
renvoyaient 404 — alors que tout fonctionnait parfaitement en local. Nous avons
cherché dans le code, dans les routes, dans la configuration, sans résultat, parce
que le problème n'y était pas. Le déblocage est venu d'un changement de méthode :
au lieu de chercher *ce qui était cassé*, chercher *ce qui différait entre les deux
environnements*. Notre proxy transmettait l'en-tête `Host` demandé par le
navigateur ; **Azure Container Apps route selon cet en-tête**, alors que Docker
Compose ne route pas du tout de cette façon.

**Les fins de ligne Windows.** Un fichier de démarrage récupéré en CRLF empêchait
un conteneur de démarrer. Corrigé en forçant LF sur les scripts shell.

**Le fuseau horaire.** Les horaires de la clinique apparaissaient décalés de quatre
heures, parce que le conteneur tourne en UTC. Corrigé en posant les horaires dans
le fuseau de la clinique, pas du serveur.

**La double réservation sous charge**, décrite au § 3.

> **Le point commun des trois premiers** : aucun n'était un bogue de code. Tous
> venaient d'un écart entre deux environnements. Un environnement de développement
> qui fonctionne ne prouve rien sur la production — les deux ne diffèrent pas
> seulement par leurs données, ils diffèrent par leur façon d'acheminer une requête,
> de lire un fichier et de compter les heures.

### Ce qui n'a pas été testé

Nous devons l'écrire aussi. **Aucun test de bout en bout automatisé** — le parcours
complet est validé à la main. **Aucun test de charge.** **Aucun audit Lighthouse
formel.** Et **la couverture de tests n'a pas été mesurée** : nous n'avons produit
aucun rapport de couverture, alors que le cahier des charges initial visait 70 % sur
les modules métier.

Sur les sept indicateurs de succès chiffrés que nous avions fixés en mai,
**aucun n'a été mesuré selon la méthode annoncée.**

---

## 8 · Les limites de la solution

### Fonctionnalités absentes

- **Modifier ou déplacer un rendez-vous** — il faut annuler puis réserver à nouveau.
- **Annulation par le patient** — suppose une règle de délai minimum que nous
  n'avons pas implémentée. Nous avons préféré ne pas livrer l'annulation sans sa
  règle plutôt qu'en livrer une qui laisse annuler cinq minutes avant.
- **Gestion des médecins et configuration de clinique par l'interface** — l'accès
  rapide correspondant est visible mais grisé, plutôt que masqué.
- **Décalage en bloc des rendez-vous d'un médecin** — codé et testé sur une branche,
  non intégré.
- **Aucune notification vers l'extérieur** — ni courriel, ni SMS.

### Limites techniques

- **Le multi-clinique** est prévu dans le modèle et appliqué côté sécurité, mais peu
  outillé côté interface.
- **Pas de pagination serveur** : le volume académique le permet, une vraie clinique
  non.
- **Sécurité — défense en profondeur incomplète.** Le socle tient : hachage bcrypt,
  validation stricte des entrées, contrôle d'accès réellement appliqué, aucun secret
  dans le dépôt. Mais il manque les couches qu'on ajoute quand le principal tient :
  pas de jeton de rafraîchissement ni de révocation, **aucun en-tête HTTP de
  sécurité**, aucune journalisation d'audit. Ce sont nos deux premiers correctifs, et
  ils demandent moins d'une journée.
- **Dette de formatage assumée** : 233 fichiers jamais passés au formateur, et
  9 avertissements d'accessibilité clavier. La CI les rapporte sans bloquer — les
  rendre bloquants donnerait une CI rouge en permanence, donc ignorée.
- **Démarrage à froid** de 10 à 15 secondes, contrepartie du coût à 0 $.

### Limites de méthode

- Notre définition de « terminé » a été trop souple pendant une partie du projet.
- Les revues de code sont arrivées tard.
- Le volume de commits est très inégal entre les membres (72 / 8 / 4), et nous
  l'assumons : il mesure une façon de travailler, pas une contribution.

---

## 9 · La contribution de chaque membre

Les attributions ci-dessous ont été **retracées commit par commit**, pas de
mémoire. Le détail complet — réalisations, difficultés, résolutions et questions
de maîtrise — est dans
[`presentation/CONTRIBUTIONS.md`](presentation/CONTRIBUTIONS.md).

| | Souleymane DIALLO | Zakaria Lahouiri | Larbi Saib |
|---|---|---|---|
| Rôle tenu | Pilotage, socle technique, sécurité, mise en ligne, espace patient | Disponibilités, flux du jour, notifications | Rendez-vous, patient, statistiques |
| Conception | Cahier des charges, 7 cas d'utilisation, ERD | Diagramme de classes | Diagrammes de séquence |
| Commits sur `main` | 72 | 8 | 4 |
| Épiques Jira | E1, E2, E4, E7 | E3, E5, E6 | — |

### Souleymane DIALLO — le socle et ce qui relie les morceaux

Cahier des charges et cas d'utilisation ; monorepo, Docker et intégration
continue ; authentification, JWT, bcrypt, verrouillage, réinitialisation et
contrôle d'accès à 4 rôles ; écrans d'authentification, design system et refonte
complète de l'interface ; passage de la contrainte d'unicité à un **index
partiel**, ce qui rend l'annulation possible ; annulation avec motif ; réservation
en libre-service par le patient ; mise en ligne Azure ; réintégration finale des
branches.

**Sa difficulté** : le 404 qui n'existait qu'en production (§ 7).
**Sa résolution** : cesser de chercher ce qui était cassé pour chercher ce qui
différait entre les deux environnements.

### Zakaria Lahouiri — le temps du médecin

Diagramme de classes ; disponibilités par plages datées et génération automatique
des créneaux ; plages de congé ; flux clinique du jour et transitions de statut ;
module complet de notifications internes, avec émission automatique sur les trois
événements du cycle de vie ; export CSV borné à la clinique.

**Sa difficulté** : ses branches avaient pris jusqu'à 56 commits de retard sur une
interface entre-temps refondue.
**Sa résolution** : rebasage et réintégration par pull requests, conflit par
conflit, en conservant les deux apports — et la décision assumée de ne pas
réintégrer deux branches à trois jours de l'échéance.

### Larbi Saib — le rendez-vous et sa mesure

Diagrammes de séquence ; modèle du **patient léger** ; socle technique du
rendez-vous — entités, migration, service, contrôleur, validation ; **contrainte
d'unicité anti-double-réservation**, posée dès la première version ; module
d'agrégation et écran de statistiques, qui a remplacé les compteurs factices du
tableau de bord par des chiffres réels.

**Sa difficulté** : garantir qu'un créneau ne soit jamais réservé deux fois.
**Sa résolution** : comprendre pourquoi « vérifier puis écrire » ne peut pas
marcher, et sortir la garantie du code pour la poser dans la base.

### Travail commun

Trois choses n'appartiennent à personne en particulier : la décision de découper
par tranche verticale, la révision de la définition de « terminé », et la réflexion
UX/UI accompagnée de la préparation de la présentation.

---

## 10 · Améliorations et prochaines étapes

L'ordre n'est pas arbitraire : **finir ce qui est écrit, sécuriser ce qui existe,
puis seulement ajouter.** Ajouter sur une base fragile est ce qui nous a coûté le
plus cher.

### 1 — Solder l'existant

Intégrer le décalage en bloc, déjà écrit et testé. Livrer la configuration de
clinique et la gestion des médecins — les deux seules exigences *Must* encore
ouvertes. Passer le formateur sur les 233 fichiers en attente, une fois pour
toutes.

### 2 — Fiabiliser

Poser les en-têtes HTTP de sécurité et la journalisation d'audit : c'est notre plus
grand écart pour le plus petit effort. Ajouter un jeton de rafraîchissement avec
rotation et une déconnexion côté serveur. Écrire les tests de bout en bout sur le
parcours complet. Ajouter la pagination serveur. Puis rendre le lint bloquant, une
fois la dette résorbée.

### 3 — Étendre la valeur

**Les rappels par courriel ou SMS** viennent en premier : c'est la fonctionnalité
qui attaque directement le taux d'absence, le seul chiffre que la clinique voit sur
sa facture. Ensuite une **liste d'attente**, qui proposerait automatiquement un
créneau libéré par une annulation. Puis l'annulation par le patient, avec son délai
minimum. Et seulement ensuite, l'ouverture à un réseau de cliniques et une API
publique documentée.

### La stratégie de progression

Le produit est déjà déployable en une commande et son schéma de base se reconstruit
à l'identique : c'est le socle qui rend la suite possible. Nous garderions la même
règle de travail — **une fonctionnalité par personne, menée de la base de données
jusqu'à l'écran, fusionnée dans la semaine.**

---

## 11 · Conclusion

MediPlan est livré : une application réellement déployée, testée et démontrable de
bout en bout, qui traite le problème posé. La double réservation est devenue
techniquement impossible, la journée de clinique tient dans un écran partagé, et un
créneau annulé n'est plus un créneau perdu.

Le produit est en deçà de notre cahier des charges initial sur trois points — la
gestion des médecins et des cliniques par l'interface, la modification d'un
rendez-vous, et la validation automatisée de bout en bout. Il le dépasse sur deux
autres — la mise en ligne réelle, jamais exigée, et le second canal de réservation.

**La cause des manques n'est pas technique, elle est de méthode.** Nous avons
travaillé longtemps sans intégrer, et notre définition de « terminé » a laissé du
code exister sans être dans le produit. C'est ce que nous retenons le plus de ce
projet, et le correctif est déjà appliqué.

---

## Annexe — Où trouver quoi

| Élément | Emplacement |
|---|---|
| Code source | `apps/backend/`, `apps/frontend/` |
| Cahier des charges final | [`cahier-des-charges/Cahier-des-charges-v2.md`](cahier-des-charges/Cahier-des-charges-v2.md) |
| Dossier de conception | [`conception/`](conception/) — 7 cas d'utilisation, classes, séquence, ERD |
| **Manuel d'utilisation** | [`guide-utilisation/`](guide-utilisation/) |
| **Vidéo démonstrative** | [`MediPlan-Demo.mp4`](../MediPlan-Demo.mp4) — 4 min 05 |
| Tests, résultats, bogues | [`tests/plan-et-resultats.md`](tests/plan-et-resultats.md) |
| Contributions individuelles | [`presentation/CONTRIBUTIONS.md`](presentation/CONTRIBUTIONS.md) |
| Instructions de lancement | [`README.md`](../README.md) du dépôt |
| Mise en ligne | [`deployment/azure.md`](deployment/azure.md) |
| Suivi de projet | Jira — projet `MEDIPLAN` |
