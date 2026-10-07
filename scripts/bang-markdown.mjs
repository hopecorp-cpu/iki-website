// Bảng markdown (| a | b |) → <table> HTML cuộn ngang trên điện thoại. Dùng trong build-article.mjs.
// Luật web CEO 06/10/2026: nền chỉ #FFFFFF, không monospace, không bo tròn, viền 1px #E5E5E5.

export const laDongBang = (line) => /^\s*\|/.test(String(line || ""));

export const laDongPhanCach = (line) =>
  /^\s*\|(\s*:?-+:?\s*\|)+\s*$/.test(String(line || "").trim().replace(/([^|])$/, "$1|"));

// Tách ô: bỏ | đầu/cuối, "\|" giữ là ký tự | trong ô.
function tachO(line) {
  let s = String(line).trim().replace(/\\\|/g, "\u0000");
  s = s.replace(/^\|/, "").replace(/\|$/, "");
  return s.split("|").map((o) => o.replace(/\u0000/g, "|").trim());
}

function canLe(o) {
  const trai = o.startsWith(":"), phai = o.endsWith(":");
  if (trai && phai) return "center";
  if (phai) return "right";
  if (trai) return "left";
  return "";
}

export function dungBang(lines, inline) {
  if (!lines || lines.length < 2 || !laDongBang(lines[0]) || !laDongPhanCach(lines[1])) return null;
  const tieuDe = tachO(lines[0]);
  const can = tachO(lines[1]).map(canLe);
  if (can.length !== tieuDe.length) return null;
  const n = tieuDe.length;
  const st = (c) => (can[c] ? ` style="text-align:${can[c]}"` : "");
  const hang = (o, the) => {
    const cells = [];
    for (let c = 0; c < n; c++) cells.push(`<${the}${st(c)}>${inline(o[c] ?? "")}</${the}>`);
    return `<tr>${cells.join("")}</tr>`;
  };
  const than = lines.slice(2).map((l) => hang(tachO(l), "td"));
  return `<div class="post-table-wrap" role="region" aria-label="Bảng" tabindex="0"><table class="post-table">` +
    `<thead>${hang(tieuDe, "th")}</thead>` +
    (than.length ? `<tbody>${than.join("")}</tbody>` : "") +
    `</table></div>`;
}

// Viền ngoài do khung bọc lo; ô cạnh mép bỏ viền phía mép để chỉ còn 1px.
export const CSS_BANG = `
    .post-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:1.4rem 0;background:#FFFFFF;border:1px solid #E5E5E5;border-radius:0}
    .post-table{width:100%;border-collapse:collapse;background:#FFFFFF;font-family:inherit;font-size:1rem;line-height:1.5}
    .post-table th,.post-table td{border:1px solid #E5E5E5;padding:10px 14px;text-align:left;vertical-align:top}
    .post-table th{font-weight:700;background:#FFFFFF;color:#101828}
    .post-table tr>:first-child{border-left:0} .post-table tr>:last-child{border-right:0}
    .post-table thead tr:first-child>*{border-top:0} .post-table tr:last-child>td{border-bottom:0}
    .post-table thead:last-child tr:last-child>th{border-bottom:0}
    .post-table [style*="text-align:right"]{white-space:nowrap}
    @media(max-width:640px){.post-table th,.post-table td{min-width:8em}}`;
