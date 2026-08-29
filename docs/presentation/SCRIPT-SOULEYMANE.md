# Script mot à mot — Souleymane

**Présentation finale MediPlan · 13 août 2026**

Texte prêt à dire, calibré à **150 mots par minute** — un débit oral posé, avec
les silences comptés dans le budget. Chaque bloc annonce son nombre de mots et sa
durée réelle.

| Diapositive | Budget | Ce script |
|---|---|---|
| 1 · Ouverture | 30 s | 76 mots → **32 s** |
| 2 · Le problème | 50 s | 120 mots → **50 s** |
| 3 · Notre solution | 55 s | 122 mots → **51 s** *(+ options)* |
| 6 · Architecture | 1 min 15 | 182 mots → **1 min 15** |
| 7 · Double réservation | 55 s | 133 mots → **55 s** |
| 15 · Ma contribution | 18 s | 49 mots → **20 s** |
| 16 · Clôture | 20 s | 42 mots → **19 s** |
| | **5 min 03** | **5 min 02** ✓ |

> **Ne mémorisez pas mot à mot.** Mémorisez les **phrases en gras** — ce sont les
> seules qui doivent sortir exactement. Le reste, dites-le avec vos mots : un
> texte récité s'entend, un texte compris s'écoute.

---

## Diapositive 1 · Ouverture · 30 s

> ## « Quand vous avez besoin d'un rendez-vous chez le médecin, vous appelez. »
>
> *— silence, deux secondes —*
>
> « À l'autre bout, quelqu'un décroche, ouvre un agenda, et cherche une place.
>
> ## **C'est cette personne-là que nous avons outillée.**
>
> Bonjour. Nous sommes Souleymane, Zakaria et Larbi, et voici MediPlan :
> **l'agenda de la personne qui décroche**, dans une clinique de quartier. Il est
> en ligne, et nous vous le montrons en direct.
>
> Le problème et l'architecture pour moi, la démarche et les tests pour Larbi, la
> démonstration pour Zakaria. »

**76 mots + 2 s de silence = 32 s.** Deux secondes au-dessus du budget, absorbées
par la marge globale de 40 s.

### Pourquoi cette ouverture-là

Elle attaque par **un geste que toute la salle a fait** — appeler pour un
rendez-vous. Aucune connaissance préalable n'est requise : ni une marque, ni un
produit, ni un terme technique. En douze mots, le jury est dans votre sujet.

Puis elle fait quelque chose de rare : **elle déplace la caméra**. Tout le monde
pense au patient qui appelle ; vous faites pivoter l'attention vers la personne
qui décroche. C'est votre produit tout entier, raconté en une image, avant même
d'avoir prononcé son nom.

Trois choses sont posées en trente secondes :

- **le domaine** — les rendez-vous médicaux, par l'expérience et non par une
  définition ;
- **l'utilisateur** — la réception, pas le patient. C'est votre décision produit
  la plus importante, et elle passe ici sans être argumentée : elle le sera à la
  diapositive 3 ;
- **la preuve à venir** — c'est en ligne, et ça se voit tout à l'heure.

**Jeu.** Face à la salle, la diapositive dans le dos, vous ne la regardez pas une
seule fois. La première phrase se dit **posément**, presque comme une question
qu'on pose à quelqu'un. Le silence de deux secondes laisse chacun se répondre
mentalement *« … oui, j'appelle »* — et c'est ce hochement de tête intérieur qui
vous achète les quatorze minutes suivantes.

Appuyez sur **« cette personne-là »**. C'est le mot qui fait le déplacement.

**À ne pas faire.** Poser la question en attendant vraiment une réponse. C'est
une question rhétorique : vous répondez vous-même, dans la même respiration.
Un jury qui ne sait pas s'il doit répondre se fige, et vous perdez le bénéfice.

---

## Diapositive 2 · Le problème · 50 s

