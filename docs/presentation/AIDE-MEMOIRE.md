# Déroulé — http://127.0.0.1:4310 · jamais de F5

| Rôle | Compte | Mot de passe | Affiche |
|---|---|---|---|
| Réception | `admin.demo@mediplan.test` | `Adm1n!Secret` | Alice Tremblay |
| Médecin | `doctor.demo@mediplan.test` | `Doct0r!Secret` | Grace Hopper |

**ADMIN (réception)**
1. **Login** admin → tableau de bord → *« les 3 compteurs sont des placeholders → MEDIPLAN-26 »*
2. **Disponibilités** → `Grace Hopper` | `16/07/2026 09:00` → `12:00` | `30` | **Ajouter** → 1ʳᵉ icône → *« 6 créneaux générés seuls = MEDIPLAN-20 »*
3. **Flux du jour** → **Ada Lovelace** → `Arrive` → `Consultation` → `Termine` → *« patient léger, créé au comptoir »* → **« ce qui manque : annuler = 1er ticket du Sprint 3 »**
4. **Utilisateurs** → *« liste admin, guard de rôle »* → **lune** → sombre → reclic

**MÉDECIN**
5. **Menu utilisateur → Déconnexion** → login `doctor.demo` → *« Bonjour Grace Hopper », badge Médecin, et **« Utilisateurs » a disparu du menu** — le RBAC se voit à l'écran »* ⚠ ne pas cliquer « Utilisateurs » dans Accès rapides

**PLAN**
6. **Diapos 3 → 7** : objectif (cycle de vie du RDV) · 4 Must, un par personne · 22 seul et en premier · 6 branches jamais fusionnées → 6 règles · « terminé » = fusionné dans `dev`

---
**Interdits** : F5 · entrées « bientôt » · promettre le décalage en bloc (24 non intégré)
**Chiffres** : 171 tests (48+123) · 4 fonctionnalités · `dev` = `main`
**Si on demande** : doubles réservations → index unique partiel, PostgreSQL tranche, testé en concurrence · patient ne réserve pas → il appelle · dates → à caler avec vous · Jira → filtre `labels = "Sprint-3"`
