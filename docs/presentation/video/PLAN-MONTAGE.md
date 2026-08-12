# Plan de montage — vidéo de démonstration MediPlan

> Analyse des **trois** rushes et conducteur de montage, en vue de la
> présentation finale du 13 août 2026. Toutes les mesures ci-dessous ont été
> relevées sur les fichiers eux-mêmes (`ffprobe`, `ebur128`, `freezedetect`,
> `silencedetect`, transcription automatique), pas estimées à l'œil.
>
> Cadre de production retenu : **HyperFrames** (composition HTML rendue en MP4),
> parce que le montage à faire est moins une affaire de coupes que d'habillage —
> et que l'habillage doit reprendre les jetons de design réels du frontend.

---

## 1. Fiche technique des rushes

| | `demo-souleymane.mp4` | `demo-larbi.mp4` | `demo-zakaria.mp4` |
|---|---|---|---|
| Durée | 1 min 49 s | 2 min 56 s | 2 min 19 s |
| Définition | **1920 × 1080** | **1280 × 720** | **1912 × 1132** |
| Rapport | 16:9 | 16:9 | **1,69:1** (fenêtre) |
| Cadence | 30 i/s | 30 i/s | 30 i/s |
| Débit vidéo | 6,0 Mb/s | 6,0 Mb/s | 9,1 Mb/s |
| Audio | AAC 150 kb/s | AAC 146 kb/s | AAC 192 kb/s |
| Capture | ré-encodé (Lavf) | OBS Studio 32.2.1 | capture de fenêtre |
| **Environnement** | **Azure** | **Azure** | ⚠️ **`localhost:4200`** |

Total de rushes : **7 min 05 s**.

---

## 2. Ce que l'analyse révèle

### 2.1 L'image est fixe la plus grande partie du temps

`freezedetect` (seuil −58 dB, durée ≥ 3 s) :

| | Image figée | Part de la durée |
|---|---|---|
| Souleymane | 80,5 s | **74 %** |
| Larbi | 154,3 s | **87 %** |
| Zakaria | 87,6 s | **63 %** |
| **Ensemble** | **322,4 s** | **76 %** |

Segments figés les plus longs :

- **Souleymane 0:00 → 0:41** — 41 s d'écran de connexion strictement immobile.
- **Larbi 0:53 → 1:27** — 34,6 s sur la page Statistiques.
- **Larbi 2:30 → 2:55** — 24,4 s sur le Flux du jour.
- **Zakaria 0:28 → 0:51** — 23 s pendant la saisie du nom du patient.
- **Zakaria 2:01 → 2:15** — 14,6 s pendant la conclusion.

**Conséquence directe sur le montage** : ce sont pour l'essentiel des
**commentaires sur des images fixes**, pas des captures d'action. La voix est le
film ; la piste vidéo n'apporte que peu de mouvement. On ne peut donc pas
« resserrer sur l'action » — il faut la **fabriquer** (rapprochements motivés,
annotations, chiffres qui se composent), et c'est exactement ce que la chaîne
HyperFrames sait produire.

Zakaria est le plus vivant des trois (63 %) : c'est le seul rush où l'on voit
réellement des états changer à l'écran.

### 2.2 Le son est propre, mais beaucoup trop bas et désaccordé

Mesures EBU R128 :

| | Loudness intégrée | Écart à la cible (−16 LUFS) | Pic vrai | Plage (LRA) |
|---|---|---|---|---|
| Souleymane | **−32,3 LUFS** | +16,3 dB | −14,6 dBFS | 10,0 LU |
| Larbi | **−39,4 LUFS** | +23,4 dB | −20,1 dBFS | 11,7 LU |
| Zakaria | **−39,5 LUFS** | +23,5 dB | −8,0 dBFS | 9,3 LU |

Deux problèmes distincts :

1. **Les trois sont inaudibles en salle** telles quelles (16 à 23 dB sous la
   norme de diffusion).
2. **Souleymane est 7,2 LU plus fort que les deux autres** : monter bout à bout
   sans traitement donne un film où l'on règle le volume au milieu.

La bonne nouvelle : **le bruit de fond est très bas** — RMS mesuré en silence de
−69,9 dB (Souleymane) et −87,5 dB (Larbi). La remontée de +16 / +23 dB est donc
sans danger : pas de souffle à craindre, pas de débruitage agressif à appliquer.

