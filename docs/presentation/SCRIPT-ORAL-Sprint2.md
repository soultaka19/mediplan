# Script oral — Revue du Sprint 2 (29 juillet 2026)

> À lire une fois en entier, à voix haute, avant de présenter.
> Le texte **en gras entre guillemets** se dit tel quel. Le reste, c'est de la mise en scène.

---

## 0. Les 2 minutes avant d'entrer

| Vérification | Pourquoi |
|---|---|
| App ouverte sur `http://localhost:4200`, **déjà sur l'écran de connexion** (pas connecté) | La connexion en direct est votre première preuve |
| **Flux du jour** vérifié une fois : il y a bien des RDV **d'aujourd'hui** | C'est le seul point qui peut faire s'effondrer la démo |
| PowerPoint en **mode Présentateur** (vos notes sur votre écran) | Vous ne lisez jamais la diapo |
| Jira ouvert dans un onglet, filtré `labels = "Sprint-2"` | Si elle demande à voir, 2 secondes suffisent |
| Téléphones en silencieux, notifications coupées | Un pop-up en plein partage d'écran casse tout |

**Règle absolue : à partir de maintenant, plus une ligne de code.**

---

## 1. L'accroche — Souleymane (20 s, diapo 1)

Ne commencez pas par « Bonjour, nous allons vous présenter… ». Commencez par une image.

> **« Dans une clinique, quand deux personnes décrochent le téléphone en même temps, il arrive que le même créneau soit vendu deux fois. C'est un agenda papier, une rature, un patient qui se déplace pour rien. »**
>
> *(marquer un temps — 1 seconde)*
>
> **« Le Sprint 2, c'est le sprint où ça devient impossible dans MediPlan. Bonjour, nous sommes l'équipe MediPlan : Souleymane, Zakaria, Larbi. En dix minutes, nous allons vous montrer ce que nous avons développé, testé et intégré. »**

**Pourquoi ça marche** : vous ouvrez sur le problème métier, pas sur la technologie. Et vous annoncez votre thèse dès la première phrase.

**Transition → diapo 2 :** *« D'abord, un rappel rapide du projet. »*

---

## 2. Rappel du projet — Souleymane (1 min 30, diapo 2)

> **« Le problème : la prise de rendez-vous se fait au téléphone, à la main. Agendas papier, doubles réservations, oublis. Et la réception n'a aucune vue claire de sa journée. »**
>
> **« Notre solution, c'est une application web où la réception gère les rendez-vous à la place des patients. Et c'est notre choix le plus structurant : notre utilisateur principal n'est pas le patient — c'est la réception. Le patient appelle, il ne s'inscrit pas en ligne. »**
>
> **« Quatre profils : la réception, qui fait tout ; le médecin, qui consulte sa journée ; le patient dit "léger", créé au comptoir sans compte ni mot de passe ; et un super-administrateur. Le tout en Angular, NestJS, PostgreSQL, dans Docker. »**

⚠ **Ne détaillez pas la stack.** Une phrase suffit — Zakaria y revient à la diapo 4.

**Transition → diapo 3 :** *« Voilà le projet. Maintenant, qu'est-ce qu'on s'était engagé à livrer sur ce sprint ? »*

---

## 3. Objectif du Sprint 2 — Souleymane (1 min, diapo 3)

C'est ici que vous posez **la phrase du jour**. Dites-la lentement.

> **« Notre objectif tenait en une phrase : une réception se connecte de façon sécurisée, définit les disponibilités des médecins, et réserve un rendez-vous pour un patient — sans jamais créer de double réservation. »**
>
> *(temps)*
>
> **« Au Sprint 1, on savait ouvrir une session. Au Sprint 2, la réception fait tourner une vraie journée de clinique : elle ouvre l'agenda, elle réserve, elle suit le flux, elle annule. De bout en bout. »**
>
> **« Pourquoi ce périmètre-là ? Parce que c'est la tranche verticale la plus utile : de la connexion jusqu'à un vrai rendez-vous dans l'agenda. Nous avons volontairement écarté le libre-service patient. Un sprint qui livre un parcours complet vaut mieux que trois demi-fonctionnalités. »**

