// Extrait les blocs Mermaid des fichiers .md et les écrit en .mmd dans /images
// pour rendu PNG via @mermaid-js/mermaid-cli (mmdc).
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = join(root, 'images');

function walk(dir) {
  let files = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (basename(p) === 'images') continue;
      files = files.concat(walk(p));
    } else if (extname(p) === '.md') {
      files.push(p);
    }
  }
  return files;
}

const mdFiles = walk(root);
let count = 0;
for (const f of mdFiles) {
  const content = readFileSync(f, 'utf8');
  const matches = [...content.matchAll(/```mermaid\n([\s\S]*?)```/g)];
  matches.forEach((m, i) => {
    const name = basename(f, '.md') + (matches.length > 1 ? `-${i + 1}` : '');
    writeFileSync(join(outDir, name + '.mmd'), m[1].trim() + '\n');
    count++;
    console.log('Extrait :', name + '.mmd');
  });
}
console.log(`\n${count} diagramme(s) extrait(s) dans ${outDir}`);
