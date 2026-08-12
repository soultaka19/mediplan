// Génère index.html — l'orchestrateur — à partir de la carte des temps.
// Les chapitres sont des sous-compositions écrites à la main ; ce script ne
// produit que le squelette : scène, créneaux de chapitre, sous-titres, bande son.
//
//   node tools/build-composition.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

const timeline = JSON.parse(readFileSync(resolve(HERE, "timeline.json"), "utf8"));
const captions = JSON.parse(readFileSync(resolve(HERE, "captions.json"), "utf8"));

// --- chapitres : regroupement des plans, temps locaux ------------------------
const chapters = [];
for (const t of timeline) {
  let ch = chapters.at(-1);
  if (!ch || ch.id !== t.scene) {
    ch = { id: t.scene, start: t.start, dur: 0, plans: [] };
    chapters.push(ch);
  }
  ch.plans.push({ ...t, local: +(t.start - ch.start).toFixed(3) });
  ch.dur = +(t.start + t.slot - ch.start).toFixed(3);
}

const TOTAL = +(chapters.at(-1).start + chapters.at(-1).dur).toFixed(2);

writeFileSync(resolve(HERE, "chapters.json"), JSON.stringify(chapters, null, 1));

// --- sous-titres : on empêche tout chevauchement sur la piste ---------------
const cues = captions
  .map((c) => ({ ...c }))
  .sort((a, b) => a.start - b.start);
for (let i = 0; i < cues.length - 1; i++) {
  if (cues[i].end > cues[i + 1].start - 0.04) cues[i].end = +(cues[i + 1].start - 0.04).toFixed(3);
}
const cueHtml = cues
  .filter((c) => c.end - c.start > 0.12)
  .map(
    (c, i) =>
      `      <div class="clip cap" id="cap-${i}" data-start="${c.start}" data-duration="${(c.end - c.start).toFixed(3)}" data-track-index="5"><span>${esc(c.text)}</span></div>`,
  )
  .join("\n");

