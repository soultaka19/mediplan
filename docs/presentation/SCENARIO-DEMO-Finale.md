# Scénario de démonstration — présentation finale du 13 août 2026

> Ce document a été écrit **en jouant le parcours complet sur l'application en
> ligne**, le 10 août 2026, à l'aide de `playwright-cli`. Chaque libellé, chaque
> bouton et chaque message cité ci-dessous a été observé, pas supposé.

**Orateur : Zakaria Lahouiri · 4 minutes**
**Application : `https://ca-mediplan-frontend.ashytree-9ad5012f.canadacentral.azurecontainerapps.io`**

---

## Les données : ce qu'il faut savoir

Le jeu de démonstration calcule ses dates **au moment où il s'exécute**
(`todayAt()` dans `demo-seed.ts`) et le job qui le déclenche est **volontairement
manuel** : écraser des données ne doit résulter que d'un geste délibéré.

Il couvre **14 jours d'historique et une semaine complète à venir**. Un
lancement le lundi laisse donc une clinique utilisable jusqu'au lundi suivant :
**le 13 août est déjà couvert par le lancement du 10**. Aucune commande n'est à
taper le matin de la présentation.

Chaque journée ouvrée de la fenêtre est une vraie journée de clinique :

| | |
|---|---|
| Plages | 4 par jour — les deux médecins, matin et après-midi |
| Créneaux | 24 par jour, dont **environ 15 libres** |
| Rendez-vous | 8 à 10, patients tous différents, motifs variés |
| Annulations | 1 à 2 par jour, créneau libéré, motif renseigné |
| Congé | une demi-journée, placée en **fin** de fenêtre |

**Vérifié pour le jeudi 13 août** : 24 créneaux, 9 rendez-vous répartis sur les
deux médecins matin et après-midi, 2 annulations, 15 créneaux libres.

### Le seul geste indispensable

**Réveiller l'application** avant de passer : ouvrir l'URL et se connecter une
fois. Les conteneurs dorment (scale-to-zero) et le premier accès prend **10 à 15
secondes**. Ensuite, la navigation est instantanée.

### Si vous voulez malgré tout repartir d'une base fraîche

```bash
az containerapp job start --name caj-mediplan-seed --resource-group rg-projet-dev
az containerapp job execution list --name caj-mediplan-seed \
  --resource-group rg-projet-dev -o table   # attendre « Succeeded »
```

Deux raisons de le faire : effacer les rendez-vous créés pendant les répétitions,
ou obtenir un **flux du jour déjà animé** (des consultations terminées, une en
cours) plutôt qu'une journée entièrement « Réservé ».

> ⚠️ Le seed **écrase** les données existantes. Jamais pendant la démonstration.
> Si vous le lancez, rejouer le scénario une fois en entier ensuite.

---

## Comptes

| Rôle | Identifiant | Mot de passe | Affiche |
|---|---|---|---|
| Réception | `admin.demo@mediplan.test` | `Adm1n!Secret` | Alice Tremblay |
| Médecin | `doctor.demo@mediplan.test` | `Doct0r!Secret` | Sophie Bergeron |

---

## Le fil narratif

Une journée à la réception. Le fil n'est pas « voici nos fonctionnalités », c'est
**« voici ce que vit Alice, réceptionniste »**. Chaque étape doit s'enchaîner par
une raison métier, jamais par « et maintenant je vous montre… ».

---

## Étape 0 — Connexion · 20 s

Partir de l'écran de connexion, **session fermée**. Saisir les identifiants
devant la salle.

> **À dire pendant la saisie** : « Je me connecte comme la réception de la
> clinique. »
>
> **À montrer une fois entré** : l'en-tête affiche **Alice Tremblay** et le badge
> **Administrateur de clinique**. « Le profil vient du serveur, pas du jeton :
> l'application redemande qui je suis à chaque démarrage. »

---

## Étape 1 — Le tableau de bord · 20 s

Ne cliquer sur rien.