> « Imaginez le comptoir d'une clinique de quartier. Deux personnes décrochent le
> téléphone en même temps, et toutes les deux inscrivent un patient à dix heures.
>
> *— silence, deux secondes —*
>
> Personne ne le sait — jusqu'à ce que les deux se présentent, et qu'il faille le
> démêler devant eux.
>
> **Ce n'est pas de la négligence, c'est un outillage :** les rendez-vous vivent
> entre un téléphone, un agenda papier et un fichier partagé.
>
> Trois irritants reviennent. Le premier, vous venez de le voir. Le deuxième : un
> rendez-vous annulé n'est jamais remis en circulation — le créneau est perdu. Le
> troisième : personne n'a de vue partagée sur la journée ; on se lève pour
> demander qui est arrivé.
>
> **Ces trois-là ont cadré tout ce qui suit.** »

**120 mots + 2 s de silence = 50 s.**

**Jeu.** La scène se raconte **au présent**, en regardant le jury — pas l'écran.
Pendant que vous racontez, il lit les deux colonnes tout seul, et c'est
exactement ce qu'on veut.

Ralentissez sur « *deux personnes décrochent le téléphone en même temps* » : ce
sont les huit mots qui installent le fil rouge de toute la présentation.

**À ne pas faire.** Parcourir les colonnes à voix haute. Vous diriez ce qui est
déjà lu, et vous perdriez les vingt secondes qui servent à poser le contexte.

---

## Diapositive 3 · Notre solution · 55 s

> « Notre première version plaçait le patient au centre : il se crée un compte,
> il réserve en ligne, comme sur les grandes plateformes.
>
> En travaillant le besoin, nous avons compris que dans une petite clinique, ça ne
> se passe pas comme ça. Le patient appelle. **Celui qui vit le problème, c'est la
> réception.**
>
> *— silence, deux secondes —*
>
> ## **Ce changement d'avis nous a coûté le modèle de données.**
>
> Si le patient est au centre, il lui faut un compte, un mot de passe, un courriel
> à vérifier. S'il n'y est plus, il doit pouvoir exister **sans rien de tout ça** —
> parce qu'au téléphone, il n'ouvrira jamais de compte.
>
> D'où **le patient léger** : la réception le crée au comptoir, un nom, un
> téléphone. Il n'a rien à retenir. »

**122 mots + 2 s de silence = 51 s.** Il vous reste **4 secondes** de marge.

### C'est ici que se raconte votre changement d'avis

La diapositive 1 a posé *pour qui* vous avez construit. Celle-ci dit *comment vous
l'avez découvert* — et c'est ce qui la rend crédible. Vous ne dites pas « nous
avons eu une bonne idée », vous dites **« nous avons eu une idée ordinaire, nous
avons travaillé le besoin, et nous en avons changé »**.

Un jury de projet intégrateur évalue une **démarche** autant qu'un produit. Ce
paragraphe *est* votre démarche — et il n'est pas fabriqué pour l'occasion : il
est écrit au § 1.1 de votre cahier des charges.

**Ne nommez aucune marque.** « Comme sur les grandes plateformes » se comprend
partout ; une marque précise ne se comprend que si la salle la connaît, et vous
n'avez aucun moyen de le savoir.

### Les trois ajouts optionnels, si vous êtes en avance

**① L'amorce vers la diapositive 7 — +9 s.** À placer à la toute fin :

> « Le premier de nos objectifs, c'était de rendre la double réservation
> impossible. Je vous montre dans deux minutes comment nous l'avons tenu. »

*Le meilleur des trois : il tisse votre partie et prépare votre plus forte
diapositive.*

**② La nuance sur le libre-service — +13 s.** Après « il n'a rien à retenir » :

> « Et celui qui veut réserver seul le peut : il a son espace. Les deux canaux
> passent par la même transaction et le même index en base. La garantie ne dépend
> pas du canal. »

*Déjà dans votre tableau de questions, où elle sera mieux payée.*

**③ Le noyau minimal — +18 s.** En fin de diapositive :

> « Nous avions arrêté en début de projet cinq fonctionnalités à livrer coûte que
> coûte : se connecter avec des droits, publier une plage, réserver sans doublon
> possible, suivre le rendez-vous dans la journée, annuler et récupérer le
> créneau. **Les cinq sont livrées.** »

*Votre professeure avait demandé ce noyau dans sa rétroaction. Le citer montre que
vous l'avez lue.*

⚠️ **Vous n'avez de la place que pour un seul.** Si vous devez choisir : le ①.