### 2.3 Artefacts de capture, source par source

**Souleymane** — propre. Navigateur plein écran, aucune barre des tâches, aucune
notification. C'est la référence de qualité du lot.

**Larbi** :

- **La barre des tâches Windows est visible en permanence** (à partir de
  y ≈ 679) : widget météo « Vigilance orage », icônes, horloge affichant
  **23 h 57**.
- Badge rouge **« Nouvelle version de Chrome disponible »** et bouton
  **« Demander à Gemini »**.
- La zone applicative ne fait que **1280 × 606** sur 1280 × 720 : **16 % du cadre
  perdu** en habillage système.

**Zakaria** — le rush le plus riche, mais le plus chargé en scories :

- ⚠️ **Tourné sur `localhost:4200`**, pas sur l'application déployée. L'adresse
  apparaît dans la barre du navigateur *et* dans l'infobulle de survol en bas à
  gauche de la page (visible notamment autour de 1:04 et 2:00).
- ⚠️ **L'autocomplétion de Chrome expose son identité réelle** vers **0:27 →
  0:32** : une liste déroulante affiche « Lahouiri Zakaria », « ZAKARIA
  LAHOUIRI », « L. Zakaria », « Gérer les adresses… ». Ce sont des données
  personnelles à l'écran.
- ⚠️ Un onglet **« Accueil – Portail Étudiant – La Cité »** est ouvert à côté de
  MediPlan.
- Le patient créé s'appelle **« sarah ghiii »** — et ce nom réapparaît dans le
  message de confirmation, puis dans la liste des rendez-vous.
- **Jeu de données différent** des deux autres : son tableau de bord affiche
  6 puis 7 RDV du jour et 33 % puis 39 % de remplissage, là où Souleymane et
  Larbi affichent 10 RDV et 53 %.
- Bouton **« Demander à Gemini »** également présent.

### 2.4 Redites entre les rushes

| Écran | Souleymane | Larbi | Zakaria |
|---|---|---|---|
| Écran de connexion | 0:00 → 0:41 | 0:00 → 0:29 | — |
| Tableau de bord administrateur | 0:48 → 0:56 | 0:30 → 0:53 | 0:00 → 0:10 et 2:01 → 2:19 |

Le tableau de bord administrateur est filmé **trois fois**. Environ **1 min 10 de
matière fait doublon** sur l'ensemble.

### 2.5 Ce que disent réellement les voix

Transcription automatique (Whisper `medium`, français).

#### Souleymane — l'ossature narrative du film

| Repère | Contenu |
|---|---|
| 0:01 → 0:18 | Le problème : agenda partagé, prise au téléphone, **double réservation** |
| 0:18 → 0:25 | « je vous montre la journée type d'une clinique » |
| 0:25 → 0:37 | **Annonce de 4 chapitres** : disponibilités, prise de rendez-vous, flux, annulation |
| 0:37 → 0:48 | Connexion, « l'application identifie qui je suis et le rôle » |
| 0:48 → 0:57 | Le tableau de bord |
| 0:57 → 1:03 | Passage aux disponibilités |
| 1:03 → 1:24 | **Hésitation** : « du 27, je vais mettre 9 h à 12 h, 9 h à 18 h, 9 h à 18 h » — 21 s pour saisir une plage |
| 1:24 → 1:33 | **Le message clé** : « je renseigne une seule fois cette disponibilité et l'ensemble des créneaux réservables seront automatiquement générés » |
| 1:33 → 1:44 | Confirmation |
| 1:44 → 1:49 | Silence |

Son intro est la meilleure minute de narration du lot, et — point décisif —
**les quatre chapitres qu'il annonce sont exactement ceux que Zakaria et Larbi
couvrent**. Le sommaire du film existe déjà, enregistré.

#### Zakaria — la démonstration opérationnelle

| Repère | Contenu |
|---|---|
| 0:00 → 0:11 | « je joue le rôle de la réception, le cas typique c'est un patient qui appelle » |
| 0:11 → 0:29 | Médecin → disponibilité → créneau (vendredi 14 août, 11 h 00 – 11 h 30) |
| 0:29 → 0:45 | Saisie du patient — ⚠️ 23 s d'image figée, autocomplétion Chrome à l'écran |
| 0:45 → 0:53 | E-mail et motif optionnels, clic sur **Réserver** |
| 0:53 → 1:01 | Confirmation nominative + la liste des rendez-vous |
| 1:01 → 1:26 | **★ Le cycle de vie joué** : marquer arrivé → démarrer la consultation → terminer, avec le bandeau « Statut du rendez-vous mis à jour » |
| 1:26 → 1:48 | Filtres par statut dans l'historique, motifs d'annulation visibles |
| 1:48 → 2:19 | **Conclusion structurée** : « créer un rendez-vous pour un patient au téléphone, suivre son évolution dans le flux du jour, et gérer une annulation proprement avec un motif » |

