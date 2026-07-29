# -*- coding: utf-8 -*-
"""Genere le support de PRESENTATION (revue) du Sprint 2 de MediPlan (PowerPoint).

Consigne : presentation du 29-30 juillet 2026 portant sur CE QUI A ETE REALISE
au Sprint 2 (et non le plan). Structure calquee sur les elements demandes par la
professeure : rappel du projet, objectif du sprint, developpement de la solution,
demonstration, tests et validation, difficultes, avancement Jira, prochaines etapes.

Voir Sprint2-presentation.md pour le decoupage, le minutage et le script de demo.

Usage : python docs/presentation/build_sprint2_presentation_pptx.py
Sortie : docs/presentation/MediPlan-Sprint2-Presentation.pptx
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# --- Palette (identique aux supports precedents, continuite visuelle) ---
BLEU = RGBColor(0x15, 0x4D, 0x8C)
BLEU_CLAIR = RGBColor(0x1E, 0x88, 0xE5)
SARCELLE = RGBColor(0x00, 0x89, 0x7B)
GRIS = RGBColor(0x40, 0x40, 0x40)
GRIS_CLAIR = RGBColor(0x6B, 0x6B, 0x6B)
BLANC = RGBColor(0xFF, 0xFF, 0xFF)
FOND = RGBColor(0xF4, 0xF7, 0xFB)
BLEU_PALE = RGBColor(0xCF, 0xE3, 0xFF)
BLEU_PALE2 = RGBColor(0x9F, 0xC8, 0xF5)
AMBRE = RGBColor(0xB5, 0x6A, 0x00)
VERT = RGBColor(0x2E, 0x7D, 0x32)

LARGEUR = Inches(13.333)
HAUTEUR = Inches(7.5)

prs = Presentation()
prs.slide_width = LARGEUR
prs.slide_height = HAUTEUR
BLANK = prs.slide_layouts[6]


def fond(slide, couleur=BLANC):
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = couleur


def rect(slide, x, y, w, h, couleur):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    sh.fill.solid()
    sh.fill.fore_color.rgb = couleur
    sh.line.fill.background()
    sh.shadow.inherit = False
    return sh


def zone_texte(slide, x, y, w, h):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    return tb, tf


def para(tf, texte, taille=18, couleur=GRIS, gras=False, puce=False,
         espace_avant=6, niveau=0, aligne=PP_ALIGN.LEFT, premier=False):
    p = tf.paragraphs[0] if premier else tf.add_paragraph()
    p.alignment = aligne
    p.level = niveau
    p.space_after = Pt(espace_avant)
    p.space_before = Pt(0)
    run = p.add_run()
    run.text = (("•  " if puce else "") + texte)
    run.font.size = Pt(taille)
    run.font.bold = gras
    run.font.color.rgb = couleur
    run.font.name = "Calibri"
    return p


def notes(slide, texte):
    slide.notes_slide.notes_text_frame.text = texte


def bandeau_titre(slide, numero, titre, sous_titre=None):
    rect(slide, 0, 0, LARGEUR, Inches(1.25), BLEU)
    rect(slide, 0, Inches(1.25), LARGEUR, Pt(6), SARCELLE)
    past = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(0.45), Inches(0.32),
                                  Inches(0.62), Inches(0.62))
    past.fill.solid(); past.fill.fore_color.rgb = SARCELLE
    past.line.fill.background(); past.shadow.inherit = False
    pf = past.text_frame; pf.word_wrap = False
    pp = pf.paragraphs[0]; pp.alignment = PP_ALIGN.CENTER
    r = pp.add_run(); r.text = str(numero); r.font.size = Pt(22)
    r.font.bold = True; r.font.color.rgb = BLANC
    tb, tf = zone_texte(slide, Inches(1.25), Inches(0.18), Inches(11.6), Inches(1.0))
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    para(tf, titre, taille=27, couleur=BLANC, gras=True, premier=True, espace_avant=0)
    if sous_titre:
        para(tf, sous_titre, taille=14, couleur=BLEU_PALE, espace_avant=0)


def pied(slide, orateur, duree):
    tb, tf = zone_texte(slide, Inches(0.45), Inches(7.0), Inches(12.4), Inches(0.4))
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.LEFT
    r = p.add_run(); r.text = f"Orateur : {orateur}"
    r.font.size = Pt(11); r.font.color.rgb = GRIS_CLAIR; r.font.italic = True
    tb2, tf2 = zone_texte(slide, Inches(10.0), Inches(7.0), Inches(2.9), Inches(0.4))
    p2 = tf2.paragraphs[0]; p2.alignment = PP_ALIGN.RIGHT
    r2 = p2.add_run(); r2.text = f"⏱  {duree}"
    r2.font.size = Pt(11); r2.font.color.rgb = SARCELLE; r2.font.bold = True


def carte(slide, x, y, w, h, titre, lignes, couleur_titre=BLEU, taille_ligne=13):
    rect(slide, x, y, w, h, FOND)
    rect(slide, x, y, Pt(6), h, couleur_titre)
    tb, tf = zone_texte(slide, x + Inches(0.25), y + Inches(0.12),
                        w - Inches(0.4), h - Inches(0.2))
    para(tf, titre, taille=16, couleur=couleur_titre, gras=True, premier=True,
         espace_avant=4)
    for l in lignes:
        para(tf, l, taille=taille_ligne, couleur=GRIS, puce=bool(l.strip()), espace_avant=3)


def chiffre(slide, x, y, largeur, valeur, libelle, couleur):
    rect(slide, x, y, largeur, Inches(1.5), couleur)
    tb, tf = zone_texte(slide, x, y + Inches(0.08), largeur, Inches(1.4))
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    para(tf, valeur, taille=38, couleur=BLANC, gras=True, premier=True,
         aligne=PP_ALIGN.CENTER, espace_avant=0)
    para(tf, libelle, taille=12, couleur=BLANC, aligne=PP_ALIGN.CENTER, espace_avant=0)


# =========================================================================
# DIAPO 1 — Titre
# =========================================================================
s = prs.slides.add_slide(BLANK)
fond(s, BLEU)
rect(s, 0, Inches(3.05), LARGEUR, Pt(4), SARCELLE)
tb, tf = zone_texte(s, Inches(1.0), Inches(1.3), Inches(11.3), Inches(1.4))
para(tf, "MediPlan", taille=58, couleur=BLANC, gras=True, premier=True,
     aligne=PP_ALIGN.CENTER, espace_avant=0)
tb, tf = zone_texte(s, Inches(1.0), Inches(2.2), Inches(11.3), Inches(0.7))
para(tf, "Plateforme web de gestion des rendez-vous médicaux", taille=22,
     couleur=BLEU_PALE, premier=True, aligne=PP_ALIGN.CENTER, espace_avant=0)
tb, tf = zone_texte(s, Inches(1.0), Inches(3.25), Inches(11.3), Inches(1.4))
para(tf, "Présentation du Sprint 2", taille=28, couleur=BLANC,
     gras=True, premier=True, aligne=PP_ALIGN.CENTER, espace_avant=8)
para(tf, "Revue de réalisation — ce qui a été développé, testé et intégré", taille=18,
     couleur=BLEU_PALE2, aligne=PP_ALIGN.CENTER, espace_avant=0)
tb, tf = zone_texte(s, Inches(1.0), Inches(5.3), Inches(11.3), Inches(1.5))
para(tf, "Équipe : Souleymane DIALLO  ·  Zakaria Lahouiri  ·  Larbi Saib", taille=18,
     couleur=BLANC, premier=True, aligne=PP_ALIGN.CENTER, espace_avant=4)
para(tf, "Projet intégrateur — Programmation informatique  ·  Collège La Cité  ·  Printemps 2026",
     taille=14, couleur=BLEU_PALE2, aligne=PP_ALIGN.CENTER, espace_avant=2)
para(tf, "Présentation des 29–30 juillet 2026", taille=13,
     couleur=BLEU_PALE, aligne=PP_ALIGN.CENTER, espace_avant=6)
notes(s, "Bonjour. Nous venons vous présenter ce que nous avons réalisé au Sprint 2 de "
         "MediPlan, notre plateforme de gestion des rendez-vous médicaux. Nous allons "
         "rappeler brièvement le projet, l'objectif du sprint, comment la solution est "
         "construite, vous démontrer ce qui fonctionne, présenter nos tests, les "
         "difficultés rencontrées et ce qui passe au Sprint 3. Chacun de nous présentera "
         "sa partie. Environ dix minutes.")

# =========================================================================
# DIAPO 2 — Rappel du projet
# =========================================================================
s = prs.slides.add_slide(BLANK)
fond(s)
bandeau_titre(s, 1, "Rappel du projet", "MediPlan — gérer les rendez-vous d'une clinique")
carte(s, Inches(0.45), Inches(1.65), Inches(6.1), Inches(2.5),
      "Problématique",
      ["Dans une clinique, la prise de rendez-vous par téléphone est",
       "   manuelle : agendas papier, doubles réservations, oublis",
       "Pas de vue claire de l'activité du jour pour la réception",
       "Données de patients sensibles à protéger et à cloisonner"], AMBRE)
carte(s, Inches(6.75), Inches(1.65), Inches(6.1), Inches(2.5),
      "Solution proposée",
      ["Application web : la réception gère les rendez-vous à la place",
       "   des patients (qui appellent au téléphone)",
       "Disponibilités des médecins → créneaux réservables générés",
       "Flux du jour en temps réel + contrôle d'accès par rôle (RBAC)"], SARCELLE)
carte(s, Inches(0.45), Inches(4.4), Inches(12.4), Inches(2.35),
      "Utilisateurs / clients visés",
      ["Réception / administrateur de clinique — utilisateur principal : crée et suit les rendez-vous",
       "Médecin — consulte ses disponibilités et le flux de sa journée",
       "Patient « léger » — créé au comptoir, sans compte ni mot de passe (il téléphone, il ne s'inscrit pas)",
       "Super-administrateur — supervise l'ensemble des cliniques",
       " ",
       "Stack : Angular (frontend) · NestJS (backend) · PostgreSQL (base) · Docker (environnement)"], BLEU)
pied(s, "Souleymane", "1 min 30")
notes(s, "D'abord un rappel. Le problème : dans une clinique, la prise de rendez-vous se "
         "fait au téléphone, à la main — agendas papier, doubles réservations, oublis — et "
         "la réception n'a pas de vue claire de sa journée. Notre solution est une "
         "application web où la réception gère les rendez-vous à la place des patients, qui "
         "appellent. On saisit les disponibilités d'un médecin, le système génère les "
         "créneaux réservables, et la réception réserve. L'utilisateur principal est donc "
         "la réception ; le médecin consulte sa journée ; le patient est « léger », créé au "
         "comptoir sans compte. Le tout en Angular, NestJS, PostgreSQL et Docker.")

# =========================================================================
# DIAPO 3 — Objectif du Sprint 2
# =========================================================================
s = prs.slides.add_slide(BLANK)
fond(s)
bandeau_titre(s, 2, "Objectif du Sprint 2", "Ce que l'équipe voulait accomplir")
rect(s, Inches(0.45), Inches(1.6), Inches(12.4), Inches(1.05), SARCELLE)
tb, tf = zone_texte(s, Inches(0.75), Inches(1.7), Inches(11.8), Inches(0.9))
tf.vertical_anchor = MSO_ANCHOR.MIDDLE
para(tf, "Objectif", taille=12, couleur=BLEU_PALE, gras=True, premier=True, espace_avant=2)
para(tf, "Une réception se connecte de façon sécurisée, définit les disponibilités des médecins "
         "et réserve un rendez-vous pour un patient — sans jamais créer de double réservation.",
     taille=16, couleur=BLANC, gras=True, espace_avant=0)
carte(s, Inches(0.45), Inches(2.9), Inches(6.1), Inches(3.85),
      "Fonctionnalités visées",
      ["Authentification complète + contrôle d'accès (RBAC 4 rôles)",
       "Modéliser le « patient léger » géré par la réception",
       "Définir les disponibilités des médecins",
       "Générer automatiquement les créneaux réservables",
       "Réserver un rendez-vous (réception) sans double-réservation",
       "Suivre le flux clinique du jour (statuts de consultation)",
       "Interface soignée + mode sombre (design system)"], BLEU)
carte(s, Inches(6.75), Inches(2.9), Inches(6.1), Inches(3.85),
      "Pourquoi ce périmètre",
      ["C'est la tranche verticale la plus utile : de la connexion",
       "   jusqu'à un rendez-vous réel dans l'agenda",
       "Elle couvre le cœur métier (anti-double-réservation) et la",
       "   sécurité (données de santé, RBAC)",
       "Chaque fonctionnalité est démontrable de bout en bout",
       " ",
       "Note : notre découpage interne comptait plusieurs sprints ;",
       "   ils ont été alignés sur le calendrier du cours."], SARCELLE)
pied(s, "Souleymane", "1 min")
notes(s, "L'objectif du Sprint 2 : qu'une réception puisse se connecter de façon "
         "sécurisée, définir les disponibilités des médecins et réserver un rendez-vous "
         "pour un patient, sans jamais créer de double réservation. "
         "Les fonctionnalités visées : l'authentification complète avec le contrôle "
         "d'accès par rôle, le patient léger, les disponibilités, la génération des "
         "créneaux, la réservation par la réception, le flux du jour, et une interface "
         "soignée. Nous avons choisi ce périmètre parce que c'est la tranche la plus utile "
         ": de la connexion jusqu'à un vrai rendez-vous dans l'agenda, en couvrant le cœur "
         "métier et la sécurité.")

# =========================================================================
# DIAPO 4 — Developpement : architecture & lien entre les parties
# =========================================================================
s = prs.slides.add_slide(BLANK)
fond(s)
bandeau_titre(s, 3, "Développement — architecture générale",
              "Comment les parties fonctionnent ensemble")

# Trois blocs + fleches (frontend -> backend -> base)
def bloc(x, titre, lignes, couleur):
    rect(s, x, Inches(1.85), Inches(3.5), Inches(2.5), couleur)
    tb, tf = zone_texte(s, x + Inches(0.2), Inches(2.0), Inches(3.15), Inches(2.25))
    para(tf, titre, taille=17, couleur=BLANC, gras=True, premier=True, espace_avant=4,
         aligne=PP_ALIGN.CENTER)
    for l in lignes:
        para(tf, l, taille=12, couleur=BLANC, espace_avant=3, aligne=PP_ALIGN.CENTER)

bloc(Inches(0.55), "Frontend — Angular",
     ["Écrans réception & médecin", "Signals · Material 3", "Design system (tokens)"], BLEU_CLAIR)
bloc(Inches(4.9), "Backend — NestJS",
     ["API REST /api/v1", "JWT + guards RBAC", "Validation par DTO"], SARCELLE)
bloc(Inches(9.25), "Base — PostgreSQL",
     ["TypeORM + migrations", "Index anti-double", "Données cloisonnées"], BLEU)
# fleches
for fx in (Inches(4.35), Inches(8.7)):
    a = s.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, fx, Inches(2.9), Inches(0.5), Inches(0.45))
    a.fill.solid(); a.fill.fore_color.rgb = GRIS_CLAIR; a.line.fill.background(); a.shadow.inherit = False

carte(s, Inches(0.45), Inches(4.7), Inches(12.4), Inches(2.05),
      "Le lien entre les parties (un flux de réservation)",
      ["1.  Le navigateur envoie une requête HTTPS au backend, avec le jeton JWT dans l'en-tête (proxy /api → NestJS)",
       "2.  NestJS valide le jeton, vérifie le rôle (guard RBAC) et les données reçues (DTO), puis applique la règle métier",
       "3.  TypeORM écrit en base dans une transaction ; l'index unique partiel garantit qu'un créneau n'est pris qu'une fois",
       "4.  La réponse remonte au frontend, qui met à jour l'affichage via les signals — monorepo unique (frontend + backend)"], BLEU)
pied(s, "Zakaria", "1 min 30")
notes(s, "Voici comment la solution est construite. Trois parties dans un seul dépôt "
         "(monorepo) : un frontend Angular, un backend NestJS, et une base PostgreSQL. "
         "Elles communiquent ainsi : le navigateur envoie une requête au backend avec un "
         "jeton d'authentification ; NestJS vérifie le jeton, le rôle de l'utilisateur et "
         "les données reçues, puis applique la règle métier ; TypeORM écrit en base dans "
         "une transaction, et c'est un index unique en base qui garantit qu'un créneau "
         "n'est réservé qu'une seule fois ; enfin la réponse revient au frontend qui "
         "rafraîchit l'écran. Docker permet de tout lancer d'une commande.")

# =========================================================================
# DIAPO 5 — Developpement : les trois couches en detail
# =========================================================================
s = prs.slides.add_slide(BLANK)
fond(s)
bandeau_titre(s, 4, "Développement — base, backend, frontend",
              "Les choix techniques, couche par couche")
carte(s, Inches(0.45), Inches(1.65), Inches(4.05), Inches(5.0),
      "Base de données",
      ["PostgreSQL, schéma issu de l'ERD",
       "Migrations TypeORM versionnées",
       "Entités : Clinique, Utilisateur,",
       "   Disponibilité, Créneau, RDV",
       "Patient léger : rôle patient,",
       "   mot de passe NULL",
       "Cœur métier :",
       "   index unique partiel sur le",
       "   créneau (hors annulés) →",
       "   pas de double réservation",
       "Cloisonnement par clinic_id"], BLEU)
carte(s, Inches(4.7), Inches(1.65), Inches(4.05), Inches(5.0),
      "Backend — NestJS",
      ["API REST sous /api/v1",
       "Modules : auth, user, clinic,",
       "   availability, appointment",
       "JWT (HS256, 60 min), bcrypt",
       "Guards + @Roles → RBAC",
       "Validation des entrées par DTO",
       "   (class-validator)",
       "Verrouillage de compte (5/15 min)",
       "Transactions + verrous pour la",
       "   réservation concurrente"], SARCELLE)
carte(s, Inches(8.95), Inches(1.65), Inches(3.9), Inches(5.0),
      "Frontend — Angular",
      ["Composants standalone",
       "État réactif par signals",
       "Angular Material 3",
       "Design system : une seule",
       "   source de tokens (couleurs,",
       "   typographie) → cohérence",
       "Intercepteur : jeton ajouté",
       "   automatiquement, gestion 401",
       "Masquage des vues selon le rôle",
       "Mode clair / sombre complet"], BLEU_CLAIR)
pied(s, "Zakaria", "1 min 30")
notes(s, "En détail, couche par couche. La base : PostgreSQL, un schéma issu de notre "
         "modèle de conception, avec des migrations versionnées. La pièce maîtresse est un "
         "index unique partiel sur le créneau : c'est la base de données elle-même qui "
         "empêche deux réservations sur le même créneau. Le patient léger est un "
         "utilisateur sans mot de passe, donc non connectable. "
         "Le backend, en NestJS, expose une API REST organisée en modules ; il gère "
         "l'authentification JWT, le contrôle d'accès par rôle via des guards, valide "
         "toutes les entrées, et utilise des transactions pour la réservation. "
         "Le frontend, en Angular, utilise des composants autonomes et un état réactif ; "
         "toute l'interface passe par un design system unique, avec un mode sombre complet, "
         "et masque les écrans selon le rôle de l'utilisateur.")

# =========================================================================
# DIAPO 6 — Demonstration
# =========================================================================
s = prs.slides.add_slide(BLANK)
fond(s)
bandeau_titre(s, 5, "Démonstration — ce qui fonctionne", "Parcours réel de la réception")
carte(s, Inches(0.45), Inches(1.65), Inches(7.4), Inches(5.05),
      "Le scénario que nous démontrons en direct",
      ["1.  Connexion réception → l'en-tête affiche « Alice Tremblay »",
       "     (le profil vient du serveur, pas du jeton)",
       "2.  Disponibilités → saisir une plage datée + une durée",
       "     → le système génère seul les créneaux réservables",
       "3.  Réserver → choisir médecin, créneau libre, patient, motif",
       "     → le rendez-vous entre dans l'agenda",
       "4.  Flux du jour → dérouler le cycle : Arrivé → En consultation",
       "     → Terminé (ou Absent)",
       "5.  Annuler un rendez-vous avec motif → le créneau se libère",
       "     et redevient réservable  (fonctionnalité déjà livrée)",
       "6.  RBAC visible : « Utilisateurs » disparaît pour un médecin",
       "7.  Mode sombre en un clic"], SARCELLE, taille_ligne=13)
carte(s, Inches(8.05), Inches(1.65), Inches(4.8), Inches(5.05),
      "Logique de fonctionnement",
      ["Le patient n'agit pas en ligne :",
       "   la réception fait tout pour lui",
       " ",
       "Une disponibilité datée →",
       "   des créneaux → un rendez-vous",
       " ",
       "Un créneau ne peut être pris",
       "   qu'une fois (garanti en base)",
       " ",
       "Chaque écran est protégé selon",
       "   le rôle de l'utilisateur connecté",
       " ",
       "Données de démo réalistes en place",
       "   (2 médecins, 10 patients, RDV",
       "   du jour à statuts variés)"], BLEU)
pied(s, "Larbi (démonstration)", "2 min")
notes(s, "Passons à la démonstration — je pilote l'application. Je me connecte comme la "
         "réception : l'en-tête affiche le nom Alice Tremblay, pas l'e-mail, car le profil "
         "vient du serveur. Je crée une disponibilité datée avec une durée, et le système "
         "génère tout seul les créneaux réservables. Ensuite je réserve : je choisis le "
         "médecin, un créneau libre, je saisis le patient et un motif, et le rendez-vous "
         "entre dans l'agenda. Dans le flux du jour, je déroule le cycle de consultation : "
         "arrivé, en consultation, terminé. Je montre aussi l'annulation avec motif, qui "
         "libère le créneau — une fonctionnalité que nous avons déjà livrée. Enfin, le "
         "contrôle d'accès se voit à l'écran : l'entrée « Utilisateurs » disparaît pour un "
         "médecin. Et le mode sombre bascule d'un clic. "
         "Consigne pratique : naviguer par le menu, éviter de multiplier les rechargements.")

# =========================================================================
# DIAPO 7 — Tests et validation
# =========================================================================
s = prs.slides.add_slide(BLANK)
fond(s)
bandeau_titre(s, 6, "Tests et validation", "Ce que nous avons vérifié")
chiffre(s, Inches(0.45), Inches(1.6), Inches(2.85), "171", "Tests automatisés verts", VERT)
chiffre(s, Inches(3.55), Inches(1.6), Inches(2.85), "48", "Tests backend (NestJS)", SARCELLE)
chiffre(s, Inches(6.65), Inches(1.6), Inches(2.85), "123", "Tests frontend (Angular)", BLEU_CLAIR)
chiffre(s, Inches(9.75), Inches(1.6), Inches(2.85), "0", "Test en échec", BLEU)
carte(s, Inches(0.45), Inches(3.35), Inches(6.1), Inches(3.4),
      "Tests réalisés",
      ["Backend : services et contrôleurs (auth, disponibilités,",
       "   réservation, flux) + validation des DTO",
       "Anti-double-réservation testé en situation de concurrence",
       "Frontend : composants, services HTTP, guards de rôle,",
       "   intercepteurs, façade d'authentification",
       "Vérification manuelle bout-en-bout dans le navigateur",
       "Migrations rejouées sur une base neuve (reproductible)"], VERT)
carte(s, Inches(6.75), Inches(3.35), Inches(6.1), Inches(3.4),
      "Bogues identifiés → corrigés",
      ["Erreur 500 à la réservation (verrou SQL mal placé sur une",
       "   jointure) → verrou ciblé sur la ligne du RDV",
       "Sélecteur « Médecin » qui ne s'ouvrait pas (l'étiquette",
       "   captait le clic) → corrigé",
       "Rendez-vous du jour vides (fuseau horaire) → dates relatives",
       "En-tête affichant l'e-mail au lieu du nom → repli sur le nom",
       "Motif d'annulation vide accepté → validation renforcée"], AMBRE)
pied(s, "Larbi", "1 min 30")
notes(s, "Côté tests, nous avons 171 tests automatisés qui passent : 48 sur le backend, "
         "123 sur le frontend, zéro en échec. Sur le backend, nous testons les services et "
         "les contrôleurs — authentification, disponibilités, réservation, flux — et la "
         "validation des données. Le point important : l'anti-double-réservation est testé "
         "en situation de concurrence, deux réservations simultanées sur le même créneau. "
         "Sur le frontend, nous testons les composants, les services, les guards de rôle et "
         "les intercepteurs. Nous complétons par des vérifications manuelles dans le "
         "navigateur. "
         "Nous avons aussi trouvé et corrigé de vrais bogues : une erreur 500 à la "
         "réservation due à un verrou SQL mal placé ; un sélecteur de médecin qui ne "
         "s'ouvrait pas parce que l'étiquette captait le clic ; des rendez-vous du jour "
         "vides à cause du fuseau horaire ; l'en-tête qui affichait l'e-mail au lieu du "
         "nom ; et un motif d'annulation vide accepté. Tous corrigés.")

# =========================================================================
# DIAPO 8 — Difficultes rencontrees et solutions
# =========================================================================
s = prs.slides.add_slide(BLANK)
fond(s)
bandeau_titre(s, 7, "Difficultés rencontrées et solutions",
              "Techniques et organisationnelles")
carte(s, Inches(0.45), Inches(1.65), Inches(6.1), Inches(2.55),
      "⚠  Organisation — dérive d'intégration (vécue)",
      ["Plusieurs branches en parallèle jamais fusionnées",
       "→ deux migrations sur le même horodatage, un module",
       "   de rendez-vous recréé en double",
       "Solution : réintégration manuelle, puis 6 règles de",
       "   travail (socle d'abord, PR sous 72 h, un module par",
       "   ticket, gates de fusion, point d'intégration à mi-sprint)"], AMBRE)
carte(s, Inches(6.75), Inches(1.65), Inches(6.1), Inches(2.55),
      "⚠  Technique — la réservation concurrente",
      ["Comment empêcher deux réceptions de réserver le même",
       "   créneau au même instant ?",
       "Solution : index unique partiel en base + transaction",
       "   avec verrou → c'est PostgreSQL qui tranche la course,",
       "   pas le code applicatif",
       "Vérifié par un test de concurrence"], BLEU_CLAIR)
carte(s, Inches(0.45), Inches(4.45), Inches(12.4), Inches(2.3),
      "Autres difficultés techniques levées",
      ["Verrou SQL « FOR UPDATE » posé sur une jointure externe → erreur 500 : on verrouille la seule ligne du RDV",
       "Dépendance circulaire au démarrage d'Angular (intercepteur ↔ authentification) → initialisation différée",
       "Identifiants de démo invalides (UUID) refusés par la validation → génération d'UUID conformes",
       "Fuseau horaire : rendez-vous « du jour » calculés en référence à Toronto pour rester cohérents"], SARCELLE)
pied(s, "Souleymane", "1 min 30")
notes(s, "Nos difficultés, en toute transparence. Sur l'organisation d'abord : au départ, "
         "plusieurs branches ont vécu en parallèle sans être fusionnées, ce qui a produit "
         "des migrations en double et un module recréé deux fois. Nous avons dû tout "
         "réintégrer à la main, et surtout nous en avons tiré six règles de travail que "
         "nous appliquons depuis : le code qui touche la base passe en premier, aucune "
         "branche ne vit plus de trois jours sans être proposée à la fusion, un seul module "
         "par tâche, et on ne fusionne que si les tests passent. "
         "Sur la technique, la vraie question était la réservation concurrente : empêcher "
         "deux personnes de prendre le même créneau au même instant. Notre solution : c'est "
         "la base de données qui tric — un index unique et une transaction avec verrou. On "
         "l'a vérifié par un test de concurrence. Nous avons aussi levé plusieurs bogues "
         "plus pointus, comme un verrou SQL mal placé et une dépendance circulaire au "
         "démarrage.")

# =========================================================================
# DIAPO 9 — Avancement dans Jira
# =========================================================================
s = prs.slides.add_slide(BLANK)
fond(s)
bandeau_titre(s, 8, "Avancement dans Jira", "Répartition et progression")
chiffre(s, Inches(0.45), Inches(1.6), Inches(3.9), "18 / 21", "Tickets Sprint 2 terminés", VERT)
chiffre(s, Inches(4.55), Inches(1.6), Inches(3.9), "≈ 86 %", "Progression du sprint", BLEU)
chiffre(s, Inches(8.65), Inches(1.6), Inches(4.2), "3", "Tickets transférés au Sprint 3", GRIS)
carte(s, Inches(0.45), Inches(3.35), Inches(8.5), Inches(3.4),
      "Répartition des responsabilités (tâches terminées)",
      ["Souleymane DIALLO — authentification (15,16,17), réservation + anti-double (21),",
       "        squelettes du monorepo (28), Docker Compose (29), intégration",
       "Zakaria Lahouiri — disponibilités des médecins (20), flux clinique du jour (23)",
       "Larbi Saib — patient léger (35), réservation par la réception (36), socle RDV (49)",
       "Frontend d'authentification & refonte UI (42–48) — terminés, effort partagé",
       " ",
       "En cours (Sprint 3) : notifications internes (25, Zakaria)",
       "Déjà livré en avance : annulation d'un RDV (22) — à refléter dans Jira"], BLEU)
carte(s, Inches(9.15), Inches(3.35), Inches(3.7), Inches(3.4),
      "Transféré au Sprint 3",
      ["CRUD médecins par l'admin",
       "   (MEDIPLAN-34)",
       "Précision doc UC-02",
       "   (MEDIPLAN-38)",
       "Secrets / variables",
       "   d'environnement (MEDIPLAN-39)",
       " ",
       "Non bloquants pour la",
       "   démonstration"], GRIS)
pied(s, "Souleymane", "1 min")
notes(s, "Dans Jira, le Sprint 2 est terminé à 86 pour cent : 18 tickets sur 21. La "
         "répartition : j'ai porté l'authentification, la réservation avec "
         "l'anti-double-réservation, la mise en place du monorepo et Docker, et "
         "l'intégration. Zakaria a fait les disponibilités des médecins et le flux du jour. "
         "Larbi a modélisé le patient léger, la réservation par la réception et le socle "
         "technique des rendez-vous. Le frontend d'authentification et la refonte de "
         "l'interface ont été un effort partagé. "
         "Trois tickets passent au Sprint 3 : la gestion des médecins par l'admin, une "
         "précision de documentation, et les variables d'environnement — aucun n'est "
         "bloquant. Une notification interne est déjà en cours, et nous avons même livré "
         "l'annulation en avance ; nous mettrons Jira à jour en conséquence.")

# =========================================================================
# DIAPO 10 — Prochaines etapes / Sprint 3
# =========================================================================
s = prs.slides.add_slide(BLANK)
fond(s)
bandeau_titre(s, 9, "Prochaines étapes — Sprint 3", "Ce qui reste et nos priorités")
carte(s, Inches(0.45), Inches(1.65), Inches(6.1), Inches(3.1),
      "Priorités du Sprint 3 (cycle de vie du RDV)",
      ["Annuler un RDV avec motif — déjà livré, à valider (22)",
       "Notifications internes sur les changements (25) — en cours",
       "Statistiques et tableau de bord réels (26)",
       "Sécurité RDV : garde-fou patient léger + accès",
       "   en lecture cloisonné (50)",
       "Décaler en bloc les rendez-vous d'un médecin (24)"], SARCELLE)
carte(s, Inches(6.75), Inches(1.65), Inches(6.1), Inches(3.1),
      "Reporté depuis le Sprint 2",
      ["Gestion des médecins par l'admin (34)",
       "Précision documentaire UC-02 (38)",
       "Variables d'environnement & secrets (39)",
       " ",
       "Puis, en finalisation :",
       "   export CSV, intégration continue (CI),",
       "   déploiement, documentation des tests"], GRIS)
carte(s, Inches(0.45), Inches(4.95), Inches(12.4), Inches(1.8),
      "En un mot",
      ["Le Sprint 2 livre une tranche complète : se connecter → définir des disponibilités → réserver → suivre la journée.",
       "Le Sprint 3 ajoute le cycle de vie (annulation, notifications, statistiques) et durcit la sécurité des rendez-vous."],
      BLEU)
pied(s, "Zakaria", "1 min")
notes(s, "Pour la suite, le Sprint 3 porte sur le cycle de vie complet du rendez-vous. "
         "L'annulation avec motif est déjà livrée, il nous reste à la valider "
         "officiellement. Les notifications internes sont en cours. Viennent ensuite les "
         "statistiques réelles du tableau de bord, un renforcement de la sécurité des "
         "rendez-vous, et le décalage en bloc. Nous reprenons aussi les trois tickets "
         "reportés du Sprint 2. En résumé : le Sprint 2 livre une tranche complète, de la "
         "connexion au suivi de la journée ; le Sprint 3 ajoute le cycle de vie et durcit "
         "la sécurité.")

# =========================================================================
# DIAPO 11 — Merci / Questions
# =========================================================================
s = prs.slides.add_slide(BLANK)
fond(s, BLEU)
rect(s, 0, Inches(3.5), LARGEUR, Pt(4), SARCELLE)
tb, tf = zone_texte(s, Inches(1.0), Inches(2.2), Inches(11.3), Inches(1.4))
para(tf, "Merci de votre attention", taille=40, couleur=BLANC, gras=True,
     premier=True, aligne=PP_ALIGN.CENTER, espace_avant=0)
tb, tf = zone_texte(s, Inches(1.0), Inches(3.8), Inches(11.3), Inches(1.6))
para(tf, "Questions ?", taille=28, couleur=BLEU_PALE, gras=True,
     premier=True, aligne=PP_ALIGN.CENTER, espace_avant=0)
para(tf, "Équipe MediPlan — Souleymane DIALLO  ·  Zakaria Lahouiri  ·  Larbi Saib",
     taille=16, couleur=BLEU_PALE2, aligne=PP_ALIGN.CENTER, espace_avant=14)
notes(s, "En résumé, le Sprint 2 est réalisé et intégré : authentification sécurisée, "
         "disponibilités, réservation par la réception sans double-réservation, flux du "
         "jour, le tout couvert par 171 tests. Nous sommes disponibles pour vos questions."
         "\n\nQuestions probables :\n"
         "— « Pourquoi le patient ne réserve pas lui-même ? » → Choix métier : l'utilisateur "
         "réel est la réception ; le patient appelle. Le libre-service pourra venir plus tard.\n"
         "— « Comment empêchez-vous les doubles réservations ? » → Un index unique en base "
         "et une transaction avec verrou ; testé en concurrence.\n"
         "— « Les données sont-elles protégées ? » → RBAC à 4 rôles, cloisonnement par "
         "clinique, mots de passe hachés (bcrypt), verrouillage de compte.\n"
         "— « Qu'est-ce qui n'était pas fini ? » → Trois tickets non bloquants transférés au "
         "Sprint 3 (gestion des médecins, doc, secrets).\n"
         "— Chaque membre peut détailler sa contribution : voir la diapositive Jira.")

# --- Sauvegarde ----------------------------------------------------------
sortie = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                      "MediPlan-Sprint2-Presentation.pptx")
prs.save(sortie)
print("Genere :", sortie)
print("Nombre de diapos :", len(prs.slides._sldIdLst))
