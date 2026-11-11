/* Gera assets/img/ascii-avatar.svg a partir de assets/img/ascii-art.txt.
   Uso: node scripts/build-ascii.js

   O desenho base tem 72 colunas x 44 linhas. Para ganhar detalhe, ele e
   reamostrado (bicubico + unsharp) para SCALE vezes mais colunas/linhas,
   e depois convertido para uma rampa de 12 tons. Resultado: mesma pessoa,
   com muito mais caracteres e transicoes suaves.

   FIRST_ROW / LAST_ROW / COL_START / COL_END -> recorte do desenho base
   SCALE   -> 2 = dobro de colunas e linhas
   SQUASH  -> comprime a altura (1 = original)
*/

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "assets", "img", "ascii-art.txt");
const OUT = path.join(ROOT, "assets", "img", "ascii-avatar.svg");

const FIRST_ROW = 4;
const LAST_ROW = 43;
const COL_START = 0;
const COL_END = 72;
const SCALE = 2;
const SQUASH = 0.94;

const RAMP = " .:-=+o*O#%@"; // 12 tons, do claro ao escuro
const FONT = 6;
const CHAR_W = FONT * 0.6;
const LINE_H = FONT * 1.08 * SQUASH;
const BAR_H = 30;
const PAD_TOP = 14;
const PAD_BOTTOM = 14;
const PAD_X = 12;

const raw = fs.readFileSync(SRC, "utf8").replace(/\r/g, "").split("\n");
const base = raw
  .slice(FIRST_ROW, LAST_ROW + 1)
  .map((l) => l.padEnd(COL_END, " ").slice(COL_START, COL_END));

const SHADE = {};
RAMP.split("").forEach((ch, i) => (SHADE[ch] = i / (RAMP.length - 1)));

// 1. desenho base -> campo de densidade (0 = claro, 1 = escuro)
const src = base.map((line) =>
  [...line].map((ch) => (ch === " " ? 0 : SHADE[ch] !== undefined ? SHADE[ch] : 0.75))
);

// 2. bicubico (Catmull-Rom) com borda replicada
const cr = (t) => {
  const a = -0.5;
  return t < 1
    ? (a + 2) * t * t * t - (a + 3) * t * t + 1
    : a * t * t * t - 5 * a * t * t + 8 * a * t - 4 * a;
};
const at = (grid, y, x) => {
  const h = grid.length,
    w = grid[0].length;
  const yy = Math.min(h - 1, Math.max(0, y));
  const xx = Math.min(w - 1, Math.max(0, x));
  return grid[yy][xx];
};
function sampleBicubic(grid, fy, fx) {
  const y0 = Math.floor(fy),
    x0 = Math.floor(fx);
  const ty = fy - y0,
    tx = fx - x0;
  let out = 0,
    wsum = 0;
  for (let m = -1; m <= 2; m++) {
    const wy = cr(Math.abs(m - ty));
    for (let n = -1; n <= 2; n++) {
      const wx = cr(Math.abs(n - tx));
      const w = wy * wx;
      out += w * at(grid, y0 + m, x0 + n);
      wsum += w;
    }
  }
  return out / wsum;
}

const rows = src.length * SCALE;
const cols = src[0].length * SCALE;
let field = [];
for (let y = 0; y < rows; y++) {
  const row = [];
  for (let x = 0; x < cols; x++) {
    row.push(sampleBicubic(src, (y + 0.5) / SCALE - 0.5, (x + 0.5) / SCALE - 0.5));
  }
  field.push(row);
}

// 3. suaviza o ruido dos caracteres originais e recupera a definicao das bordas
const blurOnce = (grid) =>
  grid.map((row, y) =>
    row.map((_, x) => {
      let s = 0,
        w = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const k = dy === 0 && dx === 0 ? 4 : dy === 0 || dx === 0 ? 2 : 1;
          s += at(grid, y + dy, x + dx) * k;
          w += k;
        }
      return s / w;
    })
  );

let smooth = field;
for (let i = 0; i < 2; i++) smooth = blurOnce(smooth);

field = field.map((row, y) =>
  row.map((v, x) => Math.min(1, Math.max(0, smooth[y][x] + 0.55 * (v - smooth[y][x]))))
);

// 4. densidade -> caracteres
const art = field.map((row) =>
  row.map((v) => RAMP[Math.min(RAMP.length - 1, Math.round(v * (RAMP.length - 1)))]).join("")
);

const artCols = cols;
const artRows = rows;

// a cabeca nao fica no centro do desenho base: desloca 3 colunas (base) para a direita
const PAD_LEFT = PAD_X + 3 * SCALE * CHAR_W;
const width = Math.round(artCols * CHAR_W + PAD_LEFT + PAD_X);
const artTop = BAR_H + PAD_TOP + FONT;
const height = Math.round(artTop + (artRows - 1) * LINE_H + FONT * 0.9 + PAD_BOTTOM);

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const tspans = art
  .map((line, i) => {
    const y = (artTop + i * LINE_H).toFixed(2);
    return `<tspan x="${PAD_LEFT.toFixed(2)}" y="${y}" textLength="${(artCols * CHAR_W).toFixed(2)}" lengthAdjust="spacing">${esc(line) || " "}</tspan>`;
  })
  .join("\n    ");

const lastIdx = art.reduce((acc, l, i) => (l.trim() ? i : acc), 0);
const cursorX = (PAD_LEFT + art[lastIdx].length * CHAR_W + 1).toFixed(1);
const cursorY = (artTop + lastIdx * LINE_H - FONT * 0.85).toFixed(1);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Retrato de Carlos Duhring em arte ASCII">
  <defs>
    <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbf7ff"/>
      <stop offset="1" stop-color="#f4ecff"/>
    </linearGradient>
    <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="#6d28d9" opacity="0.06"/>
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

  <circle cx="17" cy="15" r="4" fill="#ff5f56"/>
  <circle cx="30" cy="15" r="4" fill="#ffbd2e"/>
  <circle cx="43" cy="15" r="4" fill="#27c93f"/>
  <text x="58" y="19" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="10" fill="#8a80a3">carlos@duhring: ~/profile</text>

  <text font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="${FONT}" fill="#5b21b6" xml:space="preserve">
    ${tspans}
  </text>

  <rect x="${cursorX}" y="${cursorY}" width="${(CHAR_W * 0.8).toFixed(1)}" height="${(FONT * 0.95).toFixed(1)}" rx="0.5" fill="#7c3aed">
    <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite"/>
  </rect>
</svg>
`;

fs.writeFileSync(OUT, svg, "utf8");
console.log(`ok — ${width}x${height} · ${artRows} linhas x ${artCols} colunas (${SCALE}x)`);