const chapterHtml = chapters
  .map(
    (c) =>
      `      <div id="el-${c.id}" data-composition-id="${c.id}" data-composition-src="compositions/${c.id}.html" data-start="${c.start}" data-duration="${c.dur}" data-track-index="1"></div>`,
  )
  .join("\n");

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"><\/script>
    <style>
      /* Polices réelles du produit, embarquées — aucun appel réseau. */
      @font-face { font-family: "Plex"; src: url("assets/fonts/ibm-plex-sans-latin-400-normal.woff2") format("woff2"); font-weight: 400; font-display: block; }
      @font-face { font-family: "Plex"; src: url("assets/fonts/ibm-plex-sans-latin-500-normal.woff2") format("woff2"); font-weight: 500; font-display: block; }
      @font-face { font-family: "Plex"; src: url("assets/fonts/ibm-plex-sans-latin-600-normal.woff2") format("woff2"); font-weight: 600; font-display: block; }
      @font-face { font-family: "Plex"; src: url("assets/fonts/ibm-plex-sans-latin-700-normal.woff2") format("woff2"); font-weight: 700; font-display: block; }
      @font-face { font-family: "PlexMono"; src: url("assets/fonts/ibm-plex-mono-latin-400-normal.woff2") format("woff2"); font-weight: 400; font-display: block; }
      @font-face { font-family: "PlexMono"; src: url("assets/fonts/ibm-plex-mono-latin-500-normal.woff2") format("woff2"); font-weight: 500; font-display: block; }

      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: #0f1722; }
      body { font-family: "Plex", system-ui, sans-serif; }

      /* --- jetons repris de apps/frontend/src/styles/_theme.scss ------------ */
      :root {
        --bg: #0f1722;      --surface: #172234;   --line: #2a384f;
        --ink: #e6eaf2;     --ink-2: #a9b4c6;
        --primary: #5b9be8; --accent: #3fc9b7;    --ok: #5dd27a;  --err: #f0707a;
      }

      #root { position: relative; width: 1920px; height: 1080px; overflow: hidden; }
      #stage-ground { position: absolute; inset: 0; background: var(--bg); z-index: 0; }
      #root > div[data-composition-src] { position: absolute; inset: 0; z-index: 10; }

      /* --- la fenêtre : géométrie fixe, identique dans tous les chapitres --- */
      /* Déclarée ici une seule fois : le contenu des sous-compositions est cloné
         dans cette page, les styles de l'hôte s'y appliquent donc. */
      .win {
        position: absolute; left: 320px; top: 168px; width: 1280px; height: 660px;
        border-radius: 14px; overflow: hidden; background: var(--bg);
        border: 1px solid var(--line); box-shadow: 0 34px 90px rgba(0, 0, 0, 0.55);
      }
      .shot { position: absolute; inset: 0; }
      .shot video {
        position: absolute; inset: 0; width: 100%; height: 100%;
        object-fit: contain; background: var(--bg);
      }

      /* --- bandeau de chapitre --------------------------------------------- */
      .chaphead { position: absolute; left: 320px; top: 76px; display: flex; align-items: baseline; gap: 22px; }
      .chaphead b {
        font-family: "PlexMono", monospace; font-size: 20px; font-weight: 500;
        letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent);
      }
      .chaphead span { font-size: 46px; font-weight: 600; color: var(--ink); letter-spacing: -0.01em; }

      /* --- annotations en marge -------------------------------------------- */
      .note {
        position: absolute; width: 286px; font-size: 27px; font-weight: 600;
        line-height: 1.28; color: var(--ink); opacity: 0;
      }
      .note em {
        display: block; font-style: normal; font-weight: 400; font-size: 22px;
        color: var(--ink-2); margin-top: 9px; line-height: 1.36; font-size: 23px;
      }
      .note.l { left: 40px; text-align: right; }
      .note.r { right: 40px; text-align: left; }
      .note .rule { display: block; height: 3px; background: var(--accent); border-radius: 2px; margin-bottom: 14px; }
      .note.l .rule { margin-left: auto; width: 54px; }
      .note.r .rule { width: 54px; }

      /* --- cartouche de chiffres (posé sur la fenêtre) ---------------------- */
      .figs {
        position: absolute; left: 356px; right: 356px; bottom: 262px;
        display: flex; gap: 18px; justify-content: center; z-index: 40;
      }
      .fig {
        flex: 1; max-width: 300px; padding: 18px 22px; border-radius: 12px;
        background: rgba(15, 23, 34, 0.93); border: 1px solid var(--line); opacity: 0;
      }
      .fig b {
        display: block; font-family: "PlexMono", monospace; font-size: 62px;
        font-weight: 500; color: var(--ink); font-variant-numeric: tabular-nums; line-height: 1;
      }
      .fig i {
        display: block; font-style: normal; font-size: 21px; font-weight: 500;
        color: var(--ink-2); margin-top: 8px;
      }

      /* --- pastille de statut (posée sur la fenêtre) ------------------------ */
      .pill {
        position: absolute; padding: 9px 20px; border-radius: 999px;
        font-size: 25px; font-weight: 600; white-space: nowrap; opacity: 0; z-index: 40;
      }

      /* --- sous-titres ------------------------------------------------------ */
      .cap {
        position: absolute; left: 210px; right: 210px; top: 884px;
        display: flex; justify-content: center; z-index: 60; pointer-events: none;
      }
      .cap > span {
        display: inline-block; max-width: 1300px;
        background: rgba(15, 23, 34, 0.82);
        border: 1px solid rgba(42, 56, 79, 0.9);
        border-radius: 10px; padding: 16px 28px;
        font-size: 42px; font-weight: 500; line-height: 1.28;
        color: var(--ink); text-align: center; text-wrap: balance;
      }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1920" data-height="1080">
      <div id="stage-ground"></div>

      <!-- Chapitres -->
${chapterHtml}

      <!-- Sous-titres (générés depuis tools/captions.json) -->
${cueHtml}

      <!-- Bande son continue : voix des trois orateurs, calées à -16 LUFS -->
      <audio id="spine" src="media/voix-spine.m4a" data-start="0" data-duration="${TOTAL}" data-track-index="10" data-volume="1"></audio>
    </div>

    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    <\/script>
  </body>
</html>
`;

writeFileSync(resolve(ROOT, "index.html"), html);

console.log(`index.html — ${TOTAL} s, ${chapters.length} chapitres, ${cues.length} sous-titres`);
for (const c of chapters) {
  console.log(`  ${c.start.toFixed(2).padStart(7)} → ${(c.start + c.dur).toFixed(2).padStart(7)}  ${c.id}  (${c.dur.toFixed(2)} s, ${c.plans.length} plans)`);
  for (const p of c.plans) {
    console.log(
      `        local ${p.local.toFixed(2).padStart(6)}  dur ${p.dur.toFixed(2).padStart(5)}  ${p.src ? "media@" + p.mediaStart.toFixed(2) : "—"}  ${p.id}`,
    );
  }
}
