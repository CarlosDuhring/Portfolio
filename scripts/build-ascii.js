/* Gera assets/img/ascii-avatar.svg a partir de assets/img/ascii-art.txt.
   Uso: node scripts/build-ascii.js

   FIRST_ROW / LAST_ROW  -> recorte vertical (linhas da arte)
   COL_START / COL_END   -> recorte horizontal (colunas)
   SQUASH                -> comprime a altura (1 = original, 0.84 = mais quadrado)
*/

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "assets", "img", "ascii-art.txt");
const OUT = path.join(ROOT, "assets", "img", "ascii-avatar.svg");

const FIRST_ROW = 4; // corta o topo vazio
const LAST_ROW = 43; // arte completa (até o fim)
const COL_START = 0;
const COL_END = 72;
const SQUASH = 0.84; // deixa o retrato mais quadrado, sem cortar nada

const FONT = 12;
const CHAR_W = FONT * 0.6;
const LINE_H = FONT * 1.2167 * SQUASH;
const PAD_X = 22;
const BAR_H = 36;
const PAD_TOP = 20;
const PAD_BOTTOM = 18;

const lines = fs.readFileSync(SRC, "utf8").replace(/\r/g, "").split("\n");

const block = lines
  .slice(FIRST_ROW, LAST_ROW + 1)
  .map((line) => line.padEnd(COL_END, " ").slice(COL_START, COL_END).replace(/\s+$/, ""));

const cols = Math.max(...block.map((l) => l.length));
// a cabeca nao fica no centro da arte original: desloca 3 colunas para
// centralizar o rosto no card, sem cortar nada
const PAD_LEFT = PAD_X + 3 * CHAR_W;
const width = Math.round(cols * CHAR_W + PAD_LEFT + PAD_X);
const artTop = BAR_H + PAD_TOP + FONT;
const height = Math.round(artTop + (block.length - 1) * LINE_H + FONT * 0.6 + PAD_BOTTOM);

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const rows = block
  .map((line, i) => {
    const y = (artTop + i * LINE_H).toFixed(1);
    return `<tspan x="${PAD_LEFT.toFixed(1)}" y="${y}">${esc(line) || " "}</tspan>`;
  })
  .join("\n    ");

const lastIdx = block.reduce((acc, l, i) => (l.trim() ? i : acc), 0);
const cursorX = (PAD_LEFT + (block[lastIdx] || "").length * CHAR_W + 2).toFixed(1);
const cursorY = (artTop + lastIdx * LINE_H - FONT * 0.82).toFixed(1);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Retrato de Carlos Duhring em arte ASCII">
  <defs>
    <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbf7ff"/>
      <stop offset="1" stop-color="#f4ecff"/>
    </linearGradient>
    <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="#6d28d9" opacity="0.07"/>
    </pattern>
    <clipPath id="card">
      <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="14"/>
    </clipPath>
  </defs>

  <g clip-path="url(#card)">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#fdfbff"/>
    <rect x="0" y="${BAR_H}" width="${width}" height="${height - BAR_H}" fill="url(#dots)"/>
  </g>

  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="14" fill="none" stroke="#eadffb"/>
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
console.log(`ok — ${width}x${height} · ${block.length} linhas · ${cols} colunas · squash ${SQUASH}`);
