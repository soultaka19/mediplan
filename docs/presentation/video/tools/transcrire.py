# Transcription mot à mot d'un rush, en français.
#
#   pip install faster-whisper
#   python tools/transcrire.py media/zak-clean.mp4 tools/zakaria-words.json
#
# Sortie : [{ "s": début, "e": fin, "w": mot }, …] — c'est ce qui permet de
# couper aux pauses réelles (jamais au milieu d'un mot) et de générer des
# sous-titres calés. build-spine.mjs lit ces fichiers via WORDS_DIR.

import subprocess
import sys
import tempfile
import json
import os
from faster_whisper import WhisperModel

if len(sys.argv) < 3:
    sys.exit("usage: transcrire.py <audio|video> <sortie.json>")

src, out = sys.argv[1], sys.argv[2]

# Whisper veut du 16 kHz mono. On normalise au passage : les rushes d'origine
# sont 16 à 23 dB trop bas, et un signal faible dégrade la reconnaissance.
with tempfile.TemporaryDirectory() as tmp:
    wav = os.path.join(tmp, "a.wav")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-vn",
         "-af", "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=16000",
         "-ac", "1", "-c:a", "pcm_s16le", wav],
        check=True,
    )

    model = WhisperModel("medium", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(
        wav, language="fr", vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
        beam_size=5, word_timestamps=True,
    )

    words = []
    for s in segments:
        for w in (s.words or []):
            words.append({"s": round(w.start, 2), "e": round(w.end, 2), "w": w.word.strip()})

json.dump(words, open(out, "w", encoding="utf-8"), ensure_ascii=False)
print(f"{len(words)} mots -> {out}")

# Rappel utile au montage : la carte des pauses, qui donne les points de coupe.
prev = None
for x in words:
    if prev and x["s"] - prev["e"] > 0.5:
        print(f'  pause {x["s"] - prev["e"]:.2f}s avant {x["s"]:.2f}  « {x["w"]} »')
    prev = x
