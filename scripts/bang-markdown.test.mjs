// Bai kiem cho bang markdown. Chay: node scripts/bang-markdown.test.mjs
// Thoat 1 neu co ca truot. Nap module that (KHONG nap build-article.mjs vi file do ghi file khi import).
import { laDongBang, laDongPhanCach, dungBang, CSS_BANG } from "./bang-markdown.mjs";

// inline gia lap: escape du 5 ky tu nhu yeu cau
const inline = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const B = (s) => dungBang(s.split("\n"), inline);

const bangDam = B("| Thực phẩm (100 g phần ăn được) | Đạm (g) |\n| --- | ---: |\n| Đậu nành (đậu tương) hạt khô | 34,0 |");
const bangCan = B("| A | B | C |\n| :--- | :---: | ---: |\n| 1 | 2 | 3 |");
const bangEsc = B("| Ten |\n| --- |\n| <script>alert(1)</script> & \"x\" 'y' |");
const bangPipe = B("| Bieu thuc |\n| --- |\n| a \\| b |");
const bangLech = B("| A | B |\n| --- | --- |\n| chi 1 |\n| 1 | 2 | 3 |");

const CA = [
  ["laDongBang '| a |'", laDongBang("| a |"), true],
  ["laDongBang '  | a |'", laDongBang("  | a |"), true],
  ["laDongBang 'a | b'", laDongBang("a | b"), false],
  ["laDongPhanCach '| --- | :---: | ---: |'", laDongPhanCach("| --- | :---: | ---: |"), true],
  ["laDongPhanCach '| a | b |'", laDongPhanCach("| a | b |"), false],
  ["laDongPhanCach undefined", laDongPhanCach(undefined), false],
  ["bang dam: co khung cuon", bangDam?.startsWith('<div class="post-table-wrap" role="region" aria-label="Bảng" tabindex="0"><table class="post-table">'), true],
  ["bang dam: thead/th", bangDam?.includes('<thead><tr><th>Thực phẩm (100 g phần ăn được)</th><th style="text-align:right">Đạm (g)</th></tr></thead>'), true],
  ["bang dam: tbody/td can phai cot 2", bangDam?.includes('<tbody><tr><td>Đậu nành (đậu tương) hạt khô</td><td style="text-align:right">34,0</td></tr></tbody>'), true],
  ["bang dam: dong </table></div>", bangDam?.endsWith("</table></div>"), true],
  ["can trai/giua/phai", bangCan?.includes('<td style="text-align:left">1</td><td style="text-align:center">2</td><td style="text-align:right">3</td>'), true],
  ["escape <script>", bangEsc?.includes("&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;x&quot; &#39;y&#39;"), true],
  ["khong con <script> tho", bangEsc?.includes("<script>"), false],
  ["\\| la ky tu | trong o", bangPipe?.includes("<td>a | b</td>"), true],
  ["o thieu bu o rong", bangLech?.includes("<tr><td>chi 1</td><td></td></tr>"), true],
  ["o thua bi bo", bangLech?.includes("<tr><td>1</td><td>2</td></tr>") && !bangLech.includes(">3<"), true],
  ["thieu dong phan cach -> null", B("| A | B |\n| 1 | 2 |"), null],
  ["mot dong -> null", B("| A | B |"), null],
  ["so cot phan cach lech -> null", B("| A | B |\n| --- |\n| 1 | 2 |"), null],
  ["CSS khong monospace", /monospace/i.test(CSS_BANG), false],
  ["CSS chi nen #FFFFFF", (CSS_BANG.match(/background(-color)?:\s*([^;}]+)/g) || []).every((m) => /#FFFFFF$/i.test(m.trim())), true],
  ["CSS co 1px solid #E5E5E5", CSS_BANG.includes("1px solid #E5E5E5"), true],
  ["CSS khong bo tron lon", /border-radius:\s*(?!0[;}\s])/.test(CSS_BANG), false],
];

let dat = 0, truot = 0;
for (const [ten, ra, mong] of CA) {
  const ok = ra === mong;
  ok ? dat++ : truot++;
  console.log(`  ${ok ? "dat  " : "TRUOT"} ${ten}${ok ? "" : ` -> ${JSON.stringify(ra)}`}`);
}
console.log(`\nKET QUA: ${dat} dat / ${truot} truot`);
process.exit(truot ? 1 : 0);
