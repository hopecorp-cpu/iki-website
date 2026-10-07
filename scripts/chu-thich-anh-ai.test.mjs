// Bai kiem chu thich anh AI duoi hero. Chay: node scripts/chu-thich-anh-ai.test.mjs — thoat 1 neu co ca truot.
// Nap module thuan chu-thich-anh-ai.mjs (KHONG nap build-article.mjs vi file do ghi file khi import);
// rieng ca "noi day" doc ma nguon build-article.mjs de chac hero di qua heroHtml().
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CHU_THICH_AI, CSS_CHU_THICH_AI, coChuThichAi, heroHtml } from "./chu-thich-anh-ai.mjs";

const IMG = '<img class="post-hero-img" src="../assets/blog/a-hero.png" alt="a" />';
const coHero = heroHtml({}, "../assets/blog/a-hero.png", IMG);
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
  // [ten, ra, mong]
  ["chu dung nguyen van", CHU_THICH_AI, "Ảnh minh hoạ được tạo bằng AI."],
  ["mac dinh bat khi co hero", coChuThichAi({}, "x.png"), true],
  ["co hero -> figure bao anh", coHero.startsWith('<figure class="post-hero-fig">') && coHero.trimEnd().endsWith("</figure>"), true],
  ["anh nam trong figure, nguyen the img", coHero.includes(IMG), true],
  ["figcaption ngay sau anh", /<img class="post-hero-img"[^>]*\/>\s*<figcaption class="post-hero-cap">Ảnh minh hoạ được tạo bằng AI\.<\/figcaption>\s*<\/figure>$/.test(coHero), true],
  ["dung 1 figcaption", (coHero.match(/<figcaption/g) || []).length, 1],
  ["anh_ai:false -> chi anh, khong chu thich", tat, IMG],
  ["anh_ai:true + hero_image remote -> co chu thich", bat.includes(CHU_THICH_AI), true],
  ["khong hero -> rong, ke ca anh_ai:true", heroHtml({ anh_ai: true }, "", "") + khongHero, ""],
  ["khong hero -> khong chen CSS", coChuThichAi({ anh_ai: true }, ""), false],
  ["css co 13px", /font-size:13px/.test(capCss), true],
  ["css mau #4A4A4A", mau, "#4A4A4A"],
  ["tuong phan tren nen trang >= 4.5", tuongPhan(mau || "#FFFFFF", "#FFFFFF") >= 4.5, true],
  ["css chu dung (font-style:normal)", /font-style:normal/.test(capCss), true],
  ["css khong italic", /italic/i.test(CSS_CHU_THICH_AI), false],
  ["css khong monospace", /monospace|courier|consolas|menlo/i.test(CSS_CHU_THICH_AI), false],
  ["chu thich khong dung em/i", /<(em|i)>/.test(coHero), false],
  ["noi day: build-article goi heroHtml cho anh hero", /heroHtml\(fm, heroSrc, `<img class="post-hero-img"/.test(src), true],
  ["noi day: CSS chi chen khi co chu thich", src.includes('${coChuThichAi(fm, heroSrc) ? CSS_CHU_THICH_AI : ""}'), true],
  ["noi day: khong con img hero tran ngoai heroHtml", /\$\{heroSrc \? `<img class="post-hero-img"/.test(src), false],
];

let dat = 0, truot = 0;
for (const [ten, ra, mong] of CA) {
  const ok = ra === mong;
  ok ? dat++ : truot++;
  console.log(`  ${ok ? "dat  " : "TRUOT"} ${ten}${ok ? "" : ` -> ${JSON.stringify(ra)}`}`);
}
console.log(`  (tuong phan #4A4A4A/#FFFFFF = ${tuongPhan(mau || "#FFFFFF", "#FFFFFF").toFixed(2)}:1)`);
console.log(`\nKET QUA: ${dat} dat / ${truot} truot`);
process.exit(truot ? 1 : 0);