> **À dire** : « Voici l'espace de la réception. La tuile de gauche est réelle :
> c'est le nombre de rendez-vous du jour, et elle est cliquable. »
>
> **Devancer la question** — deux tuiles portent encore la mention *bientôt* :
> « Médecins actifs et Taux de remplissage sont des emplacements réservés que
> nous assumons. L'information existe, mais elle est sur l'écran Statistiques
> que je vous montre dans un instant. »

⚠️ Ne pas cliquer sur les entrées grisées « bientôt » (Médecins).

---

## Étape 2 — Publier une plage de disponibilité · 60 s

Menu de gauche → **Disponibilités** → bouton **Ajouter une plage**.

Valeurs à saisir :

| Champ | Valeur | Comment |
|---|---|---|
| Médecin | **Sophie Bergeron** | liste déroulante |
| Du | **date du jour** | ⚠️ **par le calendrier**, icône à droite du champ |
| Au | se remplit tout seul | ne pas y toucher |
| Heure de début | **16 h 30** | *(adapter : une heure encore à venir)* |
| Heure de fin | **18 h 30** | |

> ⚠️ **Ne pas taper la date au clavier.** Le champ est un sélecteur Material : la
> frappe directe est mal interprétée (une saisie `10/08/2026` a été comprise comme
> le 8 octobre). **Cliquer l'icône du calendrier et choisir le jour.** Les dates
> passées y sont grisées — c'est volontaire.

Avant de valider, **pointer la ligne d'aperçu** qui apparaît sous les champs :

> « ≈ 4 créneaux de 30 min réservables. »
>
> **À dire** : « Je ne saisis pas des créneaux un par un. Je décris une plage et
> une durée, et le système m'annonce déjà ce qu'il va générer. »

Cliquer **Ajouter**. Une confirmation s'affiche :

> « Disponibilité ajoutée — Sophie Bergeron — le 10 août 2026, de 16 h 30 à
> 18 h 30. Pas de réservation : 30 min par créneau. »

Cliquer **OK**.

---

## Étape 3 — Un patient appelle : réserver · 70 s

**Le geste métier** : bouton **Nouveau rendez-vous** dans la barre du haut.

> **À dire en ouvrant** : « Le téléphone sonne. Madame Nadeau veut un rendez-vous
> cet après-midi. »

Le dialogue annonce lui-même sa promesse : *« Médecin, créneau, patient — trois
gestes. »* Le suivre dans l'ordre :

1. **Médecin** → `Sophie Bergeron`
2. **Disponibilité** → `lundi 10 août 2026 · 16 h 30 – 18 h 30`
   *(la plage qu'on vient de créer, **en bas de la liste**)*
3. **Créneau** → `16 h 30 – 17 h 00`

   > **À dire ici — c'est le moment clé** : « Les quatre créneaux de trente
   > minutes ont été générés tout seuls à partir de ma plage. Je n'ai rien saisi
   > de plus. »

4. **Patient** → Prénom `Camille`, Nom `Nadeau`, Motif `Suivi de tension`

   > **À dire** : « Camille Nadeau n'a pas de compte et n'en aura jamais. C'est ce
   > que nous appelons un patient léger : la réception le crée au comptoir, avec
   > un nom. Le patient n'a rien à retenir — il appelle, c'est tout. »

Cliquer **Réserver**. L'application bascule sur la liste des rendez-vous, la
réservation en tête.

---

## Étape 4 — Le cœur : le flux du jour · 60 s

Menu de gauche → **Flux du jour**.

Le rendez-vous de Camille Nadeau apparaît sous **À venir**, avec l'heure, le
médecin et le motif.

Dérouler le cycle de vie, **un clic à la fois**, en laissant voir le changement :

1. **Marquer arrivé** → la ligne passe dans le groupe **Présents**, statut *Arrivé*
2. **Démarrer la consultation** → statut *En consultation*
3. **Terminer** → une **confirmation** s'ouvre : *« Marquer le rendez-vous de
   Camille Nadeau comme "Terminé" ? »* → cliquer **Terminé**
4. La ligne descend dans **Clôturés**, atténuée

> **À dire pendant les clics** : « C'est la vue que la réception et le médecin
> partagent. Chacun voit le même état au même moment — plus besoin de se lever
> pour demander qui est arrivé. »
>
> **Sur la confirmation** : « Les statuts terminaux demandent une confirmation.
> Les étapes intermédiaires, non : on ne va pas ralentir un geste qu'on répète
> cinquante fois par jour. »

---

## Étape 5 — L'annulation, et la preuve · 60 s

**C'est le passage le plus fort de la démonstration. Ne pas le presser.**

Réserver d'abord un second rendez-vous, rapidement (**Nouveau rendez-vous** →
Sophie Bergeron → la plage du jour → **17 h 00** → `Thomas` `Leclerc`).