**Jeu.** Ce que le jury doit entendre, c'est l'enchaînement de cause à effet :
*observation du terrain → décision produit → conséquence sur le modèle de
données.* C'est ce qui sépare un choix subi d'un choix tenu.

Ralentissez sur **« celui qui vit le problème, c'est la réception »** : c'est la
phrase qui justifie tout le reste du projet.

Les trois colonnes sont survolées du regard, jamais lues.

---

## Diapositive 6 · Architecture · 1 min 15

> « L'architecture tient en une phrase : un monorepo, deux applications, une base
> de données. Angular devant, NestJS derrière, PostgreSQL en dessous.
>
> Ce qui mérite d'être expliqué, ce sont trois choix.
>
> **Premier choix :** le schéma de la base n'est piloté que par des migrations
> versionnées. Nous avons désactivé la synchronisation automatique de TypeORM.
> C'est contraignant, mais le schéma est reproductible : n'importe qui reconstruit
> exactement la même base.
>
> **Deuxième choix** — celui dont je suis le plus content.
> ## **Notre backend n'a pas d'adresse publique.**
>
> *— silence, deux secondes —*
>
> Même en connaissant son nom, vous ne pouvez pas l'appeler depuis Internet. Il
> est en ingress interne : seul le frontend peut lui parler.
>
> Et c'est pour ça que nous n'avons pas une seule ligne de configuration CORS. Il
> n'y a jamais de requête inter-origines. **Nous n'avons pas configuré le
> problème, nous l'avons supprimé.**
>
> **Troisième choix :** toute l'infrastructure est décrite en code, en Bicep.
> Aucune ressource n'a été créée à la main dans le portail Azure. Et grâce au
> scale-to-zero, ça nous coûte environ zéro dollar par mois — notre crédit
> étudiant n'était pas renouvelable. »

**182 mots + 2 s de silence = 1 min 15.**

**Jeu — le dosage est tout.** Les choix ① et ③ sont **énoncés** : débit normal,
on avance. Le choix ② est **joué** : vous ralentissez, vous marquez le silence,
vous pointez la colonne backend à l'écran, puis vous revenez au jury pour la
phrase sur le CORS.

Si les trois choix sortent au même rythme, la diapositive devient une liste et
votre meilleur argument d'architecture se noie dans les deux autres.

**La phrase qui compte.** *« Nous n'avons pas configuré le problème, nous l'avons
supprimé. »* C'est la différence entre un développeur et un architecte, et c'est
le cœur du critère « choix réalisés ».

---

## Diapositive 7 · La double réservation · 55 s

**La meilleure diapositive de votre partie. Ne la survolez pas.**

> « Je reviens sur les deux réceptionnistes du début.
>
> L'approche naturelle, c'est : je vérifie que le créneau est libre, puis
> j'écris.
>
> Mais entre le « je vérifie » et le « j'écris », **il y a un intervalle. Aussi
> petit soit-il, il existe.** C'est là que l'autre requête passe. Les deux voient
> le créneau libre. Les deux réservent.
>
> *— silence, deux secondes —*
>
> ## **Alors nous avons arrêté d'essayer de gagner la course. Nous avons demandé à PostgreSQL de refuser.**
>
> Un index unique partiel sur le créneau — partiel, parce qu'il ignore les
> annulés. La base refuse physiquement la deuxième écriture.
>
> Et ce même index nous donne l'annulation gratuitement : un rendez-vous annulé
> sort de l'index, donc le créneau redevient réservable. Un seul mécanisme règle
> deux irritants sur trois.
>
> **La garantie n'est pas dans la discipline du développeur. Elle est dans la
> base.** »

**133 mots + 2 s de silence = 55 s.**

**Jeu.** C'est la seule diapositive où vous avez le droit de ralentir
franchement. Trois appuis :

1. **« il y a un intervalle. Aussi petit soit-il, il existe »** — détachez chaque
   mot. C'est là que le jury comprend que le problème est structurel, pas un
   oubli de code.
2. **Le silence avant « alors nous avons arrêté »** — deux secondes pleines.
   C'est le sommet de votre partie.
3. **La dernière phrase**, lentement, en regardant le jury. C'est celle qu'on
   retiendra de vous.

**Si on vous demande « et si le code oublie la vérification ? »**

> « C'est précisément l'intérêt. Le code peut oublier. La base, non. »