C'est l'apport décisif : **il joue réellement le cycle de vie**, ce qui manquait
à tout le monde.

⚠️ Mais **il ne joue jamais l'annulation**. Il ouvre le menu qui la contient, il
montre des rendez-vous *déjà* annulés avec leurs motifs — l'acte lui-même, et
surtout le **dialogue de motif obligatoire**, n'apparaissent pas. Sa conclusion
affirme donc quelque chose que le film ne montre pas.

⚠️ Élocution très hésitante par endroits : « on clique sur par exemple un
port », « on fait juste comme ça, c'est un exemple », « on peut faire comme des
mots ». Et pas d'entrée en matière : le rush démarre à froid.

#### Larbi — le pilotage

| Repère | Contenu |
|---|---|
| 0:01 → 0:17 | Intro + « je me connecte en tant qu'administrateur » |
| 0:17 → 0:38 | Une seule phrase (≈ 6 s de parole) étalée sur **21 s** |
| 0:38 → 0:53 | Les trois tuiles du tableau de bord |
| 0:53 → 1:25 | **La page Statistiques** — volume, no-show, occupation, détail par médecin |
| 1:25 → 1:35 | Reconnexion en médecin, puis **~11 s de flottement** |
| 1:35 → 2:08 | Tableau de bord médecin (8 RDV / 3 terminées / 3 restants) |
| 2:08 → 2:28 | Page Disponibilités côté médecin |
| 2:28 → 2:54 | Flux du jour : les statuts sont **décrits**, jamais **joués** |

⚠️ « Le médecin peut faire avancer le statut du patient » est dit sur une image
**figée pendant 24 secondes**. Ce passage est désormais inutile : **Zakaria le
montre pour de vrai**. On garde la voix de Larbi si on veut, mais l'image doit
venir de Zakaria.

⚠️ Deux trous de silence : **0:16 → 0:30** (14 s) et **1:24 → 1:49** (25 s,
presque intégralement muet pendant la reconnexion).

### 2.6 Couverture par rapport au scénario de référence

Comparé à [`SCENARIO-DEMO-Finale.md`](../SCENARIO-DEMO-Finale.md) :

