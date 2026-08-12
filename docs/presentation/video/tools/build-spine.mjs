// Assemble la bande son du film à partir de la liste de coupes, puis émet
// la carte des temps qui pilote la composition et les sous-titres.
//
//   node tools/build-spine.mjs
//
// Entrées  : tools/cuts.json           — la liste de coupes (source de vérité du montage)
//            ../../<*>-words.json      — les mots horodatés (via WORDS_DIR)
// Sorties  : media/voix-spine.m4a      — la bande son continue
//            tools/timeline.json       — { id, start, dur, src, mediaStart } par plan
//            tools/captions.json       — les sous-titres recalés sur le film

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const WORDS_DIR = process.env.WORDS_DIR ?? HERE;

const GAP = 0.34; // respiration insérée entre deux plans consécutifs
const FADE = 0.025; // fondu d'amorce/sortie sur chaque segment, contre les clics

const cuts = JSON.parse(readFileSync(resolve(HERE, "cuts.json"), "utf8"));

// --- sources distinctes, dans l'ordre de première apparition ------------------
const sources = [];
for (const c of cuts) {
  if (c.src && !sources.includes(c.src)) sources.push(c.src);
}

// --- construction du graphe de filtres ---------------------------------------
const parts = [];
const labels = [];
const timeline = [];
let cursor = 0;

cuts.forEach((c, i) => {
  const lab = `a${i}`;
  if (c.src) {
    const idx = sources.indexOf(c.src);
    const dur = +(c.out - c.in).toFixed(3);
    parts.push(
      `[${idx}:a]atrim=start=${c.in}:end=${c.out},asetpts=N/SR/TB,` +
        `afade=t=in:st=0:d=${FADE},afade=t=out:st=${(dur - FADE).toFixed(3)}:d=${FADE},` +
        `apad=pad_dur=${GAP}[${lab}]`,
    );
    timeline.push({
      id: c.id,
      label: c.label ?? "",
      start: +cursor.toFixed(3),
      dur: dur,
      slot: +(dur + GAP).toFixed(3),
      src: c.src,
      mediaStart: c.in,
      // L'image peut tenir un autre moment que le son — c'est ce qui permet
      // d'écarter un passage impubliable sans perdre la phrase qui va avec.
      videoStart: c.videoIn ?? c.in,
      scene: c.scene ?? null,
    });
    cursor += dur + GAP;
  } else {
    // plan sans voix : silence calibré (carton, respiration, séquence à tourner)
    const dur = +c.silence.toFixed(3);
    parts.push(`anullsrc=r=48000:cl=stereo,atrim=duration=${dur},asetpts=N/SR/TB[${lab}]`);
    timeline.push({
      id: c.id,
      label: c.label ?? "",
      start: +cursor.toFixed(3),
      dur,
      slot: dur,
      src: null,
      mediaStart: null,
      scene: c.scene ?? null,
    });
    cursor += dur;
  }
  labels.push(`[${lab}]`);
});

parts.push(`${labels.join("")}concat=n=${labels.length}:v=0:a=1[out]`);

const args = [
  "-y",
  "-hide_banner",
  "-loglevel",
  "error",
  ...sources.flatMap((s) => ["-i", resolve(ROOT, "media", s)]),
  "-filter_complex",
  parts.join(";"),
  "-map",
  "[out]",
  "-c:a",
  "aac",
  "-b:a",
  "192k",
  "-ar",
  "48000",
  "-ac",
  "2",
  resolve(ROOT, "media", "voix-spine.m4a"),
];

execFileSync("ffmpeg", args, { stdio: "inherit" });

// --- sous-titres : on recale les mots de chaque source sur le temps du film ---
const wordCache = new Map();
function wordsFor(src) {
  if (!wordCache.has(src)) {
    const stem = src.includes("soul")
      ? "souleymane"
      : src.includes("larbi")
        ? "larbi"
        : "zakaria";
    const p = resolve(WORDS_DIR, `${stem}-words.json`);
    wordCache.set(src, existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : []);
  }
  return wordCache.get(src);
}

const SOFT = 56; // au-delà, on coupe à la première ponctuation
const HARD = 92; // deux lignes pleines : coupure forcée
const MAX_DUR = 6.0;