> **Faire remarquer au passage** : « Regardez la liste des créneaux : 16 h 30 n'y
> est plus. Il est pris, il a disparu. »

Retourner sur **Flux du jour** → sur la ligne de Thomas Leclerc, bouton **⋯** →
**Annuler le rendez-vous**.

Dans le dialogue, **montrer le bouton désactivé avant de saisir** :

> **À dire** : « Le bouton de confirmation est inactif. On ne peut pas annuler
> sans motif — c'est une règle métier, pas une politesse. »

Saisir le motif : `Patient empêché — rappellera demain`, puis **Confirmer
l'annulation**.

Le message de confirmation :

> « Le rendez-vous de Thomas Leclerc a été annulé. **Le créneau est de nouveau
> disponible.** »

**Puis prouver l'affirmation** : rouvrir **Nouveau rendez-vous** → Sophie
Bergeron → la plage du jour → ouvrir la liste des créneaux.

> **À dire** : « 17 h 00 est revenu dans la liste. Un créneau annulé n'est pas un
> créneau perdu — il repart à la vente. »

> 🎯 **Si la prof demande « et les doubles réservations ? »** — la meilleure
> réponse : « Un index unique partiel en base. C'est PostgreSQL qui refuse la
> seconde écriture, pas notre code. Et il est *partiel* : il ignore les
> rendez-vous annulés, c'est exactement ce qui permet au créneau de revenir. Nous
> le testons en concurrence : deux réservations simultanées, une seule passe. »

---

## Étape 6 — L'export CSV · 20 s

Toujours sur **Flux du jour**, dans l'en-tête : les champs **Du** / **Au** sont
déjà positionnés sur aujourd'hui. Cliquer **Exporter CSV**, puis **ouvrir le
fichier téléchargé** devant la salle.

> **À dire** : « La clinique récupère ses rendez-vous dans un tableur, pour sa
> comptabilité ou son rapport mensuel. L'export respecte le périmètre de la
> clinique : je n'exporte que mes données. »

---

## Étape 7 — Les statistiques · 30 s

Menu de gauche → **Statistiques**.

Trois indicateurs, calculés sur une vraie période (par défaut les 30 derniers
jours) : **Volume de rendez-vous**, **taux de no-show**, **taux d'occupation** —
puis le **détail par médecin** avec une barre d'occupation.

> **À dire** : « Ce ne sont pas des chiffres décoratifs. Le taux d'absence, c'est
> le temps médecin payé et non facturé. Le taux d'occupation, c'est la question
> "faut-il ouvrir plus de plages ou pas". C'est la partie qui intéresse le
> gestionnaire de la clinique, pas la réception. »

---

## Étape 8 — Le contrôle d'accès, vu à l'écran · 40 s

Menu utilisateur (en haut à droite) → **Se déconnecter**.
Se reconnecter avec `doctor.demo@mediplan.test` / `Doct0r!Secret`.

**Trois choses à faire remarquer, dans cet ordre :**

1. **Le menu de gauche a fondu** : la Dre Bergeron n'a que **trois entrées**
   (Tableau de bord, Disponibilités, Flux du jour). Plus de *Rendez-vous*, plus de
   *Statistiques*, plus d'*Utilisateurs*.
2. **Le bouton « Nouveau rendez-vous » a disparu** de la barre du haut.
3. **La cloche de notifications affiche un compteur.**

