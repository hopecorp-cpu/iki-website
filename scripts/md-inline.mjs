// Inline markdown → html + nhãn chuyên mục, tách khỏi build-article.mjs để test được (file đó ghi file khi import).

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// url đã qua esc() cùng cả dòng → chỉ còn thiếu dấu nháy kép; esc lần nữa sẽ ra &amp;amp;
const hrefDaEsc = (url) => url.replace(/"/g, "&quot;");

// --- inline markdown → html (text đã escape trước) ---
export function inline(t) {
  let s = esc(t);
  s = s.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, (m, txt, url) => `<a href="${hrefDaEsc(url)}">${txt}</a>`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, url) => `<a href="${hrefDaEsc(url)}">${txt}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  // chữ trần zalo.me/<số> → link; bỏ qua đoạn đã nằm trong thẻ a và URL đầy đủ (https://zalo.me/...)
  s = s.split(/(<a\b[^>]*>[\s\S]*?<\/a>)/).map((p, i) => (i % 2 ? p
    : p.replace(/(?<![\w./-])zalo\.me\/(\d+)/g, '<a href="https://zalo.me/$1">zalo.me/$1</a>'))).join("");
  return s;
}

// Nhãn có dấu cho fm.category khi bài thiếu category_label (tham khảo tên hub trong content-plan.json).
const NHAN_CHUYEN_MUC = {
  "dinh-duong": "Dinh dưỡng",
  "thuc-pham": "Thực phẩm",
  "thoi-quen": "Thói quen",
  "dong-y": "Đông y",
  "lo-trinh": "Lộ trình",
  "cam-nang-suc-khoe": "Cẩm nang sức khoẻ",
  "cam-nang": "Cẩm nang",
  "bao-cao": "Báo cáo",
};
export const nhanChuyenMuc = (slug) => NHAN_CHUYEN_MUC[slug] || slug;
