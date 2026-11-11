/* Gera assets/img/ascii-avatar.svg a partir de assets/img/ascii-art.txt.
   Uso: node scripts/build-ascii.js
   Ajuste FIRST_ROW/LAST_ROW para mudar o enquadramento do busto. */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "assets", "img", "ascii-art.txt");
const OUT = path.join(ROOT, "assets", "img", "ascii-avatar.svg");

const FIRST_ROW = 4; // corta o topo vazio
const LAST_ROW = 30; // corta o excesso de torso
const COL_START = 12; // tira a margem vazia da esquerda
const COL_END = 66; // fim da arte
const FONT = 12;
const CHAR_W = FONT * 0.6;
const LINE_H = 14.6;
const PAD_X = 20;
const BAR_H = 36;
const PAD_TOP = 18;
const PAD_BOTTOM = 16;

const lines = fs.readFileSync(SRC, "utf8").replace(/\r/g, "").split("\n");
const block = lines
  .slice(FIRST_ROW, LAST_ROW + 1)
  .map((l) => l.padEnd(COL_END, " ").slice(COL_START, COL_END).replace(/\s+$/, ""));

/* limpa pontinhos soltos do fundo (pessoas atrás), que só somam ruído */
function cleanArt(rows) {
  const H = rows.length;
  const W = Math.max(...rows.map((r) => r.length));
  const grid = rows.map((r) => r.padEnd(W, " ").split(""));
  const out = grid.map((r) => r.slice());

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x] === " ") continue;
      let neighbours = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const yy = y + dy;
          const xx = x + dx;
          if (yy < 0 || yy >= H || xx < 0 || xx >= W) continue;
          if (grid[yy][xx] !== " ") neighbours++;
        }
      }
      if (neighbours <= 2) out[y][x] = " ";
    }
  }
  return out.map((r) => r.join("").replace(/\s+$/, ""));
}

const cleaned = cleanArt(block);

const cols = Math.max(...cleaned.map((l) => l.length));
const width = Math.round(cols * CHAR_W + PAD_X * 2);
const artTop = BAR_H + PAD_TOP + FONT;
const height = Math.round(artTop + (cleaned.length - 1) * LINE_H + FONT * 0.6 + PAD_BOTTOM);

const esc = (t) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const rows = cleaned
  .map((line, i) => {
    const y = (artTop + i * LINE_H).toFixed(1);
    return `<tspan x="${PAD_X}" y="${y}">${esc(line) || " "}</tspan>`;
  })
  .join("\n    ");

// cursor piscando no fim da última linha com conteúdo
const lastIdx = cleaned.reduce((acc, l, i) => (l.trim() ? i : acc), 0);
const cursorX = (PAD_X + (cleaned[lastIdx] || "").length * CHAR_W + 2).toFixed(1);
const cursorY = (artTop + lastIdx * LINE_H - FONT * 0.82).toFixed(1);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Retrato de Carlos Duhring em arte ASCII">
  <defs>
    <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbf7ff"/>
      <stop offset="1" stop-color="#f4ecff"/>
    </linearGradient>
  </defs>

  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="14" fill="#ffffff" stroke="#eadffb"/>
  <path d="M0.5 14.5A14 14 0 0 1 14.5 0.5H${width - 14.5}A14 14 0 0 1 ${width - 0.5} 14.5V${BAR_H}H0.5Z" fill="url(#bar)"/>
  <line x1="0.5" y1="${BAR_H}" x2="${width - 0.5}" y2="${BAR_H}" stroke="#eadffb"/>

  <circle cx="21" cy="18" r="5" fill="#ff5f56"/>
  <circle cx="37" cy="18" r="5" fill="#ffbd2e"/>
  <circle cx="53" cy="18" r="5" fill="#27c93f"/>
  <text x="74" y="22" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="11.5" fill="#8a80a3">carlos@duhring: ~/profile</text>

  <text font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="${FONT}" fill="#5b21b6" xml:space="preserve">
    ${rows}
  </text>

  <rect x="${cursorX}" y="${cursorY}" width="${(CHAR_W * 0.8).toFixed(1)}" height="${(FONT * 0.95).toFixed(1)}" rx="1" fill="#7c3aed">
    <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite"/>
  </rect>
</svg>
`;

fs.writeFileSync(OUT, svg, "utf8");
console.log(`ok — ${width}x${height} · ${block.length} linhas · ${cols} colunas`);
