// Bai kiem chu thich anh AI duoi hero. Chay: node scripts/chu-thich-anh-ai.test.mjs — thoat 1 neu co ca truot.
// Nap module thuan chu-thich-anh-ai.mjs (KHONG nap build-article.mjs vi file do ghi file khi import);
// rieng ca "noi day" doc ma nguon build-article.mjs de chac hero di qua heroHtml().
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CHU_THICH_AI, CSS_CHU_THICH_AI, coChuThichAi, heroHtml } from "./chu-thich-anh-ai.mjs";

const IMG = '<img class="post-hero-img" src="../assets/blog/a-hero.png" alt="a" />';
const coHero = heroHtml({ anh_ai: true }, "../assets/blog/a-hero.png", IMG);
const khongCo = heroHtml({}, "../assets/blog/a-hero.png", IMG);
const tat = heroHtml({ anh_ai: false }, "../assets/blog/a-hero.png", IMG);
const bat = heroHtml({ anh_ai: true }, "https://x.vn/a.png", IMG);
const khongHero = heroHtml({}, "", "");

// Do tuong phan WCAG 2.x
const kenh = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const sang = (hex) => { const n = parseInt(hex.replace("#", ""), 16); return 0.2126 * kenh(n >> 16) + 0.7152 * kenh((n >> 8) & 255) + 0.0722 * kenh(n & 255); };
const tuongPhan = (a, b) => { const [x, y] = [sang(a), sang(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mau = (CSS_CHU_THICH_AI.match(/\.post-hero-cap\{[^}]*color:(#[0-9A-Fa-f]{6})/) || [])[1];
const capCss = (CSS_CHU_THICH_AI.match(/\.post-hero-cap\{[^}]*\}/) || [""])[0];

const src = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "build-article.mjs"), "utf8");

const CA = [
  // [ten, ra, mong] — CEO 12/10/2026: khong bao gio in chu thich anh AI
  ["anh_ai:true + hero -> TAT (CEO 12/10)", coChuThichAi({ anh_ai: true }, "x.png"), false],
  ["anh_ai:true -> chi anh, khong figure/figcaption", coHero, IMG],
  ["anh_ai:true remote -> khong chu AI", /figcaption|Ảnh minh hoạ được tạo bằng AI/.test(bat), false],
  ["khong co co -> chi anh", khongCo, IMG],
  ["anh_ai:false -> chi anh", tat, IMG],
  ["khong hero -> rong", heroHtml({ anh_ai: true }, "", "") + khongHero, ""],
  ["noi day: build-article goi heroHtml cho anh hero", /heroHtml\(fm, heroSrc, `<img class="post-hero-img"/.test(src), true],
];

let dat = 0, truot = 0;
for (const [ten, ra, mong] of CA) {
  const ok = ra === mong;
  ok ? dat++ : truot++;
  console.log(`  ${ok ? "dat  " : "TRUOT"} ${ten}${ok ? "" : ` -> ${JSON.stringify(ra)}`}`);
}
console.log(`\nKET QUA: ${dat} dat / ${truot} truot`);
process.exit(truot ? 1 : 0);