---

## Diapositive 15 · Ma contribution · 18 s

> « J'ai porté le socle et la sécurité : monorepo, authentification, contrôle
> d'accès par rôle, mise en ligne.
>
> Ma difficulté : un bogue qui n'existait qu'en production. J'ai cessé de relire
> le code pour comparer comment Azure et Docker routent les requêtes.
>
> ## **Ce n'était pas le code. C'était l'environnement.** »

**49 mots = 20 s.** Deux secondes au-dessus du dix-huitième — c'est le maximum
tolérable si vos deux coéquipiers tiennent les leurs.

**Jeu.** Première personne, **toujours « j'ai », jamais « on a »** : sur cette
diapositive précisément, « on » dilue la contribution qu'on vous demande
justement d'individualiser.

Finissez sur la leçon, pas sur la liste. Une contribution qui se termine par des
fonctionnalités s'oublie ; une contribution qui se termine par ce qu'on a compris
reste.

**Chronométrez-la à la répétition.** C'est la diapositive qu'on perd quand on a
dérivé, et elle vaut 8 % avec les questions.

---

## Diapositive 16 · Clôture · 20 s

> « Si vous ne deviez retenir qu'une chose : la garantie qui compte le plus dans
> ce produit — qu'un créneau ne soit jamais donné deux fois — n'est pas dans notre
> code.
>
> *— silence, deux secondes —*
>
> ## **Elle est dans la base.**
>
> Merci. Nous répondons à vos questions. »

**42 mots + 2 s de silence = 19 s.**

**Variante à 23 s**, si vous avez de l'avance — ajoutez après « elle est dans la
base » :

> « C'est le choix dont nous sommes le plus fiers. »

**Jeu.** Ne récitez **pas** les quatre chiffres de la diapositive. Ils sont en
gros à l'écran, le jury les a déjà lus, et une clôture qui lit son écran est une
clôture perdue.

Le portable fermé, ou la main lâchée de la souris. Vous regardez le jury, vous
vous taisez, et vous attendez la première question **sans meubler**. Le silence
final vous appartient — ne le remplissez pas par « voilà » ou « donc ».

**Pourquoi cette clôture fonctionne.** Elle referme la boucle ouverte à la
diapositive 2 (les deux réceptionnistes), confirmée à la 7 (l'index partiel) et
vue à l'écran pendant la démonstration (le créneau disparu). Le jury sort avec
**une** idée nette au lieu de quatre chiffres tièdes.

---

# Vos six phrases à mémoriser exactement

Tout le reste peut se dire avec vos mots. Ces six-là, non — répétez-les à voix
haute avant de monter.

| # | La phrase | Diapo |
|---|---|---|
| 1 | « Quand vous avez besoin d'un rendez-vous chez le médecin, vous appelez. » | 1 |
| 2 | « C'est cette personne-là que nous avons outillée. » | 1 |
| 3 | « Ce changement d'avis nous a coûté le modèle de données. » | 3 |
| 4 | « Nous n'avons pas configuré le problème, nous l'avons supprimé. » | 6 |
| 5 | « Nous avons arrêté d'essayer de gagner la course. Nous avons demandé à PostgreSQL de refuser. » | 7 |
| 6 | « Elle est dans la base. » | 16 |

Et celle qui n'est sur aucune diapositive, votre filet si vous perdez le fil à
n'importe quel moment :

> ## « Les plateformes en ligne outillent le patient. Nous, nous outillons la personne qui décroche. »

---

# Répétition — 12 minutes bien employées

1. **Lire les six phrases à voix haute**, trois fois. Ce sont les seules qui
   doivent sortir sans réfléchir. *(2 min)*
2. **Chronométrer les diapositives 1, 2 et 3 d'un trait** — cible 2 min 13. Si
   vous dépassez, c'est le débit, pas le texte. *(3 min)*
3. **Chronométrer la 6 et la 7** — cible 2 min 10. Vérifiez que le silence de la
   7 est bien là : sous stress, c'est la première chose qui saute. *(3 min)*
4. **Dire la 15 en 18 secondes, montre en main.** Deux fois. *(1 min)*
5. **Finir sur la 16**, en tenant le silence final trois secondes. *(1 min)*

Le reste du temps : réveiller l'application.
