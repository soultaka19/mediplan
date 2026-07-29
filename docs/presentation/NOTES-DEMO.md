# Démo MediPlan — script d'actions

> Tout est lancé. **Application : http://127.0.0.1:4310**
> Ne rafraîchissez jamais la page (F5) : l'en-tête retomberait sur « admin.demo »
> au lieu d'« Alice Tremblay ». Naviguez uniquement par le menu de gauche.

---

## 0. Connexion — 30 s

| Champ | Valeur |
|---|---|
| Adresse e-mail | `admin.demo@mediplan.test` |
| Mot de passe | `Adm1n!Secret` |

Faites-la **devant elle** (ne partez pas d'une session ouverte).

> **À dire** : « Je me connecte comme la réception de la clinique. »
> **À montrer** : l'en-tête affiche **Alice Tremblay** — le profil vient du serveur,
> pas du jeton.

---

## 1. Tableau de bord — 1 min

Vous y arrivez automatiquement après la connexion. Ne cliquez sur rien.

> **À dire** : « Voici l'espace de la réception. Interface, palette et typographie
> viennent de notre design system : une seule source de tokens. »
>
> **Devancez la question** : « Les trois compteurs sont encore des placeholders —
> c'est exactement le ticket MEDIPLAN-26 du sprint que je vous présente. »

⚠ Ne cliquez pas sur les entrées grisées « bientôt » (Rendez-vous, Profil, Médecins).

---

## 2. Disponibilités — créer une plage en direct — 2 min

Menu de gauche → **Disponibilités**.

La liste montre déjà une plage : *16 juill. 2026, 13 h 00 → 16 h 00, 30 min, Alan Turing*.

**Créez-en une devant elle**, avec ces valeurs exactes :

| Champ | Valeur à saisir |
|---|---|
| Médecin | **Grace Hopper** |
| Type | **Disponible** (déjà par défaut) |
| Début | `16/07/2026 09:00` |
| Fin | `16/07/2026 12:00` |
| Durée | `30` (déjà par défaut) |
| Note | `Consultations du matin` |

→ Cliquez **+ Ajouter**.

Puis, sur la ligne créée, cliquez la **première icône d'action** (« Voir les créneaux »).

> **À dire** : « Je saisis une plage datée et une durée de créneau. Le système génère
> les créneaux réservables tout seul — ici **6 créneaux de 30 minutes** entre 9 h et
> 12 h. C'est la fonctionnalité MEDIPLAN-20, livrée. »

*(Les dates se saisissent au format `jj/mm/aaaa` puis l'heure ; le champ est un
sélecteur de date-heure natif.)*

---

## 3. Flux du jour — le cœur de la démo — 3 min

Menu de gauche → **Flux du jour**.

Deux vrais rendez-vous du jour s'affichent :

| Heure | Patient | Médecin | Statut |
|---|---|---|---|
| 09:00 - 09:30 | Ada Lovelace | Grace Hopper | Reserve |
| 09:30 - 10:00 | Charles Babbage | Grace Hopper | Reserve |

**Déroulez le cycle de vie sur la ligne d'Ada Lovelace :**

1. Cliquez **Arrive** → le statut passe à « Arrive », le bouton *Consultation* s'active.
2. Cliquez **Consultation** → statut « En consultation », *Termine* s'active.
3. Cliquez **Termine** → statut « Termine ».

> **À dire pendant les clics** : « Ada Lovelace est un **patient léger** : créée au
> comptoir par la réception, sans compte, sans mot de passe. C'est le flux réel d'une
> clinique — le patient appelle, il ne s'inscrit pas en ligne. »
>
> **Puis, la transition vers votre plan** : « Ce qui manque ici, c'est **annuler** un
> rendez-vous. C'est le premier ticket du Sprint 3 que je vous présente. »

**Si elle demande « et les doubles réservations ? »** — votre meilleure réponse :
« Un index unique partiel en base : c'est PostgreSQL qui tranche la course, pas le
code. Testé en concurrence. »

---

## 4. Utilisateurs — 30 s

Menu de gauche → **Utilisateurs**.

> **À dire** : « Liste réservée aux administrateurs de clinique, protégée par un guard
> de rôle. Chacun ne voit que sa propre clinique — c'est notre RBAC, MEDIPLAN-17. »

---

## 5. Mode sombre — 20 s

Cliquez l'**icône de lune**, en haut à droite de la barre.

> **À dire** : « Thème sombre complet — toute l'interface passe par les mêmes tokens,
> aucun écran n'a été retouché à la main. »

Recliquez pour revenir en clair.

---

## 6. Enchaînez sur le plan de Sprint 3

Ouvrez `MediPlan-Sprint3-Plan.pptx` (le texte à dire est dans les notes de l'orateur).

Le fil : objectif → backlog (4 Must, **un par personne**) → séquençage → risques et
règles → définition de « terminé ».

Le passage le plus fort est le **slide « Risques et règles de travail »** : assumez la
dérive d'intégration du sprint précédent, puis enchaînez sur les six règles.

---

## Les valeurs, en un coup d'œil

| | |
|---|---|
| Clinique | Clinique MediPlan — Ottawa |
| Réception | `admin.demo@mediplan.test` / `Adm1n!Secret` — Alice Tremblay |
| Médecin | `doctor.demo@mediplan.test` / `Doct0r!Secret` — Grace Hopper |
| Médecin 2 | `doctor2.demo@mediplan.test` / `Doct0r!Secret` — Alan Turing |
| Patients légers | Ada Lovelace, Charles Babbage (aucun compte, non connectables) |
| Données en place | 2 plages, 12 créneaux, 2 RDV du jour |
| Tests | 48 backend + 123 frontend = **171 verts** |
| Preuve GitHub | branche `dev` = `main`, merge `71cb40f` puis `38400da` |

## Les trois choses à ne pas faire

1. **Pas de F5** → l'en-tête retombe sur « admin.demo » (bug identifié, corrigé au Sprint 3).
2. **Pas de clic sur les « bientôt »** → placeholders assumés.
3. **Ne promettez pas le décalage en bloc** (MEDIPLAN-24) : le code existe sur une
   branche mais n'est pas intégré. Vous l'avez rouvert vous-même — c'est un point
   d'honnêteté.

## Si elle ouvre Jira

Les tableaux **ne sont pas encore renommés** : elle verra « Tableau Sprint 4 » là où
vous dites « Sprint 3 ». Les **labels sont corrects** : le filtre
`project = MEDIPLAN AND labels = "Sprint-3"` montre exactement le sprint présenté.
À dire si besoin : « notre découpage interne comptait 6 sprints ; le tableau que nous
présentons est notre 4e, c'est le Sprint 3 attendu. »
