// Bai kiem cho inline() + nhan chuyen muc. Chay: node scripts/build-article-inline.test.mjs
// Thoat 1 neu co ca truot. Nap module that md-inline.mjs (KHONG nap build-article.mjs vi file do ghi file khi import).
import { inline, nhanChuyenMuc } from "./md-inline.mjs";

const CA = [
  // [ten, ra, mong]
  ["href & ma hoa 1 lan", inline("[x](https://a.vn/p?u=1&v=2)"), '<a href="https://a.vn/p?u=1&amp;v=2">x</a>'],
  ["khong co &amp;amp;", inline("[x](https://a.vn/p?u=1&v=2)").includes("&amp;amp;"), false],
  ["link noi bo giu nguyen", inline("[bai](dam-thuc-vat.html)"), '<a href="dam-thuc-vat.html">bai</a>'],
  ["chu thuong van escape", inline("a < b & c"), "a &lt; b &amp; c"],
  ["zalo tran -> link, dau cham ngoai link", inline("Nhắn zalo.me/0987931551."), 'Nhắn <a href="https://zalo.me/0987931551">zalo.me/0987931551</a>.'],
  ["zalo dau dong", inline("zalo.me/123 nhé"), '<a href="https://zalo.me/123">zalo.me/123</a> nhé'],
  ["zalo trong [..](..) khong long link", inline("[zalo.me/123](https://zalo.me/123)"), '<a href="https://zalo.me/123">zalo.me/123</a>'],
  ["zalo URL day du khong dung", inline("https://zalo.me/123"), "https://zalo.me/123"],
  ["2 zalo cung dong", inline("zalo.me/1 hoặc zalo.me/2"), '<a href="https://zalo.me/1">zalo.me/1</a> hoặc <a href="https://zalo.me/2">zalo.me/2</a>'],
  ["dam / nghieng giu nhu cu", inline("**a** va *b*"), "<strong>a</strong> va <em>b</em>"],
  ["nhan dinh-duong", nhanChuyenMuc("dinh-duong"), "Dinh dưỡng"],
  ["nhan thuc-pham", nhanChuyenMuc("thuc-pham"), "Thực phẩm"],
  ["nhan thoi-quen", nhanChuyenMuc("thoi-quen"), "Thói quen"],
  ["nhan dong-y", nhanChuyenMuc("dong-y"), "Đông y"],
  ["nhan cam-nang-suc-khoe", nhanChuyenMuc("cam-nang-suc-khoe"), "Cẩm nang sức khoẻ"],
  ["nhan bao-cao", nhanChuyenMuc("bao-cao"), "Báo cáo"],
  ["slug la giu fallback cu", nhanChuyenMuc("la-lam"), "la-lam"],
  ["khong co category -> undefined (roi xuong mac dinh)", nhanChuyenMuc(undefined), undefined],
];

let dat = 0, truot = 0;
for (const [ten, ra, mong] of CA) {
  const ok = ra === mong;
  ok ? dat++ : truot++;
  console.log(`  ${ok ? "dat  " : "TRUOT"} ${ten}${ok ? "" : ` -> ${JSON.stringify(ra)}`}`);
}
console.log(`\nKET QUA: ${dat} dat / ${truot} truot`);
process.exit(truot ? 1 : 0);