// Le sous-titre ne réécrit pas le propos : il le met au propre. Grammaire
// corrigée, mots avalés rétablis, coquilles de transcription réparées — la voix,
// elle, reste inchangée (décision de montage, cf. PLAN-MONTAGE-VIDEO.md § 6.4).
const FIXES = [
  [/\bclino\b/gi, "créneau"],
  [/la journée type des sessions d'une clinique/gi, "la journée type d'une clinique"],
  [/\bdu clinique\b/g, "de la clinique"],
  [/\bBergeon\b/g, "Bergeron"],
  [/et le rôle que j'ai accès/gi, "et le rôle qui est le mien"],
  [/on clique sur par exemple un port, vendredi/gi, "on clique par exemple sur vendredi"],
  [/\bmarqué comme (arrivé|absent)/gi, "marquer comme $1"],
  [/\bannulé un rendez-vous\b/gi, "annuler un rendez-vous"],
  [/\btoutes les (patients|statuts)\b/gi, "tous les $1"],
  [/^complète cette vie/i, "elle complète cette vue"],
  [/filtrer les taux par période/gi, "filtrer les données par période"],
  [/le volume du rendez-vous/gi, "le volume de rendez-vous"],
  [/tableau de war/gi, "tableau de bord"],
  [/sa charge du travail/gi, "sa charge de travail"],
  [/annulation pro promo/gi, "annulation proprement"],
  [/téléphone, sur son évolution/gi, "téléphone, suivre son évolution"],
  [/\bemail\b/gi, "e-mail"],
  [/on clique sur réservé/gi, "on clique sur Réserver"],
  [/^que j'ai accès/i, "qui est le mien"],
  [/^je joue le rôle/i, "Je joue le rôle"],
  [/^en gros ma partie/i, "En gros, ma partie"],
  [/la page statistique\b/gi, "la page Statistiques"],
  [/au flux du jour on peut faire comme marquer/gi, "au flux du jour, on peut marquer"],
  [/par exemple on peut faire terminer/gi, "par exemple, on peut terminer"],
  [/par exemple terminer la consultation va trouver ici/gi, "par exemple terminer la consultation : on va trouver ici"],
  [/le cas typique, c'est/gi, "le cas typique : c'est"],
  [/\b(\d{1,2})h à (\d{1,2})h\b/g, "$1 h à $2 h"],
  [/,?\s+on$/i, ""], // mot orphelin laissé par une coupe
  // Locutions coupées entre deux sous-titres : on répare le fragment de fin.
  [/volume du$/i, "volume de"],
  [/charge du$/i, "charge de"],
  [/voilà et merci$/i, "voilà, et merci."],
  [/\s+/g, " "],
];

function tidy(s) {
  let out = s;
  for (const [re, to] of FIXES) out = out.replace(re, to);
  return out.trim();
}

// Whisper émet « l » puis « 'ensemble », « rendez » puis « -vous » : on recolle.
function join(prev, tok) {
  if (!prev) return tok;
  const noSpace = /^['’\-,.;:!?%»)]/.test(tok) || /['’(«\-]$/.test(prev);
  return prev + (noSpace ? "" : " ") + tok;
}

const captions = [];

for (const t of timeline) {
  if (!t.src) continue;
  const inWindow = wordsFor(t.src).filter((w) => w.s >= t.mediaStart - 0.02 && w.e <= t.mediaStart + t.dur + 0.02);
  let cue = null;
  const flush = () => {
    if (!cue) return;
    const txt = tidy(cue.text);
    if (txt) captions.push({ ...cue, text: txt });
    cue = null;
  };
  for (const w of inWindow) {
    const s = +(t.start + (w.s - t.mediaStart)).toFixed(3);
    const e = +(t.start + (w.e - t.mediaStart)).toFixed(3);
    const tok = w.w.replace(/^\s+/, "");
    if (cue) {
      // Un jeton qui commence par « - » ou « ' » appartient au mot précédent :
      // couper là produirait « rendez / -vous » ou « l / 'ensemble ».
      const atomic = /^['’\-]/.test(tok);
      const next = join(cue.text, tok);
      if (!atomic && (next.length > HARD || e - cue.start > MAX_DUR)) flush();
    }
    if (!cue) cue = { start: s, end: e, text: tok, plan: t.id };
    else {
      cue.text = join(cue.text, tok);
      cue.end = e;
      // Coupure naturelle : dès qu'on a de quoi lire et qu'une ponctuation tombe.
      if (cue.text.length >= SOFT && /[,.;:!?]$/.test(cue.text)) flush();
    }
  }
  flush();
}

writeFileSync(resolve(HERE, "timeline.json"), JSON.stringify(timeline, null, 1));
writeFileSync(resolve(HERE, "captions.json"), JSON.stringify(captions, null, 1));

const total = cursor;
console.log(`bande son : ${total.toFixed(2)} s  (${Math.floor(total / 60)} min ${(total % 60).toFixed(0)} s)`);
console.log(`${timeline.length} plans, ${captions.length} sous-titres`);
for (const t of timeline) {
  console.log(
    `  ${t.start.toFixed(2).padStart(7)}  +${t.slot.toFixed(2).padStart(6)}  ${(t.scene ?? "").padEnd(22)} ${t.label}`,
  );
}
