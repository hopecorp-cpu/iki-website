// Bai kiem cho cua kiem form. Chay: node scripts/kiem-form.test.mjs
// Thoat 1 neu co ca truot. Them o nhap moi thi THEM CA vao day.
// Nap chinh file that roi chay ca thu, khong chep lai logic.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const src = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "kiem-form.js"), "utf8");

// Gia lap DOM toi thieu de file nap duoc
const noop = () => {};
const doc = { addEventListener: noop, querySelectorAll: () => [], readyState: "complete", documentElement: {} };
const win = {};
const fn = new Function("document", "window", "MutationObserver", src + "\nreturn window.KiemForm;");
const K = fn(doc, win, undefined);

const CA_SDT = [
  // [dau vao, mong doi, ly do]
  ["0987654321", true,  "10 so, bat dau 0"],
  ["0912345678", true,  "10 so, bat dau 0"],
  ["098 765 4321", true, "co khoang trang van nhan"],
  ["098.765.4321", true, "co dau cham van nhan"],
  ["+84987654321", true, "kieu quoc te +84 tu doi ve 0"],
  ["84987654321", true,  "kieu 84 tu doi ve 0"],
  ["987654321", false,  "khong bat dau bang 0"],
  ["1987654321", false, "bat dau bang 1"],
  ["098765432", false,  "chi 9 so"],
  ["09876543210", false,"11 so"],
  ["", false,           "de trong"],
  ["abcdefghij", false, "toan chu"],
  ["0000000000", true,  "dung dinh dang tuy so la lung — luat chi yeu cau 10 so bat dau 0"],
];

const CA_EMAIL = [
  ["ten@gmail.com", true, "thuong"],
  ["ten.ho@cong-ty.com.vn", true, "co dau cham va gach ngang"],
  ["a+b@gmail.com", true, "co dau cong"],
  ["TEN@GMAIL.COM", true, "chu hoa"],
  ["ten@gmail", false, "thieu duoi ten mien"],
  ["ten@@gmail.com", false, "hai dau @"],
  ["ten @gmail.com", false, "co khoang trang"],
  ["@gmail.com", false, "thieu phan truoc @"],
  ["ten@.com", false, "ten mien bat dau bang dau cham"],
  ["ten@gmail..com", false, "hai dau cham lien nhau"],
  ["ten@gmail.c", false, "duoi chi 1 chu cai"],
  ["ten@-gmail.com", false, "ten mien bat dau bang gach ngang"],
  ["", false, "de trong"],
];

let dat = 0, truot = 0;
console.log("=== SO DIEN THOAI: phai 10 so, bat dau 0 ===");
for (const [v, mong, ly] of CA_SDT) {
  const ra = K.sdtHopLe(v);
  const ok = ra === mong;
  ok ? dat++ : truot++;
  console.log(`  ${ok ? "dat  " : "TRUOT"} ${JSON.stringify(v).padEnd(16)} -> ${String(ra).padEnd(5)} (${ly})`);
}
console.log("\n=== EMAIL ===");
for (const [v, mong, ly] of CA_EMAIL) {
  const ra = K.emailHopLe(v);
  const ok = ra === mong;
  ok ? dat++ : truot++;
  console.log(`  ${ok ? "dat  " : "TRUOT"} ${JSON.stringify(v).padEnd(22)} -> ${String(ra).padEnd(5)} (${ly})`);
}
console.log(`\nKET QUA: ${dat} dat / ${truot} truot`);
process.exit(truot ? 1 : 0);