| Étape du scénario | Couverte ? | Par |
|---|---|---|
| 0 · Connexion | ✅ | Souleymane |
| 1 · Tableau de bord | ✅ (trois fois) | tous |
| 2 · Publier une plage | ✅ | Souleymane |
| 3 · Réserver un rendez-vous | ✅ | **Zakaria** |
| 3 bis · Le patient réserve seul | ❌ | — |
| 4 · Le flux du jour, cycle de vie joué | ✅ | **Zakaria** |
| **5 · Annuler + le créneau qui revient** | ⚠️ **affirmé, jamais montré** | Zakaria (partiel) |
| 6 · Export CSV | ❌ (le bouton est à l'image, jamais cliqué) | — |
| 7 · Statistiques | ✅ | Larbi |
| 8 · Contrôle d'accès par rôle | ⚠️ partiel | Larbi |
| 9 · Mode sombre | ❌ | — |

**Bilan : 6 étapes sur 11 pleinement démontrées, 2 partielles.** L'arrivée du
rush de Zakaria fait passer la couverture de 3/11 à 6/11 et comble les deux plus
gros trous — la réservation et le cycle de vie.

**Il ne manque plus qu'une seule séquence vraiment importante : l'annulation
jouée**, que le scénario qualifie de « passage le plus fort de la
démonstration ».

---

## 3. La décision qui commande tout le reste

> **✅ Tranché le 12 août 2026 : on monte avec ce qui existe.** Zakaria n'est pas
> en mesure de refaire une prise. Les options B et C ci-dessous sont donc
> écartées ; le film est monté à partir des trois rushes seuls.
>
> **Ce que cela change — et la bonne surprise.** Le chapitre 04 n'est pas
> abandonné pour autant : il est reconstruit à partir de trois pièces réelles
> déjà présentes dans le dépôt.
>
> | Ce qu'il montre | D'où ça vient |
> |---|---|
> | Où l'annulation se déclenche | rush de Zakaria, le menu ⋯ de la ligne |
> | **La règle : motif obligatoire, confirmation désactivée** | `audit-12-cancel-confirm.png`, capture réelle de l'application |
> | Les annulations et leurs motifs, en base | rush de Zakaria, la liste filtrée |
>
> Les deux promesses du commentaire sont donc tenues sans retoucher une seule
> voix : Souleymane annonce « l'annulation des rendez-vous », Zakaria conclut sur
> « gérer une annulation proprement avec un motif » — le film montre l'un et
> l'autre.
>
> **Ce que le film ne montre pas, et ne prétend pas montrer** : le créneau qui
> **réapparaît** dans la liste après annulation. Aucune capture ne l'atteste.
> Aucun texte à l'écran ne l'affirme. C'est le seul point du scénario de
> référence qui reste à la charge de l'oral.
>
> **Deux scories subsistent, assumées** : le rush de Zakaria vient de
> `localhost` (invisible, le bandeau est recadré) et son jeu de données diffère
> (6-7 RDV / 33-39 % contre 10 / 53 %) — visible seulement pour qui lit les
> petits chiffres de l'interface. Et la capture d'audit porte le patient
> « Test Audit ».

Trois chemins avaient été envisagés. Ils ne demandaient pas le même travail et ne
produisaient pas le même film.

### Option A — Monter uniquement l'existant · film de ≈ 3 min 15

Aucun nouveau tournage. On assainit, on resserre, on habille, et on **masque**
les scories du rush de Zakaria (autocomplétion Chrome, infobulle `localhost`).

Ce qu'on y gagne : faisable **aujourd'hui**, sans dépendre de la disponibilité
de qui que ce soit ni de l'état de l'application en ligne.

Ce qu'on y perd :

- **L'annulation n'est jamais montrée**, alors que Souleymane l'annonce dans son
  sommaire **et** que Zakaria l'affirme dans sa conclusion. Il faudrait retoucher
  les deux — ou assumer que le film promet deux fois ce qu'il ne livre pas.
- On masque `localhost` plutôt que de le corriger.

### Option B — A + un rush de 30 s pour l'annulation seule · film de ≈ 3 min 30

On tourne **uniquement** l'annulation, sur l'application déployée : bouton de
confirmation désactivé tant que le motif est vide, saisie du motif, message
« le créneau est de nouveau disponible », puis retour dans la liste des créneaux
pour montrer celui qui **réapparaît**. Environ 5 minutes de captation.

Cela suffit à rendre vraies l'annonce de Souleymane **et** la conclusion de
Zakaria. Reste l'incohérence `localhost` sur le segment de Zakaria, masquée.

### Option C — B + retourner le segment de Zakaria sur Azure · film de ≈ 3 min 30 ✅ recommandé

Zakaria refilme sa partie (réservation → cycle de vie → annulation) **sur
l'application déployée**, en une prise d'environ 2 minutes. Son commentaire est
déjà rodé : c'est une seconde prise, pas une nouvelle écriture.

Ce que cela règle d'un seul geste :

- `localhost:4200` disparaît — **tout le film tourne sur la même application en
  ligne** ;
- l'autocomplétion Chrome et l'onglet « Portail Étudiant » disparaissent ;
- « sarah ghiii » devient un nom de patient présentable ;
- le jeu de données redevient cohérent avec les rushes de Souleymane et Larbi
  (10 RDV, 53 %) ;
- l'annulation est jouée, donc **le film tient enfin toutes ses promesses** ;
- l'élocution peut être resserrée au passage.

Conditions de tournage, pour les options B et C : navigateur **plein écran en
1920 × 1080**, barre des tâches masquée, **profil Chrome neuf** (ni
autocomplétion, ni badge de mise à jour, ni bouton Gemini), un seul onglet
ouvert, notifications système coupées.

**Pourquoi je recommande C** : le coût marginal est faible (≈ 2 min de captation
de plus que l'option B) et le gain est structurel. C'est la différence entre un
film qu'il faut expliquer — « non non, c'est bien déployé, c'est juste que
cette partie-là a été filmée en local » — et un film qui n'a besoin d'aucune
excuse. Devant un jury, cette différence compte.

Le reste de ce document décrit l'**option C**. Les repères marqués 🔴 sont ceux
qui changent selon l'option retenue.

---

## 4. Format de sortie et traitement des sources

### 4.1 Master

| | |
|---|---|
| Définition | 1920 × 1080 |
| Cadence | 30 i/s |
| Codec | H.264 High, ~10 Mb/s, `yuv420p`, `bt709` |
| Audio | AAC-LC 48 kHz stéréo, 192 kb/s |
| Loudness cible | **−16 LUFS**, pic vrai **−1,5 dBTP** |
| Sous-titres | **incrustés en français** (voir § 6.4) |

### 4.2 Recadrage : on retire tout l'habillage navigateur

Valeurs relevées au pixel :

```bash
# Souleymane — on retire le bandeau Chrome, on garde 1920 × 970
crop=1920:970:0:110

# Larbi — on retire le bandeau Chrome ET la barre des tâches, on garde 1280 × 606
#   contenu applicatif : à partir de y ≈ 69
#   barre des tâches   : à partir de y ≈ 679
crop=1280:606:0:70

# 🔴 Zakaria (si le rush actuel est conservé — options A et B)
#   recadrage du bandeau navigateur, à affiner au moment du montage
crop=1912:1010:0:122
#   + masquage de l'infobulle « localhost:4200/… » : ~340 × 26 px, coin inférieur gauche
```

L'URL Azure, qui a une vraie valeur de preuve, ne disparaît pas : elle revient
**une fois**, en incrustation typographique nette, sur le carton d'ouverture.
Bien plus lisible qu'une barre d'adresse à 720p.

### 4.3 Le point délicat : trois définitions dans le même film

C'est le vrai piège technique de ce montage. Les trois sources n'ont ni la même
définition ni le même rapport d'image. Étirer Larbi au plein cadre demanderait un
agrandissement de 1,58 × — sur du texte d'interface, cela se voit immédiatement
et cela signe l'amateurisme.

**La solution retenue : la scène.** Aucune capture n'occupe le cadre entier.
Chacune est posée dans un cadre de fenêtre arrondi, sur un fond aux couleurs du
produit :

| Source | Zone utile | Largeur à l'écran | Échelle |
|---|---|---|---|
| Souleymane | 1920 × 970 | 1280 px | **0,67 ×** (réduction — gain de netteté) |
| Zakaria | 1912 × 1010 | 1280 px | **0,67 ×** (réduction) |
| Larbi | 1280 × 606 | 1280 px | **1,00 ×** (natif — **aucun agrandissement**) |

Résultat : les trois captures ont **la même taille optique**, Larbi n'est
**jamais agrandi**, les rapports d'image différents sont absorbés par la hauteur
du cadre, et les 320 px libres de chaque côté deviennent l'espace où vivent les
titres de chapitre et les annotations. Le défaut devient la mise en scène.

Corollaire : sur Souleymane et Zakaria, on dispose de pixels en réserve — on peut
se rapprocher jusqu'à 1,5 × en restant en résolution native. Sur Larbi, non : ses
chiffres seront redonnés en **typographie vectorielle** plutôt qu'agrandis
(§ 6.2).

### 4.4 Traitement audio

Chaîne, dans cet ordre, appliquée séparément à chaque source avant montage :

```bash
ffmpeg -i <source> \
  -af "highpass=f=80,                       # coupe les rumbles de bureau
       agate=threshold=0.003:ratio=2:attack=20:release=250,
       acompressor=threshold=-20dB:ratio=3:attack=8:release=180,
       loudnorm=I=-16:TP=-1.5:LRA=11:linear=true:
                measured_I=…:measured_TP=…:measured_LRA=…:measured_thresh=…" \
  -ar 48000 -ac 2 <sortie>
```

`loudnorm` en **deux passes** (relever d'abord les `measured_*` avec
`-af loudnorm=print_format=json`), sinon la correction dérive au fil du fichier.

Après traitement, les trois voix atterrissent à −16 LUFS : **l'écart de 7,2 LU
disparaît**, et on passe de l'une à l'autre sans que la salle le sente.

Le débruitage lourd (`afftdn`, `arnndn`) est **inutile ici** : les planchers de
bruit mesurés sont trop bas pour poser problème. Une porte douce suffit.

Musique de fond : un lit discret à **−28 LUFS**, avec abaissement automatique
sous la voix. Elle sert surtout à masquer les raccords entre les trois voix — pas
à faire du spectacle.

---

## 5. Conducteur

Durée visée : **3 min 30**. Les repères `[S …]`, `[Z …]`, `[L …]` renvoient aux
minutages **des rushes d'origine**.

> **Réalisé** — le film est monté et fait **4 min 06** (245,6 s), en 33 plans et
> 8 chapitres. L'écart avec la cible vient de la durée réelle de la
> parole : les points de coupe ont été posés sur les pauses effectives, relevées
> au mot près, plutôt que sur les durées estimées ci-dessous. Le montage
> exécutable — et donc la vérité des temps — est
> [`video/tools/cuts.json`](tools/cuts.json) ; le mode d'emploi est dans
> [`video/README.md`](README.md).
>
> Leviers si la durée doit descendre : les repères 13 puis 12 (Larbi), puis
> resserrer le sommaire du repère 2.

| # | Temps film | Durée | Source | Contenu et traitement |
|---|---|---|---|---|
| 0 | 0:00 → 0:10 | 10 s | graphique | **Générique.** Logo MediPlan, titre, l'URL Azure, la mention Collège la Cité / printemps 2026. Démarre sur les premiers mots de Souleymane. |
| 1 | 0:10 → 0:25 | 15 s | `[S 0:01→0:18]` | **Le problème.** Aucune capture d'écran : motion graphics sur l'agenda partagé et la **double réservation**. La meilleure minute de narration du lot mérite une image construite. |
| 2 | 0:25 → 0:42 | 17 s | `[S 0:18→0:37]` | **Le sommaire.** Les quatre chapitres s'inscrivent à mesure qu'il les annonce. |
| 3 | 0:42 → 0:59 | 17 s | `[S 0:37→0:57]` | **Se connecter, voir sa journée.** Rapprochement sur le badge « Administrateur de clinique », puis sur les trois tuiles (10 / 2 / 53 %). |
| 4 | 0:59 → 1:08 | 9 s | `[S 0:57→1:24]` | **Saisir la plage.** ⚠️ Les 21 s d'hésitation ramenées à 9 s : on garde l'ouverture du dialogue, on accélère ×3 la saisie, on **retire « 9 h à 12 h, 9 h à 18 h, 9 h à 18 h »**. |
| 5 | 1:08 → 1:26 | 18 s | `[S 1:24→1:44]` | **★ Pic n° 1 — la génération automatique.** À ne pas presser. Rapprochement sur « ≈ 18 créneaux de 30 min réservables », puis les créneaux se dessinent un à un en surimpression. Puis la confirmation. |
| 6 | 1:26 → 1:34 | 8 s | `[Z 0:00→0:11]` | **« Le téléphone sonne. »** Passage de relais à la réception. |
| 7 | 1:34 → 1:52 | 18 s | `[Z 0:11→0:53]` | **Réserver.** Médecin → créneau → patient. ⚠️ La saisie du nom (23 s figées) est accélérée ×4 ; 🔴 en options A/B, **la fenêtre 0:27 → 0:32 doit être masquée** (autocomplétion Chrome). Annotation sur le patient léger : « créé au comptoir, sans compte ». |
| 8 | 1:52 → 2:00 | 8 s | `[Z 0:53→1:01]` | **Confirmation nominative** et retour sur la liste. |
| 9 | 2:00 → 2:25 | 25 s | `[Z 1:01→1:26]` | **★ Pic n° 2 — le cycle de vie joué.** Marquer arrivé → démarrer → terminer. Les pastilles de statut reprennent les couleurs réelles du thème (§ 6.2) et s'animent au rythme des clics. |
| 10 | 2:25 → 2:36 | 11 s | `[Z 1:26→1:48]` | **Les statuts dans l'historique.** Filtres, et les motifs d'annulation déjà présents en base. |
| 11 | 2:41 → 2:51 | 9,6 s | `[Z 1:15→1:18]` + `audit-12` | **★ Pic n° 3 — l'annulation.** Deux temps : le menu ⋯ de la ligne (filmé), puis le **dialogue capturé sur l'application** — repère rouge sur le champ de motif vide, second repère sur « Confirmer l'annulation » désactivé. Seul chapitre qui sort de la fenêtre : il examine une capture, il ne rejoue pas une session. **Ne prétend pas** montrer le créneau qui repart à la vente. |
| 12 | 2:58 → 3:08 | 10 s | `[L 0:53→1:25]` | **Piloter.** Page Statistiques. Les trois chiffres (186 RDV · 7,5 % de no-show · 66 % d'occupation) **redonnés en typographie vectorielle** avec défilement de compteur. |
| 13 | 3:08 → 3:18 | 10 s | `[L 1:35→2:08]` | **Le même code, un autre rôle.** Menu admin (6 entrées) et menu médecin (3 entrées) **côte à côte** : la comparaison démontre mieux que la description. |
| 14 | 3:18 → 3:32 | 14 s | `[Z 1:48→2:19]` | **Conclusion.** Le récapitulatif de Zakaria, resserré, enchaîné sur le carton final : URL, dépôt GitHub, les trois noms. |

### Ce qui est coupé, et pourquoi

| Source | Coupe | Motif |
|---|---|---|
| `[S 0:00→0:41]` | image | 41 s d'écran fixe — la voix est gardée, l'image est remplacée (repères 0 à 2) |
| `[S 1:44→1:49]` | tout | silence de fin |
| `[Z 0:29→0:45]` | ~16 s | saisie figée + autocomplétion Chrome — accélérée et masquée |
| `[Z 2:01→2:15]` | ~10 s | image figée pendant la conclusion — remplacée par le carton final |
| `[L 0:01→0:17]` | tout | redite de l'intro et de la connexion, déjà couvertes par Souleymane |
| `[L 0:17→0:30]` | 14 s | silence de chargement |
| `[L 0:30→0:53]` | image | tableau de bord admin déjà montré au repère 3 |
| `[L 1:24→1:49]` | 25 s | flottement de reconnexion, quasi muet — remplacé par une transition graphique |
| `[L 2:08→2:28]` | tout | disponibilités côté médecin — redondant avec le repère 5, qui le fait mieux |
| `[L 2:28→2:54]` | tout | le flux du jour **décrit sur image figée** — Zakaria le **joue** au repère 9 |

**Total retiré : ≈ 3 min 40 des 7 min 05 de rushes.**

---

## 6. Langage visuel

### 6.1 Palette — celle de l'application, pas une palette inventée

Reprise directe de `apps/frontend/src/styles/_theme.scss`, ce qui garantit que le
film et le produit se ressemblent :

| Rôle | Jeton | Valeur |
|---|---|---|
| Primaire | `--mp-blue-700` | `#1e5fa8` |
| Primaire fort | `--mp-blue-900` | `#17518f` |
| Accent décoratif | `--mp-teal-600` | `#16a6a6` |
| Accent porteur de sens | `--mp-teal-700` | `#0f766e` |
| Encre | `--mp-ink-900` | `#1a2233` |
| Fond de scène | `--mp-bg` | `#f6f8fb` |

Typographie : **IBM Plex Sans** (corps et titrage) et **IBM Plex Mono** (chiffres,
heures, libellés techniques) — les polices réelles de l'interface, d'après
`styles/fonts.css`. Les `.woff2` sont embarqués dans le projet vidéo : aucun
appel réseau, donc un rendu identique en local et en nuage.

### 6.2 Les statuts du flux — le cadeau du thème

Le thème définit déjà un couple fond/texte par statut. C'est exactement
l'animation des repères 9 et 10 — et le rush de Zakaria montre ces transitions
pour de vrai :

| Statut | Fond | Texte |
|---|---|---|
| Réservé | `#eef2f7` | `#4a5568` |
| Arrivé | `#e8f0fb` | `#1e5fa8` |
| En consultation | `#def3f3` | `#0f766e` |
| Terminé | `#e6f4ec` | `#15803d` |
| Annulé | `#fbe9e7` | `#c62828` |

La pastille change de couleur en même temps que le clic à l'écran : la règle
métier devient visible.

### 6.3 Mouvement

Le film étant construit à 76 % sur des images fixes, **tout le mouvement est de
la mise en scène**. Trois outils, pas davantage :

1. **Le rapprochement motivé** — on se rapproche de l'élément dont on parle,
   au moment où on en parle. Jamais de zoom décoratif.
2. **L'annotation vectorielle** — un cadre et une étiquette sur la zone
   commentée. Sur les passages de Larbi, c'est ce qui remplace l'agrandissement
   impossible : les chiffres sont **réécrits** en net, pas grossis en flou.
3. **Les enchaînements** — un mouvement de caméra continu d'un chapitre au
   suivant, jamais de fondu au noir entre deux plans.

Règle ferme : **aucune animation d'attente**. Rien ne doit « respirer » à vide à
l'écran ; chaque mouvement sert une phrase.

### 6.4 Sous-titres

**Incrustés, en français, sur toute la durée.** Trois raisons, dans cet ordre :

1. La salle et le vidéoprojecteur : le son sera au mieux moyen.
2. L'accessibilité, qui compte dans la grille d'évaluation.
3. **La correction de l'élocution.** *Décision prise* : les voix ne sont pas
   réenregistrées ; le sous-titre porte la formulation correcte pendant que la
   voix reste inchangée. Cela concerne les tournures fautives relevées chez Larbi
   (« le tableau de bord du clinique », « la partie de statistique ») et les
   passages hésitants de Zakaria (« on clique sur par exemple un port », « on
   peut faire comme des mots »).

Le sous-titre ne réécrit pas le propos, il le met au propre : même contenu,
grammaire corrigée, hésitations et faux départs retirés.

---

## 7. Chaîne de production

```
docs/presentation/video/
├── BRIEF.md              # cadrage du film
├── media/
│   ├── soul-clean.mp4    # recadré + son normalisé
│   ├── larbi-clean.mp4   # recadré + son normalisé
│   ├── zak-clean.mp4     # recadré + masqué + son normalisé
│   └── rush-annulation.mp4   # 🔴 options B et C
├── index.html            # la composition
└── out/mediplan-demo.mp4
```

1. **Pré-traitement ffmpeg** — recadrage (§ 4.2), masquages, normalisation
   (§ 4.4). Les rushes d'origine ne sont **jamais** modifiés.
2. 🔴 **Captation complémentaire** — selon l'option retenue (§ 3).
3. **Composition HyperFrames** — `hyperframes init`, puis la scène, les
   chapitres, les annotations et les enchaînements.
4. **Sous-titrage** — transcription calée au mot, texte relu et corrigé à la
   main.
5. **Contrôle** — `hyperframes check` puis prévisualisation, en vérifiant que
   rien ne dépasse à l'image et que la loudness finale tient la cible.
6. **Rendu** — MP4 1080p30, puis mesure de contrôle `ebur128` sur le master.

### Points à vérifier avant de rendre

- [ ] Aucune barre des tâches, aucune notification système à l'image
- [ ] **Aucune trace de `localhost`**, ni en barre d'adresse ni en infobulle
- [ ] **Aucune donnée personnelle** à l'écran (autocomplétion Chrome, onglets
      ouverts, noms de fichiers)
- [ ] Loudness du master entre −16,5 et −15,5 LUFS, pic vrai ≤ −1,5 dBTP
- [ ] Aucun raccord audible entre les trois voix
- [ ] Chaque affirmation du commentaire est **montrée** à l'écran au moment où
      elle est prononcée — en particulier l'annulation
- [ ] Les sous-titres sont exacts et lisibles à distance de projection
- [ ] Le film tient sous 3 min 45

---

## 8. Ce qui reste à trancher

1. **Option A, B ou C** (§ 3) — seule décision bloquante.
2. **Durée cible** : 3 min 30 est un bon calibre pour une vidéo de repli ; si la
   consigne impose plus court, les repères 13 puis 12 se compriment en premier.
3. **Musique de fond** : oui ou non. Elle aide les raccords, mais un jury
   académique n'en attend pas.
4. **Une seconde version de 40 s** pour ouvrir la présentation orale ? Elle se
   dérive du même projet à peu de frais : générique + les trois pics (repères 5,
   9 et 11) + carton final.

### Détails relevés en passant

- Dans le rush de Souleymane, la plage créée est datée du **27 août 2026** —
  postérieure à la présentation. Sans conséquence, mais si un rush est retourné,
  autant employer une date de la semaine de la présentation.
- Le patient « **sarah ghiii** » de Zakaria apparaît dans la confirmation puis
  dans la liste. En option C, employer un nom présentable — le scénario de
  référence propose *Camille Nadeau*.
- Le tableau de bord de Zakaria affiche **6 puis 7 RDV du jour et 33 puis 39 %**,
  contre **10 RDV et 53 %** chez les deux autres. En options A et B, éviter de
  montrer son tableau de bord au montage (c'est déjà le cas dans le conducteur).
