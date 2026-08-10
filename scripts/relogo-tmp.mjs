// Bản relogo chạy trong clone tạm: BASE = repo hiện tại (gen-hero-images.mjs ghi cứng path repo khác).
// Dùng: node scripts/relogo-tmp.mjs <slug> "<prompt anh>"
import { createRequire } from "module";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire("/Users/NguyenHung/hope-corp/hope-ops-hub/");
const sharp = require("sharp");

const BASE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const W = 1200, H = 675;
const ICON_B64 = readFileSync(`${BASE}/assets/logo/iki-mark.png`).toString("base64");

function overlaySvg() {
  const pillW = 226, pillH = 62, m = 26;
  const px = W - pillW - m, py = H - pillH - m;
  const iconSz = 42, iconX = px + 15, iconY = py + (pillH - iconSz) / 2;
  const txtX = iconX + iconSz + 12, txtY = py + pillH / 2;
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <g>
    <rect x="${px}" y="${py}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="#ffffff" fill-opacity="0.93"/>
    <image x="${iconX}" y="${iconY}" width="${iconSz}" height="${iconSz}" xlink:href="data:image/png;base64,${ICON_B64}"/>
    <text x="${txtX}" y="${txtY - 5}" font-family="Manrope, Arial, sans-serif" font-size="19" font-weight="800" fill="#16241F" letter-spacing="0.5">IKI</text>
    <text x="${txtX}" y="${txtY + 15}" font-family="Manrope, Arial, sans-serif" font-size="11.5" font-weight="700" fill="#2E8975" letter-spacing="1.2">by HOPE CORP</text>
  </g>
</svg>`);
}

async function fetchImg(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 90000);
      const r = await fetch(url, { signal: ctl.signal });
      clearTimeout(t);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 20000) throw new Error("anh qua nho " + buf.length);
      return buf;
    } catch (e) {
      console.log("  ...thu lai:", e.message);
      if (i === tries - 1) throw e;
      await new Promise((s) => setTimeout(s, 4000 * (i + 1)));
    }
  }
}

const seedOf = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 100000; };

const [slug, prompt] = process.argv.slice(2);
if (!slug) { console.error("thieu slug"); process.exit(1); }
const dest = `${BASE}/assets/blog/${slug}-hero.jpg`;

let base;
if (prompt) {
  const full = `${prompt}, editorial food and lifestyle photography, soft natural light, wooden surfaces, calm muted sage green tones, minimal wellness aesthetic, no people, no faces, no hands, no text, no words, no logo, high detail`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=${W}&height=${H}&nologo=true&seed=${seedOf(slug)}&model=flux`;
  base = await fetchImg(url);
} else {
  if (!existsSync(dest)) { console.error("khong co anh goc:", slug); process.exit(1); }
  base = readFileSync(dest);
}

const out = await sharp(base).resize(W, H, { fit: "cover", position: "attention" })
  .composite([{ input: overlaySvg(), top: 0, left: 0 }])
  .jpeg({ quality: 82, mozjpeg: true }).toBuffer();
writeFileSync(dest, out);
console.log("OK", (out.length / 1024).toFixed(0) + "KB", slug);
