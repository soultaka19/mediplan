# Brief de tournage — segment Zakaria (2e prise)

> ⚠️ **Option écartée le 12 août 2026 : cette prise n'aura pas lieu.** Le film a
> été monté avec les trois rushes existants, et le chapitre sur l'annulation
> reconstruit à partir de la capture `audit-12-cancel-confirm.png`. Voir
> [`PLAN-MONTAGE-VIDEO.md`](../../presentation/video/PLAN-MONTAGE.md) § 3.
>
> Le document est conservé : il reste valable si une prise redevient possible,
> et il liste les défauts de captation à ne pas reproduire.

> Une seule prise d'environ **2 minutes**, sur l'application **déployée**.
> Ton premier rush est bon sur le fond — c'est le contenu qui est repris presque
> tel quel. Cette seconde prise sert à corriger l'environnement et à ajouter la
> séquence d'annulation, qui manquait.

---

## Pourquoi on refait cette prise

| Dans la 1re prise | Effet |
|---|---|
| Tourné sur `localhost:4200` | Les deux autres rushes sont sur Azure. Le jury verrait « localhost » et se demanderait si l'application est vraiment déployée. |
| L'autocomplétion Chrome affiche ton nom réel (0:27→0:32) | Données personnelles à l'écran. |
| Onglet « Portail Étudiant – La Cité » ouvert | Parasite. |
| Patient nommé « sarah ghiii » | Le nom réapparaît dans la confirmation puis dans la liste. |
| 6-7 RDV du jour, 33-39 % de remplissage | Les autres rushes affichent 10 RDV et 53 % : le film se contredirait. |
| **L'annulation n'est jamais jouée** | Tu l'annonces dans ta conclusion, Souleymane l'annonce dans son sommaire. Personne ne la montre. |

---

## Préparation — 5 minutes, à faire avant d'enregistrer

1. **Ouvrir l'application déployée**, pas le serveur local :
   `https://ca-mediplan-frontend.ashytree-9ad5012f.canadacentral.azurecontainerapps.io`
   ⚠️ Se connecter **une fois** d'abord pour réveiller les conteneurs
   (scale-to-zero : 10 à 15 s au premier accès), puis se déconnecter.
2. **Fenêtre de navigation privée** (`Ctrl+Maj+N`) — cela supprime d'un coup
   l'autocomplétion, la synchronisation du profil et la photo d'avatar.
3. **Un seul onglet ouvert.** Fermer le Portail Étudiant.
4. **Plein écran** (`F11`) — cela masque la barre d'adresse *et* la barre des
   tâches Windows. Enregistrer en **1920 × 1080**.
5. **Couper les notifications** : Windows → Assistant de concentration → Ne pas
   déranger. Fermer Teams, Discord, Outlook.
6. Vérifier que le bandeau « Nouvelle version de Chrome disponible » n'apparaît
   pas — s'il est là, redémarrer Chrome d'abord.

### Compte à utiliser

| Rôle | Identifiant | Mot de passe |
|---|---|---|
| Réception | `admin.demo@mediplan.test` | `Adm1n!Secret` |

Partir **déjà connecté**, sur le tableau de bord. La connexion est déjà filmée
par Souleymane, on ne la refait pas.

---

## Le déroulé — 5 séquences

Le commentaire reste le tien. Ce qui suit est le **fil des gestes**, pas un texte
à réciter. Parle comme la première fois, simplement un peu plus posément.

### 1 · Réserver — ≈ 40 s

Bouton **Nouveau rendez-vous** dans la barre du haut.

> « Le téléphone sonne. Madame Nadeau veut un rendez-vous. »

| Champ | Valeur |
|---|---|
| Médecin | **Sophie Bergeron** |
| Disponibilité | une plage **du jour même** |
| Créneau | le premier libre |
| Prénom | **Camille** |
| Nom | **Nadeau** |
| Motif | **Suivi de tension** |

⚠️ **Taper le prénom et le nom d'une traite, sans hésiter.** Dans la première
prise, cette saisie a pris 23 secondes d'image figée. Si tu bloques, ce n'est pas
grave — on coupe au montage — mais essaie d'enchaîner.

Cliquer **Réserver**. Laisser la confirmation à l'écran ~2 s, cliquer **OK**.

