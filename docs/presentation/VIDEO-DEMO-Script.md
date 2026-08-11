# Vidéo démonstrative — script de tournage

> **Livrable imposé** : environ 5 minutes, forme d'un **court tutoriel** montrant
> comment la solution fonctionne **du point de vue d'un utilisateur**. Ce n'est
> pas une explication du développement. **Chaque membre de l'équipe doit y
> participer.**
>
> Cette vidéo sert aussi de solution de repli si la démonstration en direct ne
> fonctionne pas le 13 août.

---

## La règle qui gouverne tout le script

**On raconte le travail d'Alice, réceptionniste. On ne raconte pas MediPlan.**

Une phrase interdite : « ici on peut voir que… ». Une phrase attendue : « le
téléphone sonne, madame Nadeau veut un rendez-vous ».

Concrètement, dans les textes ci-dessous :

| Ne dites pas | Dites |
|---|---|
| « le système génère les créneaux » | « je décris ma matinée, les rendez-vous se découpent tout seuls » |
| « un index unique empêche la double réservation » | « le créneau a disparu : personne d'autre ne peut le prendre » |
| « le contrôle d'accès RBAC masque les entrées » | « la Dre Bergeron ne voit que ce qui la concerne » |
| « une notification est émise » | « son fil s'est rempli tout seul pendant que je travaillais » |

Aucun mot technique dans la voix : ni API, ni base de données, ni rôle, ni
migration. Ces mots ont leur place dans la présentation, pas dans le tutoriel.

---

## Découpage — 5 minutes, 3 voix

| # | Durée | Voix | Séquence |
|---|---|---|---|
| 1 | 0:00 – 0:25 | **Souleymane** | Ouverture : le problème en deux phrases |
| 2 | 0:25 – 1:30 | **Souleymane** | Connexion · tableau de bord · publier une matinée |
| 3 | 1:30 – 2:35 | **Zakaria** | Le téléphone sonne : réserver pour un patient |
| 4 | 2:35 – 3:30 | **Zakaria** | La journée en cours : accueillir, consulter, terminer |
| 5 | 3:30 – 4:05 | **Zakaria** | Un patient annule : le créneau repart |
| 6 | 4:05 – 4:45 | **Larbi** | Le suivi : chiffres, export, côté médecin |
| 7 | 4:45 – 5:00 | **les trois** | Clôture |

**Total : 5 min 00.** Chacun parle environ 1 min 40, 1 min 40 et 1 min 15 — la
consigne demande la participation de tous, pas une égalité au chronomètre.

---

# Séquence 1 — Ouverture · Souleymane · 25 s

**À l'écran** : la page de connexion de MediPlan, immobile.

> « Dans une petite clinique médicale, les rendez-vous se prennent au téléphone.
> La réception note tout dans un agenda partagé — et deux personnes peuvent
> inscrire deux patients sur le même créneau sans s'en rendre compte.
>
> MediPlan est l'outil de la réception. Je vais vous montrer une journée
> complète : publier les disponibilités d'un médecin, prendre un rendez-vous au
> téléphone, suivre les patients de la journée, et gérer une annulation. »

---

# Séquence 2 — Connexion et première matinée · Souleymane · 65 s

### Plan 2.1 — Se connecter · 15 s

**À l'écran** : saisir `admin.demo@mediplan.test`, puis le mot de passe, cliquer
**Se connecter**.

> « Je suis Alice, à la réception. Je me connecte. »

*(l'application affiche « Bonjour, Alice Tremblay »)*

> « L'application sait qui je suis et ce que j'ai le droit de faire. »

### Plan 2.2 — Le tableau de bord · 10 s

**À l'écran** : rester sur le tableau de bord, ne cliquer sur rien.

> « J'arrive sur ma journée : combien de patients sont attendus, et le prochain
> rendez-vous. »

### Plan 2.3 — Publier une matinée · 40 s

**À l'écran** : menu de gauche → **Disponibilités** → **Ajouter une plage**.

> « La Dre Bergeron me dit qu'elle consulte demain matin, de neuf heures à midi,
> par tranches de trente minutes. »

**Remplir**, sans se presser :

| Champ | Valeur |
|---|---|
| Médecin | **Sophie Bergeron** |
| Du | **demain** — ⚠️ par le **calendrier**, jamais au clavier |
| Heure de début | **09 h 00** |
| Heure de fin | **12 h 00** |

**Marquer une pause** sur la ligne d'aperçu qui apparaît (« ≈ 6 créneaux de
30 min réservables ») avant de cliquer **Ajouter**.