> **À dire** : « C'est la même application, le même code. Ce que vous voyez
> changer, c'est le contrôle d'accès par rôle. Et ce n'est pas qu'un affichage :
> si je tapais l'adresse de l'écran Statistiques à la main, le serveur me la
> refuserait. Le menu ne fait que refléter une règle appliquée côté serveur. »

**Ouvrir la cloche.** Elle contient une notification par événement du cycle de
vie que nous venons de jouer : la réservation, chaque changement de statut,
l'annulation.

> **À dire, pour conclure la démonstration** : « Le médecin n'a rien eu à faire.
> Pendant que je travaillais à la réception, son fil s'est rempli tout seul. Une
> notification est émise à la réservation, à chaque changement de statut et à
> l'annulation. »

---

## Étape 9 — Le mode sombre · 10 s

Cliquer l'**icône de lune** dans la barre du haut. Recliquer pour revenir.

> **À dire** : « Thème sombre complet. Aucun écran n'a été retouché à la main :
> toute l'interface lit les mêmes variables de design. »

---

## Les interdits

1. **Jamais de F5** pendant la démonstration.
2. **Ne pas taper les dates au clavier** — passer par le calendrier.
3. **Ne pas cliquer les entrées « bientôt »** (Médecins) : ce sont des
   emplacements réservés, assumés à l'oral.
4. **Ne pas promettre le décalage en bloc** (MEDIPLAN-24) : le code existe sur une
   branche, il n'est pas intégré. C'est un point d'honnêteté, pas une faiblesse.
5. **Ne pas lancer le seed** pendant la présentation : il écrase tout.

---

## Si ça tourne mal

| Symptôme | Réaction |
|---|---|
| La page met du temps au premier accès | C'est le réveil scale-to-zero. Parler pendant : « nos conteneurs dorment quand personne ne les utilise, c'est ce qui met l'hébergement à zéro dollar. » |
| Le flux du jour est vide | La fenêtre du seed est dépassée (plus de 7 jours depuis le dernier lancement). **Basculer sur la vidéo**, ne pas improviser. |
| Une action échoue | Une seule tentative, puis la vidéo. Ne jamais déboguer devant la salle. |
| Le réseau tombe | La vidéo. La prof l'a explicitement prévue comme solution de repli. |

---

## Vérifié le 10 août 2026 sur l'application en ligne

| Point | Résultat |
|---|---|
| Connexion réception et médecin | ✅ |
| Création d'une plage + génération automatique des créneaux | ✅ 4 créneaux de 30 min |
| Réservation avec création d'un patient léger | ✅ |
| Créneau réservé retiré de la liste | ✅ |
| Cycle À venir → Présents → Clôturés | ✅ |
| Confirmation sur les statuts terminaux | ✅ |
| Annulation : motif obligatoire (bouton désactivé sans motif) | ✅ |
| Créneau libéré et réservable de nouveau | ✅ vérifié dans la liste |
| Notifications émises sur les 3 événements | ✅ 4 notifications |
| Le médecin reçoit les notifications | ✅ compteur à 4 sur son compte |
| RBAC : 6 entrées de menu pour l'admin, 3 pour le médecin | ✅ |
| Export CSV | ✅ HTTP 200 |
| Statistiques sur données réelles | ✅ 185 RDV, 7 % no-show, 65,9 % occupation |
| Erreurs dans la console du navigateur | ✅ **aucune** |

### Après enrichissement du jeu de démonstration

| Point | Résultat |
|---|---|
| Horaires de la clinique à l'écran | ✅ 8 h 30 → 16 h 30 *(affichait 4 h 30 → 12 h 30 avant correction du fuseau)* |
| Flux du jour : les trois groupes remplis | ✅ Présents, À venir, Clôturés |
| Jeudi 13 août : journée exploitable | ✅ 24 créneaux, 9 RDV, 2 annulations, 15 libres |
| Libellés accentués (statistiques, notifications) | ✅ |

> La cloche de notifications est **vide juste après un seed** : les notifications
> naissent des actions, pas des données. Elle se remplit pendant la démonstration,
> ce qui est précisément l'effet recherché à l'étape 8.