### 2 · Le cycle de vie — ≈ 30 s

Menu de gauche → **Flux du jour**. Sur la ligne de Camille Nadeau :

1. **Marquer arrivé** — laisser voir la pastille changer
2. **Démarrer la consultation**
3. **Terminer** → une confirmation s'ouvre → **Terminé**

> ⏸️ **Un temps d'arrêt d'une seconde entre chaque clic.** C'est ce qui permet au
> montage de faire vivre les pastilles de statut. Dans la première prise
> l'enchaînement était bon — refais exactement pareil, juste un peu plus lent.

### 3 · ★ L'annulation — ≈ 40 s · **c'est la séquence nouvelle, la plus importante**

D'abord réserver un **second** rendez-vous, rapidement :
**Nouveau rendez-vous** → Sophie Bergeron → même plage → créneau suivant →
`Thomas` `Leclerc`.

> Au passage : « Regardez la liste des créneaux : celui de Camille n'y est plus.
> Il est pris, il a disparu. »

Retourner sur **Flux du jour** → ligne de Thomas Leclerc → bouton **⋯** →
**Annuler le rendez-vous**.

**Avant de saisir quoi que ce soit, s'arrêter sur le dialogue** et le montrer :

> « Le bouton de confirmation est inactif. On ne peut pas annuler sans motif —
> c'est une règle métier, pas une politesse. »

Saisir le motif : `Patient empêché — rappellera demain`, puis **Confirmer
l'annulation**. Laisser lire le message :

> « Le rendez-vous de Thomas Leclerc a été annulé. Le créneau est de nouveau
> disponible. »

### 4 · ★ La preuve — ≈ 20 s · **ne pas sauter cette étape**

Rouvrir **Nouveau rendez-vous** → Sophie Bergeron → **la même plage** → ouvrir la
liste des créneaux.

> « Le créneau de Thomas est revenu dans la liste. Un créneau annulé n'est pas un
> créneau perdu — il repart à la vente. »

Puis **Annuler** le dialogue, sans réserver.

C'est le moment le plus convaincant de toute la démonstration : il prouve une
règle métier au lieu de montrer un écran. Prendre le temps.

### 5 · La conclusion — ≈ 25 s

Revenir sur **Rendez-vous** et montrer les filtres par statut, comme dans la
première prise, puis conclure. Ta conclusion actuelle marche très bien et devient
enfin exacte :

> « En gros, ma partie montre comment la réception gère concrètement une journée
> de clinique : créer un rendez-vous pour un patient au téléphone, suivre son
> évolution dans le flux du jour, et gérer une annulation proprement, avec un
> motif. »

---

## Réglages d'enregistrement

| | |
|---|---|
| Définition | **1920 × 1080** |
| Cadence | 30 i/s |
| Micro | le plus près possible — les trois rushes étaient 16 à 23 dB trop bas |
| Format | MP4 (H.264 + AAC) |
| Nom du fichier | `demo-zakaria-v2.mp4`, dans `docs/presentation/` |

Le niveau sonore est **rattrapé au montage**, donc pas d'inquiétude si c'est
faible — mais parler près du micro évite d'avoir à trop remonter.

---

## Les interdits

1. **Ne pas taper les dates au clavier** — passer par l'icône du calendrier. Le
   sélecteur Material interprète mal la frappe directe.
2. **Ne pas cliquer l'accès rapide grisé « Médecins »** : cet écran n'existe pas.
3. **Ne pas supprimer une plage qui porte des rendez-vous** : l'application le
   refuse, volontairement.
4. **Aucun F5** pendant la prise.
5. **Ne pas lancer le seed** : il écrase les données.

---

## Une seule chose à vérifier avant d'envoyer le fichier

Ouvrir la vidéo et regarder **les quatre coins** de l'image :

- [ ] Aucune barre des tâches Windows
- [ ] Aucune barre d'adresse, donc aucun `localhost`
- [ ] Aucune infobulle de survol en bas à gauche
- [ ] Aucune liste d'autocomplétion avec ton nom
- [ ] Aucune notification qui apparaît en cours de route

Si un seul de ces points échoue, il vaut mieux refaire la prise que de le
rattraper au montage.