**Transition → diapo 4 :** *« Zakaria va vous expliquer comment tout ça est construit. »* — et **tournez-vous vers lui**. Le passage de parole se regarde, il ne s'annonce pas seulement.

---

## 4. Architecture générale — Zakaria (1 min 30, diapo 4)

> **« Trois parties dans un seul dépôt : un frontend Angular, un backend NestJS, une base PostgreSQL. »**
>
> **« Suivons une réservation, de bout en bout. Un : le navigateur envoie la requête au backend, avec le jeton d'authentification dans l'en-tête. Deux : NestJS vérifie le jeton, vérifie le rôle de l'utilisateur, valide les données reçues, puis applique la règle métier. Trois : on écrit en base dans une transaction — et c'est là que se joue le cœur du sprint : un index unique garantit qu'un créneau ne peut être pris qu'une seule fois. Quatre : la réponse remonte, et l'écran se met à jour tout seul. »**

**Le geste** : suivre les trois blocs de la diapo avec la main, de gauche à droite. On doit *voir* le flux.

**Transition → diapo 5 :** *« Regardons maintenant chaque couche de plus près. »*

---

## 5. Base · Backend · Frontend — Zakaria (1 min 30, diapo 5)

Trois cartes, **trois phrases par carte, pas plus**. Ne lisez pas les puces.

> **« La base : un schéma issu directement de notre modèle de conception, avec des migrations versionnées — donc reproductible sur une machine neuve. La pièce maîtresse, c'est un index unique partiel sur le créneau : les rendez-vous annulés en sont exclus, donc un créneau annulé redevient réservable. Et le patient léger est un utilisateur sans mot de passe : il ne peut pas se connecter, par construction. »**
>
> **« Le backend : une API REST en modules — authentification, utilisateurs, disponibilités, rendez-vous. Jeton JWT, mots de passe hachés avec bcrypt, verrouillage du compte après cinq échecs, et un contrôle d'accès par rôle sur chaque route. Toutes les entrées sont validées avant d'atteindre la logique métier. »**
>
> **« Le frontend : des composants autonomes, un état réactif, et surtout un design system unique — une seule source de couleurs et de typographie. C'est ce qui fait qu'on a un mode sombre complet sans avoir retouché un seul écran à la main. »**

**Transition → diapo 6 :** *« Assez de théorie — Larbi va vous le montrer en vrai. »*

---

## 6. Démonstration — Larbi (2 min, diapo 6) — LE SOMMET

**Règle d'or : parler *pendant* qu'on clique, jamais après.** Le silence pendant un chargement, c'est là qu'on perd la salle.

Les numéros ci-dessous correspondent **exactement** aux 8 étapes affichées sur la diapo 6.

| # | Geste | Ce qu'on dit **en même temps** |
|---|---|---|
| 1 | Connexion réception | **« Je me connecte comme la réception. Regardez l'en-tête : "Alice Tremblay", son nom — pas son e-mail. Le profil vient du serveur. »** |
| 2 | Tableau de bord | **« Le compteur "rendez-vous du jour" est un vrai chiffre, calculé en base. »** |
| 3 | Disponibilités → créer une plage → *Voir les créneaux* | **« Je saisis une plage datée et une durée de créneau. Le système génère seul les créneaux réservables. Je ne les ai pas créés un par un. »** |
| **4** | **Rendez-vous → réserver → le RDV apparaît dans le flux** | **« Le patient appelle. Je le crée au comptoir — pas de compte, pas de mot de passe. Je choisis un créneau libre, un motif, je réserve… »** *(temps)* **« …et il est immédiatement dans la journée. C'est le geste réel d'une réceptionniste. »** |
| 5 | Arrivé → Consultation → Terminé | **« Et voilà le cycle d'une consultation, tel qu'il se vit au comptoir. »** |
| 6 | Annuler + motif | **« J'annule, avec un motif obligatoire. Le créneau se libère et redevient réservable. »** |
| 7 | Déconnexion → login médecin | **« Même application, autre rôle. Regardez le menu : "Utilisateurs" a disparu. Le contrôle d'accès se voit à l'écran. »** |
| 8 | Mode sombre | **« Et le thème sombre, en un clic, sur toute l'application. »** |

**L'étape 4 est le sommet de la présentation.** Larbi doit ralentir là, pas accélérer.