> « Je décris sa matinée une seule fois. Les six rendez-vous se découpent tout
> seuls — je n'ai pas à les écrire un par un. »

*(la confirmation s'affiche, cliquer **OK**)*

---

# Séquence 3 — Le téléphone sonne · Zakaria · 65 s

**À l'écran** : bouton **Nouveau rendez-vous**, en haut à droite.

> « Le téléphone sonne. Madame Nadeau voudrait voir la Dre Bergeron demain
> matin. »

**Remplir dans l'ordre** — le dialogue le dit lui-même : médecin, créneau,
patient.

1. Médecin → **Sophie Bergeron**
2. Disponibilité → **la matinée qu'on vient de créer** *(en bas de la liste)*
3. Créneau → **09 h 00 – 09 h 30**

> « Je choisis le médecin, la matinée, puis l'heure qui convient à la patiente. »

4. Prénom **Camille**, Nom **Nadeau**, Motif **Suivi de tension**

> « Madame Nadeau n'a pas de compte, et n'en aura pas besoin. Je la crée ici, au
> comptoir, avec son nom. C'est tout ce dont j'ai besoin pour lui donner un
> rendez-vous. »

*(cliquer **Réserver**)*

**Rouvrir aussitôt Nouveau rendez-vous**, même médecin, même matinée, et
**ouvrir la liste des créneaux** :

> « Et regardez : neuf heures a disparu de la liste. Le créneau est pris.
> Personne ne peut le donner une deuxième fois — même si ma collègue réserve au
> même moment, sur un autre poste. »

*(fermer le dialogue avec **Annuler**)*

---

# Séquence 4 — La journée en cours · Zakaria · 55 s

**À l'écran** : menu de gauche → **Flux du jour**.

> « Voilà ma journée d'aujourd'hui. Les patients déjà passés, ceux qui sont là en
> ce moment, et ceux que j'attends encore. »

**Choisir une ligne du groupe « À venir » dont le médecin est Sophie Bergeron**
— la séquence 6 montre sa cloche, et elle ne se remplit que des rendez-vous qui
la concernent. Puis dérouler, un clic à la fois, en laissant chaque changement
s'afficher :

1. **Marquer arrivé**

> « Le patient se présente au comptoir : je le marque arrivé. »

2. **Démarrer la consultation**

> « Le médecin le prend : il passe en consultation. »

3. **Terminer**, puis confirmer

> « Et la consultation est finie. »

**Marquer un temps**, puis :

> « Le médecin voit exactement le même écran que moi, en même temps. Il n'a plus
> besoin de venir demander qui est arrivé, et je n'ai plus besoin d'aller le lui
> dire. »

---

# Séquence 5 — Une annulation · Zakaria · 35 s

**À l'écran** : sur une ligne encore en « Réservé » — **de la Dre Bergeron, elle
aussi** — bouton **⋯** → **Annuler le rendez-vous**.

> « Un patient rappelle : il ne pourra pas venir. »

**Montrer le bouton de confirmation grisé** avant de saisir quoi que ce soit :

> « Je ne peux pas annuler sans dire pourquoi. »

**Saisir** : `Patient empêché — rappellera demain`, puis **Confirmer
l'annulation**.

*(le message s'affiche : « Le créneau est de nouveau disponible. »)*

> « Et le créneau repart tout de suite. Je peux le proposer au patient suivant —
> une place libérée n'est pas une place perdue. »

---

# Séquence 6 — Le suivi de la clinique · Larbi · 40 s

### Plan 6.1 — Les chiffres · 15 s

**À l'écran** : menu de gauche → **Statistiques**.

> « En fin de mois, la gestionnaire de la clinique regarde ceci : combien de
> rendez-vous, combien de patients ne se sont pas présentés, et à quel point
> l'agenda est rempli — médecin par médecin. »

### Plan 6.2 — L'export · 8 s

**À l'écran** : retour sur **Flux du jour**, cliquer **Exporter CSV**, puis
**ouvrir le fichier téléchargé**.

> « Et elle récupère le détail dans un tableur, en un clic. »

### Plan 6.3 — Le côté médecin · 17 s

**À l'écran** : menu utilisateur → **Se déconnecter** → se reconnecter avec
`doctor.demo@mediplan.test`.

> « Voici maintenant le même outil, vu par la Dre Bergeron. »

**Pointer, dans cet ordre** : le menu de gauche plus court, puis la cloche.

> « Elle ne voit que ce qui la concerne : sa journée et ses disponibilités. Et sa
> cloche s'est remplie toute seule pendant que je travaillais à la réception —
> chaque rendez-vous pris, modifié ou annulé l'a prévenue. »

**Ouvrir la cloche** et laisser lire une ou deux lignes.

---

# Séquence 7 — Clôture · les trois · 15 s

**À l'écran** : revenir au tableau de bord, ou l'écran de connexion.

> **Souleymane** : « MediPlan, c'est une clinique qui ne perd plus de créneau… »
>
> **Zakaria** : « …une réception et des médecins qui voient la même journée… »
>
> **Larbi** : « …et des chiffres pour piloter. Merci de votre attention. »

---

## Qui enregistre quoi, et comment

### La contrainte qui décide de tout

Les sept séquences ne sont pas indépendantes : **la séquence 3 réserve dans la
plage créée en séquence 2, la séquence 6 montre la cloche remplie par les
séquences 4 et 5.** L'application est partagée en ligne, donc l'état se propage
d'une personne à l'autre — mais seulement si on tourne **dans l'ordre et le même
jour**. Une matinée créée « demain » n'est plus demain le lendemain.

**Donc : une seule session de tournage, les sept séquences dans l'ordre.**
Comptez une heure et demie avec les reprises.

### Deux façons de s'organiser

| | Ensemble, même poste | À distance |
|---|---|---|
| Comment | Un seul ordinateur, chacun prend le clavier et parle à son tour | Appel Teams/Meet/Discord, **partage d'écran avec contrôle passé** à celui qui parle |
| Qui enregistre | La personne au clavier | **Une seule personne enregistre l'appel entier**, du début à la fin |
| Avantage | Le plus simple, aucun décalage son/image | Personne ne se déplace |
| Piège | Aucun | Le son du micro distant est plus faible — faire un essai de 20 s et l'écouter avant de tourner |

La consigne demande que chacun **participe**, pas que chacun manipule. **Une voix
identifiable sur sa séquence suffit.** Si Zakaria ou Larbi ne peuvent pas prendre
le clavier, ils narrent pendant que quelqu'un d'autre clique — c'est conforme.

### Avec quoi enregistrer (Windows 11, sans rien installer)

**Clipchamp** — c'est le meilleur choix ici : il **enregistre l'écran avec le
micro** *et* fait le montage, dans la même application. Il est déjà installé
(menu Démarrer → Clipchamp).

1. *Créer une vidéo* → **Enregistrer et créer** → **Écran** (ou *Écran et
   caméra*) ;
2. choisir **Fenêtre** puis la fenêtre du navigateur — pas *Écran entier*, ce qui
   éviterait toute notification parasite ;
3. vérifier que le micro est **actif et le bon** (le sélecteur est sous le bouton
   d'enregistrement) ;
4. une séquence = un enregistrement ; il atterrit directement sur la ligne de
   montage.

Deux solutions de repli : **Win + G** (Xbox Game Bar, enregistre la fenêtre
active avec le micro, pas de montage), ou **OBS Studio** si quelqu'un le connaît
déjà. Ne pas tourner au téléphone.

### Ordre de la session

| Prise | Qui parle | Qui clique | Ce qu'on enregistre |
|---|---|---|---|
| 1 | Souleymane | personne | Séquence 1 — écran de connexion immobile |
| 2 | Souleymane | Souleymane | Séquence 2 — connexion, tableau de bord, plage de demain |
| 3 | Zakaria | Zakaria | Séquence 3 — réservation + créneau disparu |
| 4 | Zakaria | Zakaria | Séquence 4 — cycle de vie ⚠️ **sur un RDV de Sophie Bergeron** |
| 5 | Zakaria | Zakaria | Séquence 5 — annulation ⚠️ **sur un RDV de Sophie Bergeron** |
| 6 | Larbi | Larbi | Séquence 6 — statistiques, export, compte médecin |
| 7 | les trois | — | Séquence 7 — clôture, trois phrases enchaînées |

> ⚠️ **Le point de coordination à ne pas rater.** Les séquences 4 et 5 doivent
> agir sur des rendez-vous **de la Dre Bergeron**. Sa cloche, montrée en séquence
> 6, ne se remplit que de ce qui la concerne. Si Zakaria travaille sur les
> rendez-vous de l'autre médecin, Larbi ouvrira une cloche vide et la meilleure
> phrase de la vidéo tombe à plat.

### Réglages du navigateur, avant la première prise

- Fenêtre **maximisée**, zoom **100 %** (`Ctrl + 0`) ;
- **barre de favoris masquée** (`Ctrl + Maj + B`) ;
- un seul onglet, **profil sans extension** — au besoin, une fenêtre invité ;
- **mode clair** dans MediPlan (l'icône de lune bascule le thème) ;
- **Ne pas déranger** activé sur Windows, téléphone en silencieux ;
- **session fermée** : la vidéo commence sur l'écran de connexion.

---

## Préparer le tournage

### Avant d'enregistrer

1. **Rafraîchir les données** pour obtenir une journée déjà animée — des
   consultations terminées, une en cours — plutôt qu'une journée entièrement
   « Réservé » :
   ```bash
   az containerapp job start --name caj-mediplan-seed --resource-group rg-projet-dev
   ```
   Attendre « Succeeded », puis **réveiller l'application** en se connectant une
   fois (le premier accès prend 10 à 15 secondes).

2. **Préparer le navigateur** : fenêtre en **1920 × 1080**, zoom à **100 %**,
   barre de favoris masquée, aucun onglet parasite, aucune extension visible,
   mode clair.

3. **Se déconnecter** : la vidéo commence sur l'écran de connexion.

4. **Choisir les heures** en fonction du moment du tournage : la matinée créée en
   séquence 2 doit être **demain**, et la ligne manipulée en séquence 4 doit être
   dans le groupe « À venir ».

### Pendant

- **Jamais de F5.** Naviguer uniquement par le menu de gauche.
- **Ralentir la souris.** Un curseur qui hésite se voit plus qu'une erreur.
- **Marquer une seconde** après chaque clic, le temps que l'écran réponde. Les
  silences se coupent au montage ; un écran coupé trop tôt, non.
- **Enregistrer séquence par séquence.** Sept prises courtes se refont
  facilement ; une prise de cinq minutes se refait sept fois.
- Si vous vous trompez : **ne pas s'excuser à voix haute**, s'arrêter, refaire la
  séquence.

### La voix

- Enregistrer la voix **en même temps que l'écran** — la synchronisation
  après coup coûte plus cher que quelques prises supplémentaires.
- **Lire le texte, mais ne pas le réciter.** Répéter deux fois à voix haute avant
  d'enregistrer suffit à faire disparaître le ton de lecture.
- Casque ou micro externe si possible. Le micro intégré d'un portable, à
  60 centimètres, donne un son creux qui fatigue en trente secondes.

### Le montage

- Enchaîner les sept séquences dans l'ordre, sans transition sophistiquée : un
  simple fondu, ou rien.
- **Un carton de titre au début** (3 s) : *MediPlan — gestion des rendez-vous
  d'une clinique · Souleymane DIALLO · Zakaria Lahouiri · Larbi Saib*.
- **Pas de musique de fond.** Elle masque la voix et n'apporte rien à un
  tutoriel.
- Exporter en **MP4, 1080p**. Vérifier la durée : **entre 4 min 30 et 5 min 30**.

### Avant de rendre

- [ ] La durée est comprise entre 4 min 30 et 5 min 30
- [ ] Les trois voix sont présentes et identifiables
- [ ] Aucun mot technique dans la narration
- [ ] Le son est audible sans monter le volume au maximum
- [ ] Aucune donnée personnelle réelle à l'écran (les patients sont fictifs)
- [ ] Le fichier se lit sur un autre ordinateur que celui du montage
