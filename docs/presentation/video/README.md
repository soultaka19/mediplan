# Film de démonstration MediPlan — projet de montage

Composition **HyperFrames** (vidéo rendue depuis du HTML). Le conducteur et
l'analyse des rushes sont dans [`PLAN-MONTAGE.md`](PLAN-MONTAGE.md).

## Comment c'est construit

Le film est monté **autour de la voix**, pas autour de l'image — 76 % des rushes
sont des captures figées, la parole est donc la seule matière qui porte le
rythme. La chaîne suit cet ordre :

```
tools/cuts.json          la liste de coupes — LA source de vérité du montage
        │
        ├─ node tools/build-spine.mjs
        │     → media/voix-spine.m4a    la bande son continue (4 min 08)
        │     → tools/timeline.json     où tombe chaque plan dans le film
        │     → tools/captions.json     les sous-titres, recalés et corrigés
        │
        └─ node tools/build-composition.mjs
              → index.html              l'orchestrateur : scène, chapitres, sous-titres
              → tools/chapters.json     les temps locaux de chaque chapitre
```

`index.html` est **généré** — ne pas l'éditer à la main, la prochaine
régénération écraserait la modification. Les huit chapitres de
`compositions/` sont écrits à la main : c'est là que vivent les annotations, les
pastilles de statut et les animations.

## Les médias

| Fichier | Origine | Traitement |
|---|---|---|
| `media/soul-clean.mp4` | `demo-souleymane.mp4` | `crop=1920:970:0:110` — bandeau navigateur retiré |
| `media/larbi-clean.mp4` | `demo-larbi.mp4` | `crop=1280:606:0:70` — bandeau **et barre des tâches** retirés |
| `media/zak-clean.mp4` | `demo-zakaria.mp4` | `crop=1912:1000:0:102` — bandeau et infobulle `localhost` retirés |
| `assets/annulation-dialogue.png` | `audit-12-cancel-confirm.png` | `crop=458:312:500:296` — le dialogue seul |
| `media/voix-spine.m4a` | les trois | assemblée par `build-spine.mjs` |

Les trois voix sont calées à **−16,1 / −16,0 / −16,1 LUFS** (l'écart d'origine
était de 7,2 LU) avec un plafond de crête à −1,5 dBTP. **Ne pas y retoucher** :
les valeurs de `loudnorm` sont mesurées, pas devinées.

## Deux points de vigilance, à ne pas défaire

### L'image peut tenir un autre moment que le son

Le champ **`videoIn`** de `cuts.json` décale l'image sans toucher au son. Il est
utilisé sur deux plans (`z-res3`, `z-res4`) parce que le rush de Zakaria expose,
entre **27,5 s et 33,2 s**, la liste d'autocomplétion de Chrome contenant son
**nom réel**. Le commentaire est conservé, l'image tient un moment propre.

> Si vous retouchez ces deux plans, revérifiez au préalable que la fenêtre
> d'exposition reste écartée. C'est une donnée personnelle à l'écran, pas un
> détail esthétique.

### Le chapitre 04 est monté à partir d'une capture

Aucun rush ne filme l'annulation jouée. Le chapitre est donc construit de trois
pièces réelles : le menu ⋯ (rush de Zakaria), le **dialogue avec motif
obligatoire et confirmation désactivée** (`audit-12-cancel-confirm.png`), et la
liste des annulations avec leurs motifs (rush de Zakaria).

**Ce que le film ne montre pas** : le créneau qui réapparaît après annulation.
Rien ne l'atteste dans les assets, donc aucun texte à l'écran ne l'affirme. Ne
pas ajouter cette affirmation sans la capture qui va avec.

## Si une nouvelle prise devient possible

La chaîne est scriptée : il suffit de reprendre à l'étape 1.

1. **Assainir et normaliser** — mesurer d'abord, appliquer ensuite :

   ```bash
   ffmpeg -i <rush>.mp4 -af "highpass=f=80,agate=threshold=0.003:ratio=2:attack=20:release=250,acompressor=threshold=-20dB:ratio=3:attack=8:release=180,loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" -f null -
   # puis, avec les measured_* relevés et le recadrage vérifié au pixel :
   ffmpeg -i <rush>.mp4 -vf "crop=…" -af "…,loudnorm=…:measured_I=…" \
     -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k media/<nom>.mp4
   ```

   Puis recaler à −16,0 LUFS exactement et limiter les crêtes
   (`volume=<delta>dB,alimiter=limit=0.841`), comme les trois autres.

2. **Transcrire au mot** — c'est ce qui permet de couper aux pauses réelles :

   ```bash
   python tools/transcrire.py media/<nom>.mp4 tools/<nom>-words.json
   ```

3. **Écrire les coupes** dans `tools/cuts.json`, puis régénérer :

   ```bash
   node tools/build-spine.mjs && node tools/build-composition.mjs
   ```

4. **Reporter les temps locaux** affichés par `build-composition.mjs` dans les
   `data-start` / `data-duration` / `data-media-start` des sous-compositions
   touchées.

5. **Contrôler puis rendre** :

   ```bash
   npx hyperframes check
   npx hyperframes render -o out/mediplan-demo.mp4 -q high --video-bitrate 10M
   ffmpeg -i out/mediplan-demo.mp4 -af ebur128=peak=true -f null -   # doit tenir -16 LUFS
   ```

## Commandes courantes

```bash
npm run dev      # prévisualisation dans le navigateur (serveur long — lancer en arrière-plan)
npm run check    # lint + exécution + mise en page + mouvement + contraste
npm run render   # rendu MP4
npx hyperframes snapshot --at 15,75,150,205   # images fixes de contrôle
```

## Ce qu'il faut savoir avant de modifier

- **La fenêtre ne bouge jamais** : `left:320 top:168 1280×660`, `object-fit: contain`.
  C'est ce qui met les trois définitions (1080p, 720p, 1912×1000) à la même
  taille optique et évite d'agrandir la capture de Larbi. Ne pas la déplacer
  chapitre par chapitre.
- **Les sous-titres sont corrigés au montage**, jamais réenregistrés : la table
  `FIXES` en tête de `build-spine.mjs` répare la grammaire et les coquilles de
  transcription. Y ajouter une entrée plutôt que retoucher `captions.json`, qui
  est régénéré.
- **Aucune animation d'attente.** Chaque mouvement doit servir une phrase
  précise du commentaire — les temps d'apparition sont calés sur les mots.
- L'avertissement `timeline_track_too_dense` sur la piste 5 est **attendu** :
  c'est la piste des 52 sous-titres.