⚠ **Cohérence à tenir** : le compteur du jour (étape 2) est réel, mais les **statistiques complètes** du tableau de bord restent au Sprint 3 (ticket 26). Si on pose la question : *« le compteur du jour est calculé en base ; ce qui vient au Sprint 3, ce sont les statistiques complètes. »*

**Transition → diapo 7 :** *« Ça, c'est ce que vous voyez. Voyons ce qu'on a vérifié. »*

---

## 7. Tests et validation — Larbi (1 min 30, diapo 7)

> **« 171 tests automatisés, tous verts : 48 sur le backend, 123 sur le frontend, zéro en échec. »**
>
> **« Le test dont nous sommes le plus fiers : la réservation en concurrence. Deux réservations lancées sur le même créneau au même instant — une passe, l'autre est refusée. »**
>
> **« Et nous avons trouvé de vrais bogues, que nous avons corrigés : une erreur 500 causée par un verrou SQL mal placé ; un sélecteur de médecin qui ne s'ouvrait pas parce que l'étiquette captait le clic ; des rendez-vous du jour vides à cause d'un problème de fuseau horaire. Tous corrigés. »**

**Pourquoi citer les bogues** : une équipe qui nomme ses bogues prouve qu'elle a réellement testé. Une équipe qui n'en cite aucun n'a testé que le chemin heureux.

**Transition → diapo 8 :** *« Souleymane va vous parler de ce qui a été le plus dur. »*

---

## 8. Difficultés — Souleymane (1 min 30, diapo 8) — VOTRE MOMENT

Le seul passage où vous devez **ralentir et regarder la prof dans les yeux**. Pas de fuite, pas d'excuse.

> **« Notre difficulté la plus sérieuse n'a pas été technique. Elle a été d'organisation. »**
>
> *(temps)*
>
> **« Au début du sprint, nous avons travaillé chacun sur notre branche, et nous ne les avons pas fusionnées assez tôt. Résultat : deux migrations sur le même horodatage, et un module de rendez-vous écrit deux fois par deux personnes différentes, sans qu'on le sache. Nous avons perdu une journée entière à réintégrer au lieu de développer. »**
>
> **« Nous en avons tiré six règles, que nous appliquons depuis : le code qui touche la base passe en premier ; aucune branche ne vit plus de trois jours sans être proposée à la fusion ; un seul module par ticket ; on ne fusionne que si les tests passent ; un point d'intégration à mi-sprint. Et surtout, notre définition de "terminé" a changé : terminé, ça ne veut plus dire "codé sur ma machine", ça veut dire "fusionné dans la branche commune". »**
>
> **« Côté technique, la vraie question était : comment empêcher deux réceptions de réserver le même créneau au même instant ? Notre réponse, c'est de ne pas laisser notre code arbitrer. C'est PostgreSQL qui tranche la course, avec un index unique et une transaction. Vérifié par un test de concurrence. »**

**Transition → diapo 9 :** *« Voyons maintenant où ça nous mène dans Jira. »*

---

## 9. Avancement Jira — Souleymane (1 min, diapo 9)

Trois chiffres, puis **nommez chaque personne à voix haute** — la consigne exige que chacun montre sa contribution.

> **« 18 tickets terminés sur 21, environ 86 % du sprint. »**
>
> **« La répartition : j'ai porté l'authentification, la réservation avec l'anti-double-réservation, la mise en place du monorepo et de Docker, et l'intégration. Zakaria a fait les disponibilités des médecins et le flux clinique du jour. Larbi a modélisé le patient léger, la réservation par la réception et le socle technique des rendez-vous. Le frontend d'authentification et la refonte de l'interface, c'est un effort partagé. »**
>
> **« Trois tickets passent au Sprint 3 : la gestion des médecins par l'administrateur, une précision de documentation, et les variables d'environnement. Aucun n'est bloquant, et nous les assumons comme tels. Et nous avons même livré l'annulation en avance sur le planning. »**

**Transition → diapo 10 :** *« Zakaria, pour la suite. »*

---

## 10. Prochaines étapes — Zakaria (1 min, diapo 10)

