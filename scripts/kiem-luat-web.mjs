// Kiểm 5 luật thiết kế web (CEO 06/10/2026 15:52) trên HTML/CSS đã xuất.
// Thoát 0 khi không còn vi phạm a/b/c/d/e. Ca ranh giới (nút tròn chỉ icon,
// chữ italic ngoài h1–h3, màu hồng thương hiệu, màu trạng thái, font-mono
// trong code/pre, thanh giả lập trong khung điện thoại) không tính là lỗi.
// Chạy: node scripts/kiem-luat-web.mjs
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SKIP_DIR = new Set(["node_modules", ".git", "uploads"]);
const NAMED = new Set([
  "ivory", "beige", "cornsilk", "linen", "oldlace", "floralwhite",
  "antiquewhite", "seashell", "lemonchiffon", "papayawhip", "blanchedalmond",
  "bisque", "wheat", "navajowhite", "moccasin", "cream",
]);
// Hồng thương hiệu và nền trạng thái (cảnh báo), không phải nền kem trang.
const ALLOW_HEX = new Set(["f3e8e8", "f3e4e7", "fff4f7", "fbeae4", "fbf1df", "fff5ef"]);
const SKIP_VAR = /^(--ink|--brand|--alert|--warn|--good|--gold|--rose|--pink|--muted|--line|--plum|--serif|--sans)(-|$)/;
const BG_VAR = /--(?:bg|ground|surface|nen|cream\d*|iki-cream|kem|raise|paper|sand|iki-sand|panel|fill|iki-gradient)(?:-|$)/;
const BTN_SEL = /(?:^|[\s,>+~])(?:button\b|a\b|\.btn\b|\.nav-cta\b|\.addbtn\b|\.sp-btn\b|\.cta-sp-chinh\b|\.cta-sp-phu\b)/i;
const ICON_SEL = /menubtn|roundarrow|social|avatar|\.dot\b|\.tick\b|phone-|::?before|::?after|\bclose\b|\.icon\b|\.orb\b|portrait|splitphoto/i;

const hits = [];

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(html|css)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

