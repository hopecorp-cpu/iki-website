// Kiem nguong nen am-sang, nhan «N ·», .sec-num, monospace tren SVG text.
// Chay: node scripts/kiem-luat-web.test.mjs
import { amSang, quetMot } from "./kiem-luat-web.mjs";

const ma = (hits) => hits.map((h) => h.split("\t")[0]);
const co = (hits, code) => ma(hits).includes(code);

const CA = [
  ["#FBEAE4 la am-sang", amSang(251, 234, 228), true],
  ["#f3e8e8 la am-sang", amSang(243, 232, 232), true],
  ["#f3f7f2 xanh lanh khong am", amSang(243, 247, 242), false],
  ["#ffffff khong am", amSang(255, 255, 255), false],
  ["#f5f5f5 xam deu khong am", amSang(245, 245, 245), false],
  ["#f3e4e7 hong G<B khong nam nguong", amSang(243, 228, 231), false],
  ["nen #FBEAE4", co(quetMot("x{background:#FBEAE4}", "a.css"), "a"), true],
  ["chu #FBEAE4 khong tinh", co(quetMot("x{color:#FBEAE4}", "a.css"), "a"), false],
  ["vien #f3e8e8 khong tinh", co(quetMot("x{border:1px solid #f3e8e8}", "a.css"), "a"), false],
  ["bien --alert-s", co(quetMot(":root{--alert-s:#FBEAE4}", "a.css"), "a"), true],
  ["--ink chu toi khong tinh", co(quetMot(":root{--ink:#f8f0e9}body{color:var(--ink)}", "a.css"), "a"), false],
  ["#f3f7f2 nen giu", co(quetMot("x{background:#f3f7f2}", "a.css"), "a"), false],
  ["svg rect fill am", co(quetMot('<svg><rect fill="#FBF1DF"/></svg>', "a.html"), "a"), true],
  ["svg text fill la chu", co(quetMot('<svg><text fill="#FBF1DF">A</text></svg>', "a.html"), "a"), false],
  ["che do toi nen am", co(quetMot("@media(prefers-color-scheme:dark){.o{background:#FBEAE4}}", "a.css"), "a"), true],
  ["svg text mono nhan", co(quetMot('<svg><text font-family="ui-monospace">Năng lượng</text></svg>', "a.html"), "d"), true],
  ["svg text mono ma du lieu", co(quetMot('<svg><text style="font-family:monospace">SKU-12</text></svg>', "a.html"), "d"), false],
  ["code mono duoc giu", co(quetMot("pre{font-family:monospace}", "a.css"), "d"), false],
  ["dang 1 ·", co(quetMot("<div class=\"t\">1 · Năng lượng</div>", "a.html"), "c"), true],
  ["dang 01 ·", co(quetMot("<span class=\"eyebrow\">01 · Tên</span>", "a.html"), "c"), true],
  ["2026 · khong phai nhan muc", co(quetMot("<p>Cập nhật: 2026 · Áp dụng</p>", "a.html"), "c"), false],
  ["sec-num", co(quetMot('<span class="sec-num">3</span>', "a.html"), "c"), true],
];

let dat = 0, truot = 0;
for (const [ten, ra, mong] of CA) {
  const ok = ra === mong;
  ok ? dat++ : truot++;
  console.log(`  ${ok ? "dat  " : "TRUOT"} ${ten}${ok ? "" : ` -> ${JSON.stringify(ra)}`}`);
}
console.log(`\nKET QUA: ${dat} dat / ${truot} truot`);
process.exit(truot ? 1 : 0);