> **« Le Sprint 3 porte sur le cycle de vie complet du rendez-vous : l'annulation, déjà livrée, à valider officiellement ; les notifications internes, en cours ; les statistiques réelles du tableau de bord ; et un renforcement de la sécurité des rendez-vous. »**
>
> **« En un mot : le Sprint 2 livre une tranche complète, de la connexion au suivi de la journée. Le Sprint 3 ajoute le cycle de vie et durcit la sécurité. »**

---

## 11. Clôture — Souleymane (15 s, diapo 11)

**Reprenez votre phrase du début.** C'est ce qui donne l'impression d'une présentation construite, et non d'une série d'exposés.

> **« On a commencé par un créneau vendu deux fois. Aujourd'hui, dans MediPlan, c'est la base de données elle-même qui l'empêche. La réception se connecte, ouvre son agenda, réserve, suit sa journée, annule — de bout en bout, avec 171 tests derrière. Merci. Nous répondons à vos questions, chacun sur sa partie. »**

---

## 12. Les questions — une phrase chacun, puis on s'arrête

> **Répondre court, puis se taire.** Une réponse qui s'étire donne l'impression qu'on cherche.

| Question | Qui répond | Réponse |
|---|---|---|
| « Pourquoi le patient ne réserve pas lui-même ? » | Souleymane | **« Choix métier assumé : l'utilisateur réel est la réception, le patient appelle. Le libre-service viendra quand le cœur sera solide. »** |
| « Comment évitez-vous les doubles réservations ? » | Souleymane | **« Un index unique partiel en base, plus une transaction avec verrou. Ce n'est pas notre code qui arbitre, c'est PostgreSQL. Testé en concurrence. »** |
| « Les données de santé sont-elles protégées ? » | Souleymane | **« Quatre rôles, cloisonnement par clinique, mots de passe hachés bcrypt, verrouillage après cinq échecs, et un patient léger qui ne peut pas se connecter par construction. »** |
| « Qu'est-ce qui n'est pas fini ? » | Souleymane | **« Trois tickets non bloquants transférés au Sprint 3 : gestion des médecins, une précision de doc, les secrets d'environnement. »** |
| « Comment testez-vous le frontend ? » | Larbi | **« Composants, services HTTP, guards de rôle et intercepteurs — 123 tests — plus une vérification manuelle bout-en-bout. »** |
| « Pourquoi Angular / NestJS ? » | Zakaria | **« Un seul langage, TypeScript, du navigateur à la base. Une équipe de trois, une seule courbe d'apprentissage. »** |
| « Et le décalage en bloc des rendez-vous ? » | Souleymane | **« Le code existe sur une branche, il n'est pas intégré. Donc pour nous il n'est pas terminé — c'est le Sprint 3. »** |
| « Qui a fait quoi ? » | chacun | Chacun reprend **sa** ligne de la diapo 9. |

**Si vous ne savez pas :** *« Je ne veux pas vous répondre de mémoire — c'est un point que je vérifie et je vous reviens dessus. »* Jamais de bluff.

---

## 13. Si ça plante en direct

| Situation | Ce qu'on dit | Ce qu'on fait |
|---|---|---|
| Un écran ne charge pas | **« Le temps que ça revienne, je vous explique ce qui se passe derrière. »** | On continue de parler, on ne clique pas frénétiquement |
| Une erreur s'affiche | **« Voilà un cas réel — et c'est justement pour ça qu'on a 171 tests. »** puis on passe à l'étape suivante | On n'essaie **jamais** de déboguer en direct |
| Le flux du jour est vide | **« Les données de démonstration sont datées du jour ; je vous montre la réservation, qui est le cœur. »** | On enchaîne sur la création d'un RDV |
| Quelqu'un perd le fil | Le suivant enchaîne sur sa diapo | On ne se corrige pas mutuellement devant la salle |

---

## 14. Les cinq choses à ne jamais faire

1. **Lire les diapos.** Elles illustrent, vous racontez.
2. **Dire « normalement ça marche » ou « ça devrait ».** Ça annonce l'échec.
3. **Promettre ce qui n'est pas intégré** (le décalage en bloc, MEDIPLAN-24).
4. **S'excuser.** « On n'a pas eu le temps de… » → dites plutôt « nous l'avons transféré au Sprint 3, ce n'est pas bloquant ».
5. **Se couper la parole entre vous.** Chacun tient sa diapo jusqu'au bout.
