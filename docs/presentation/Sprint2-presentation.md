# Présentation du Sprint 2 — MediPlan (Groupe 1)

Support de la **revue du Sprint 2** (ce qui a été réalisé), présentée les
**29–30 juillet 2026**. Consigne : ~10 min de présentation + 5 min de questions,
tous les membres présents et participants, chacun montre sa contribution.

- **Diaporama** : [`MediPlan-Sprint2-Presentation.pptx`](MediPlan-Sprint2-Presentation.pptx)
  — 11 diapositives, 16:9. Le texte à dire est dans les **notes de l'orateur**
  (mode Présentateur).
- **Régénération** : `python docs/presentation/build_sprint2_presentation_pptx.py`
  (nécessite `python-pptx`).

---

## Découpage et minutage (≈ 10 min)

| # | Diapositive | Orateur | Durée |
|---|---|---|---|
| 1 | Titre | Souleymane | 0:20 |
| 2 | Rappel du projet | Souleymane | 1:30 |
| 3 | Objectif du Sprint 2 | Souleymane | 1:00 |
| 4 | Architecture générale (lien entre les parties) | Zakaria | 1:30 |
| 5 | Base · Backend · Frontend | Zakaria | 1:30 |
| 6 | Démonstration (ce qui fonctionne) | **Larbi (pilote la démo)** | 2:00 |
| 7 | Tests et validation | Larbi | 1:30 |
| 8 | Difficultés rencontrées et solutions | Souleymane | 1:30 |
| 9 | Avancement Jira (répartition) | Souleymane | 1:00 |
| 10 | Prochaines étapes — Sprint 3 | Zakaria | 1:00 |
| 11 | Questions | les trois | — |

> Chaque membre a au moins deux prises de parole et présente **sa** contribution
> (voir la diapo 9). En questions, chacun répond sur son domaine.

---

## Contribution de chacun (à assumer à l'oral)

- **Souleymane DIALLO** — authentification complète (inscription, connexion JWT,
  verrouillage, RBAC : MEDIPLAN-15/16/17), **réservation d'un RDV +
  anti-double-réservation** (21), mise en place du monorepo (28), Docker Compose
  (29), **intégration** et annulation d'un RDV (22, livrée en avance).
- **Zakaria Lahouiri** — **disponibilités des médecins** + génération des créneaux
  (20), **flux clinique du jour** (23). En cours pour le Sprint 3 : notifications
  internes (25).
- **Larbi Saib** — modélisation du **patient léger** (35), **réservation par la
  réception** (36), **socle technique des RDV** + index anti-double-réservation (49).

Le frontend d'authentification et la refonte de l'interface (MEDIPLAN-42 à 48)
ont été un effort partagé.

---

## Script de démonstration (diapo 6)

> **Application : http://localhost:4201** — se connecter en direct, naviguer par
> le menu de gauche.

**Comptes de démonstration :**

| Rôle | Compte | Mot de passe | Affiche |
|---|---|---|---|
| Réception | `admin.demo@mediplan.test` | `Adm1n!Secret` | Alice Tremblay |
| Médecin | `doctor.demo@mediplan.test` | `Doct0r!Secret` | Sophie Bergeron |
| Médecin 2 | `doctor2.demo@mediplan.test` | `Doct0r!Secret` | Marc Lefebvre |

Données en place (seed) : 2 médecins, 10 patients, un planning du jour rempli,
**9 rendez-vous du jour** à statuts variés (terminé, réservé, arrivé, en
consultation, absent, annulé) et des **créneaux libres** pour réserver en direct.

**Déroulé :**

1. **Connexion** (réception) → l'en-tête affiche **Alice Tremblay** (le profil
   vient du serveur, pas du jeton).
2. **Tableau de bord** → *« RDV du jour »* affiche un compteur **réel**.
3. **Disponibilités** → saisir : médecin **Sophie Bergeron**, Type *Disponible*,
   une plage datée, durée `30`, Note → **Ajouter** → 1ʳᵉ icône *Voir les créneaux*
   → *« les créneaux sont générés seuls »*.
4. **Rendez-vous** (prise de RDV) → choisir un médecin → une disponibilité → un
   **créneau libre** → saisir un patient (prénom, nom) + motif → **Réserver** →
   redirection vers le flux du jour.
5. **Flux du jour** → sur une ligne *réservée* : **Arrivé → Consultation →
   Terminé**. Puis **Annuler** un RDV → saisir le motif → il disparaît du jour,
   *le créneau se libère* (fonctionnalité déjà livrée).
6. **Utilisateurs** → liste réservée aux admins (guard de rôle).
7. **Déconnexion → connexion médecin** (`doctor.demo`) → *« Bonjour Sophie
   Bergeron »*, badge Médecin, et **« Utilisateurs » a disparu du menu** — le RBAC
   se voit à l'écran.
8. **Mode sombre** → icône de lune, puis reclic.

---

## Chiffres clés

| | |
|---|---|
| Fonctionnalités livrées | Auth · Disponibilités · Réservation réception · Flux du jour · UI/dark |
| Tests | **48 backend + 123 frontend = 171 verts**, 0 échec |
| Avancement Sprint 2 | **18 / 21 tickets terminés (≈ 86 %)** |
| Transférés au Sprint 3 | 3 (CRUD médecins 34, doc UC-02 38, secrets 39) — non bloquants |
| Cœur métier | anti-double-réservation par **index unique partiel** en base, testé en concurrence |
| Sécurité | RBAC 4 rôles · cloisonnement `clinic_id` · bcrypt · verrouillage 5/15 min · patient léger non connectable |

---

## Préparation aux questions (5 min)

- **« Pourquoi le patient ne réserve pas lui-même ? »** → Choix métier : l'utilisateur
  réel est la réception ; le patient appelle. Le libre-service viendra plus tard.
- **« Comment évitez-vous les doubles réservations ? »** → Un index unique partiel en
  base (`WHERE status <> 'cancelled'`) + une transaction avec verrou : c'est
  PostgreSQL qui tranche la course, pas le code. Testé en concurrence.
- **« Les données sont-elles protégées ? »** → RBAC à 4 rôles, cloisonnement par
  clinique, mots de passe hachés (bcrypt), verrouillage de compte après 5 échecs.
- **« Qu'est-ce qui n'était pas fini ? »** → Trois tickets non bloquants transférés
  au Sprint 3 : gestion des médecins par l'admin, une précision de doc, les secrets
  d'environnement.
- **« Quelles difficultés ? »** → Une dérive d'intégration (branches non fusionnées)
  → 6 règles de travail ; plusieurs bogues techniques identifiés et corrigés (verrou
  SQL, sélecteur médecin, fuseau horaire).

---

## À vérifier dans Jira avant de présenter (la prof peut l'ouvrir)

L'état des labels est correct (`project = MEDIPLAN AND labels = "Sprint-2"`), mais
deux tickets méritent une mise à jour pour refléter la réalité du code :

1. **MEDIPLAN-22** (Annuler un RDV) : marqué *À faire*, **mais livré** → passer en
   *Terminé* (ou l'assumer comme « livré en avance sur le Sprint 3 »).
2. **MEDIPLAN-51** (Modernisation UI) : l'essentiel est **livré** (42–48 + refonte)
   → mettre à jour le statut.
3. Optionnel : démarrer puis clore les sprints natifs pour que le tableau reflète la
   progression (sinon rester sur le filtre par label).

> Les trois tickets réellement inachevés du Sprint 2 (34, 38, 39) sont assumés et
> présentés comme transférés au Sprint 3.