function hex2rgb(h) {
  let s = h.replace("#", "");
  if (s.length === 3 || s.length === 4) s = [...s.slice(0, 3)].map((c) => c + c).join("");
  s = s.slice(0, 6);
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

function isCreamHex(raw) {
  const n = raw.replace("#", "").toLowerCase();
  const key = n.length >= 6 ? n.slice(0, 6) : [...n.slice(0, 3)].map((c) => c + c).join("");
  if (ALLOW_HEX.has(key)) return false;
  const [r, g, b] = hex2rgb(key);
  if ([r, g, b].some((x) => Number.isNaN(x))) return false;
  if (r === 255 && g === 255 && b === 255) return false;
  if (b > g + 1) return false;
  return Math.min(r, g, b) >= 225 && r >= b + 5 && r >= g;
}

function creamIn(val) {
  if (!val || /data:|base64/i.test(val)) return [];
  const out = [];
  for (const m of val.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
    if (isCreamHex(m[1])) out.push("#" + m[1]);
  }
  for (const m of val.matchAll(/rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/g)) {
    const [r, g, b] = m.slice(1).map(Number);
    if (b > g + 1) continue;
    if (Math.min(r, g, b) >= 225 && r >= b + 5 && r >= g && !(r === 255 && g === 255 && b === 255)) out.push(m[0]);
  }
  for (const w of val.toLowerCase().match(/\b[a-z]+\b/g) || []) {
    if (NAMED.has(w) && w !== "cream") out.push(w);
    // tên màu "cream" chỉ tính khi là giá trị màu, không phải tên biến --cream
  }
  if (/(?:^|[\s:,])cream(?:\s|$)/i.test(val) && !/var\(--/.test(val)) {
    if (/\bcream\b/i.test(val)) out.push("cream");
  }
  return out;
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function rulesOf(css) {
  const res = [];
  const stack = [];
  let buf = 0;
  for (const m of css.matchAll(/[{}]/g)) {
    if (m[0] === "{") {
      stack.push([css.slice(buf, m.index).trim(), m.index + 1]);
      buf = m.index + 1;
    } else if (stack.length) {
      const [sel, st] = stack.pop();
      const body = css.slice(st, m.index);
      if (!body.includes("{") && sel && !sel.startsWith("@")) res.push([sel.split(";").pop().trim(), body]);
      buf = m.index + 1;
    }
  }
  return res;
}

function decls(body) {
  const d = [];
  for (const part of body.split(";")) {
    const i = part.indexOf(":");
    if (i > 0) d.push([part.slice(0, i).trim().toLowerCase(), part.slice(i + 1).trim()]);
  }
  return d;
}

function lineOf(text, idx) {
  return text.slice(0, idx).split("\n").length;
}

function add(code, file, line, ev) {
  hits.push(`${code}\t${path.relative(ROOT, file)}:${line}\t${ev.replace(/\s+/g, " ").slice(0, 160)}`);
}

function expand(val, vars) {
  return val.replace(/var\(\s*(--[\w-]+)\s*\)/g, (full, name) => {
    if (SKIP_VAR.test(name)) return "";
    return vars.get(name) || "";
  });
}

function checkCss(css, file, baseLine = 1) {
  const raw = stripComments(css);
  const vars = new Map();
  const parsed = rulesOf(raw);
  for (const [, body] of parsed) {
    for (const [k, v] of decls(body)) if (k.startsWith("--")) vars.set(k, v);
  }
  for (const [sel, body] of parsed) {
    const off = raw.indexOf(body);
    const line = baseLine + lineOf(raw, Math.max(0, off)) - 1;
    for (const [k, v] of decls(body)) {
      if ((k === "background" || k === "background-color" || k === "background-image" || (k.startsWith("--") && BG_VAR.test(k))) && !SKIP_VAR.test(k)) {
        const colors = creamIn(k.startsWith("--") ? v : `${v} ${expand(v, vars)}`);
        if (colors.length) add("a", file, line, `${sel.slice(0, 60)} ${k}:${colors.join(",")}`);
      }
      if (k === "font-style" && /italic/.test(v) && /(?:^|[\s,>+~])h[1-3]\b/.test(sel) && /\b(em|i)\b/.test(sel)) {
        add("b", file, line, `${sel.slice(0, 80)} font-style:italic`);
      }
      if ((k === "font-family" || k === "font") && /mono|courier|consolas|menlo/i.test(v)) {
        if (!/(?:^|[\s,>+~])(code|pre|kbd|samp)\b|json|sku|van-don|mã đơn/i.test(sel)) {
          add("d", file, line, `${sel.slice(0, 60)} ${k}`);
        }
      }
      if (k === "border-radius" || (k.startsWith("--") && /radius/.test(k))) {
        const nums = [...v.matchAll(/(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]));
        const pill = nums.some((n) => n >= 30) || /\b(?:50|100)%/.test(v) || /\b(?:9999|999|100)px/.test(v);
        if (pill && BTN_SEL.test(sel) && !ICON_SEL.test(sel)) add("e", file, line, `${sel.slice(0, 70)} ${k}:${v.slice(0, 40)}`);
      }
    }
  }
}

function visible(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
}

function checkHtml(html, file) {
  const vis = visible(html);
  for (const m of vis.matchAll(/<(h[1-3])\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    if (/<(em|i)\b/i.test(m[2]) || /font-style\s*:\s*italic/i.test(m[2])) {
      add("b", file, lineOf(html, html.indexOf(m[0])), m[0].replace(/\s+/g, " ").slice(0, 120));
    }
  }
  for (const m of vis.matchAll(/>\s*(0[1-9])(\s*[·./—–\-]\s*([^<]{0,80}))?\s*</g)) {
    const rest = (m[3] || "").trim();
    if (/^HOPE\b/i.test(rest) || /\/20\d{2}/.test(m[0]) || /^0?\d+\s*\/\s*20\d{2}/.test(rest)) continue;
    if (!rest && !/class="(?:num|n|loopnum|eyebrow|sec-num)"/.test(vis.slice(Math.max(0, m.index - 40), m.index))) {
      // số trần chỉ tính khi nằm trong nhãn mục
      if (!/<(span|div|h[1-3]|p|li|a)\b[^>]*class="[^"]*(?:num|n|loopnum|eyebrow)/i.test(vis.slice(Math.max(0, m.index - 80), m.index + 5))) continue;
    }
    if (!rest && /Số công bố|công bố/i.test(vis.slice(Math.max(0, m.index - 80), m.index))) continue;
    add("c", file, lineOf(vis, m.index), m[0].replace(/\s+/g, " ").slice(0, 100));
  }
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    checkCss(m[1], file, lineOf(html, m.index));
  }
  for (const m of vis.matchAll(/\bstyle="([^"]*)"/gi)) {
    checkCss(`x{${m[1]}}`, file, lineOf(html, m.index));
  }
}

const files = walk(ROOT);
for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  if (f.endsWith(".css")) checkCss(text, f, 1);
  else checkHtml(text, f);
}

if (hits.length) {
  console.error(hits.join("\n"));
  console.error(`\n${hits.length} vi phạm luật web (a/b/c/d/e).`);
  process.exit(1);
}
console.log(`0 vi phạm luật web trên ${files.length} file html/css.`);
