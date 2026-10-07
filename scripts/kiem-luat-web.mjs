// Kiểm luật thiết kế web (CEO 06/10/2026, MKT chốt 07/10) trên HTML/CSS đã xuất.
// a: nền ấm-sáng — R≥G≥B, độ sáng HSL > 90%, R−B ≥ 6. Không danh sách miễn.
//    Kể cả biến nền, style inline, fill SVG (nền), và khối chế độ tối.
//    Chữ/viền không tính. #ffffff và xám đều kênh (R−B < 6) không tính.
// b: italic trong h1–h3.
// c: nhãn 01–09 và dạng «N ·» (1–9 không số 0 đầu), kể cả .sec-num.
// d: monospace ngoài code/pre và ngoài mã dữ liệu; kể cả <text> SVG.
// e: nút pill.
// Chạy: node scripts/kiem-luat-web.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = process.cwd();
const SKIP_DIR = new Set(["node_modules", ".git", "uploads"]);
const NAMED = new Set([
  "ivory", "beige", "cornsilk", "linen", "oldlace", "floralwhite",
  "antiquewhite", "seashell", "lemonchiffon", "papayawhip", "blanchedalmond",
  "bisque", "wheat", "navajowhite", "moccasin", "cream",
]);
const SURFACE = /--(?:bg|background|ground|surface|nen|cream\d*|iki-cream|kem|raise|paper|sand|iki-sand|panel|fill|iki-gradient|alert-s|warn-s|brand-tint)(?:-|$)/;
const BTN_SEL = /(?:^|[\s,>+~])(?:button\b|a\b|\.btn\b|\.nav-cta\b|\.addbtn\b|\.sp-btn\b|\.cta-sp-chinh\b|\.cta-sp-phu\b)/i;
const ICON_SEL = /menubtn|roundarrow|social|avatar|\.dot\b|\.tick\b|phone-|::?before|::?after|\bclose\b|\.icon\b|\.orb\b|portrait|splitphoto/i;
const MONO = /mono|courier|consolas|menlo/i;
const CODE_SEL = /(?:^|[\s,>+~])(code|pre|kbd|samp)\b|json|sku|van-don|mã đơn|axis|tick\b|data-code|ma-so|so-lieu/i;
const DARK_CTX = /prefers-color-scheme\s*:\s*dark|data-theme\s*=\s*["']?dark/i;

export function amSang(r, g, b) {
  if ([r, g, b].some((x) => Number.isNaN(x))) return false;
  if (r === 255 && g === 255 && b === 255) return false;
  if (!(r >= g && g >= b)) return false;
  if (r - b < 6) return false;
  const sang = (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255;
  return sang > 0.9;
}

function hex2rgb(h) {
  let s = h.replace("#", "");
  if (s.length === 3 || s.length === 4) s = [...s.slice(0, 3)].map((c) => c + c).join("");
  s = s.slice(0, 6);
  if (s.length < 6) return null;
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

function mauAm(val) {
  if (!val || /data:|base64/i.test(val)) return [];
  const out = [];
  for (const m of val.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
    const rgb = hex2rgb(m[1]);
    if (rgb && amSang(...rgb)) out.push("#" + m[1]);
  }
  for (const m of val.matchAll(/rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/g)) {
    const [r, g, b] = m.slice(1).map(Number);
    if (amSang(r, g, b)) out.push(m[0]);
  }
  for (const w of val.match(/\b[a-zA-Z]+\b/g) || []) {
    if (NAMED.has(w.toLowerCase())) out.push(w.toLowerCase());
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
      const ctx = stack.map((s) => s[0]).join(" ");
      if (!body.includes("{") && sel && !sel.startsWith("@")) {
        res.push([sel.split(";").pop().trim(), body, ctx]);
      }
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

function expand(val, vars, depth = 0) {
  if (!val || depth > 5) return val || "";
  return val.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/g, (full, name, fallback) => {
    if (vars.has(name)) return expand(vars.get(name), vars, depth + 1);
    return fallback ? expand(fallback.trim(), vars, depth + 1) : "";
  });
}

function laMaDuLieu(s) {
  const t = s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (!t) return true;
  return !/(?:[A-Za-zÀ-ỹ]){4,}/.test(t);
}

export function quetMot(text, file = "x.html") {
  const hits = [];
  const add = (code, line, ev) => {
    hits.push(`${code}\t${file}:${line}\t${ev.replace(/\s+/g, " ").slice(0, 160)}`);
  };

  function checkCss(css, baseLine = 1) {
    const raw = stripComments(css);
    const parsed = rulesOf(raw);
    const sangMap = new Map();
    const toiMap = new Map();
    for (const [, body, ctx] of parsed) {
      const map = DARK_CTX.test(ctx) ? toiMap : sangMap;
      for (const [k, v] of decls(body)) if (k.startsWith("--")) map.set(k, v);
    }
    for (const [sel, body, ctx] of parsed) {
      const off = raw.indexOf(body);
      const line = baseLine + lineOf(raw, Math.max(0, off)) - 1;
      const toi = DARK_CTX.test(ctx);
      const vars = toi ? new Map([...sangMap, ...toiMap]) : sangMap;
      for (const [k, v] of decls(body)) {
        const nen = k === "background" || k === "background-color" || k === "background-image" || k === "stop-color"
          || (k === "fill" && !/(?:^|[\s,>+~])text\b/i.test(sel))
          || (k.startsWith("--") && SURFACE.test(k));
        if (nen) {
          const resolved = k.startsWith("--") ? v : expand(v, vars);
          const colors = mauAm(resolved);
          if (colors.length) add("a", line, `${sel.slice(0, 60)} ${k}:${colors.join(",")}`);
          else if (!toi && !k.startsWith("--")) {
            const toiResolved = expand(v, new Map([...sangMap, ...toiMap]));
            const toiMau = mauAm(toiResolved).filter((c) => !mauAm(resolved).includes(c));
            if (toiMau.length) add("a", line, `${sel.slice(0, 50)} ${k} che-do-toi:${toiMau.join(",")}`);
          }
        }
        if (k === "font-style" && /italic/.test(v) && /(?:^|[\s,>+~])h[1-3]\b/.test(sel) && /\b(em|i)\b/.test(sel)) {
          add("b", line, `${sel.slice(0, 80)} font-style:italic`);
        }
        if ((k === "font-family" || k === "font") && MONO.test(v)) {
          if (!CODE_SEL.test(sel)) add("d", line, `${sel.slice(0, 60)} ${k}`);
        }
        if (k === "border-radius" || (k.startsWith("--") && /radius/.test(k))) {
          const nums = [...v.matchAll(/(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]));
          const pill = nums.some((n) => n >= 30) || /\b(?:50|100)%/.test(v) || /\b(?:9999|999|100)px/.test(v);
          if (pill && BTN_SEL.test(sel) && !ICON_SEL.test(sel)) add("e", line, `${sel.slice(0, 70)} ${k}:${v.slice(0, 40)}`);
        }
      }
    }
  }

  function visible(html) {
    return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  }

  function checkHtml(html) {
    const vis = visible(html);
    for (const m of vis.matchAll(/<(h[1-3])\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
      if (/<(em|i)\b/i.test(m[2]) || /font-style\s*:\s*italic/i.test(m[2])) {
        add("b", lineOf(html, html.indexOf(m[0])), m[0].replace(/\s+/g, " ").slice(0, 120));
      }
    }
    for (const m of vis.matchAll(/>\s*(0[1-9])(\s*[·./—–\-]\s*([^<]{0,80}))?\s*</g)) {
      const rest = (m[3] || "").trim();
      if (/^HOPE\b/i.test(rest) || /\/20\d{2}/.test(m[0]) || /^0?\d+\s*\/\s*20\d{2}/.test(rest)) continue;
      if (!rest && !/class="(?:num|n|loopnum|eyebrow|sec-num)"/.test(vis.slice(Math.max(0, m.index - 40), m.index))) {
        if (!/<(span|div|h[1-3]|p|li|a)\b[^>]*class="[^"]*(?:num|n|loopnum|eyebrow|sec-num)/i.test(vis.slice(Math.max(0, m.index - 80), m.index + 5))) continue;
      }
      if (!rest && /Số công bố|công bố/i.test(vis.slice(Math.max(0, m.index - 80), m.index))) continue;
      add("c", lineOf(vis, m.index), m[0].replace(/\s+/g, " ").slice(0, 100));
    }
    for (const m of vis.matchAll(/>\s*([1-9])\s*·/g)) {
      add("c", lineOf(vis, m.index), m[0].replace(/\s+/g, " ").slice(0, 80));
    }
    for (const m of vis.matchAll(/<([a-z0-9]+)\b[^>]*\bclass="[^"]*\bsec-num\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/gi)) {
      const noi = m[2].replace(/<[^>]+>/g, "");
      if (/\b0?[1-9]\b/.test(noi)) add("c", lineOf(vis, m.index), `sec-num ${noi.trim().slice(0, 40)}`);
    }
    for (const m of html.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi)) {
      const attrs = m[1];
      const style = (attrs.match(/\bstyle\s*=\s*"([^"]*)"/i) || [])[1] || "";
      const ff = (attrs.match(/\bfont-family\s*=\s*"([^"]*)"/i) || [])[1] || "";
      if (MONO.test(`${style} ${ff}`) && !laMaDuLieu(m[2])) {
        add("d", lineOf(html, m.index), `svg text mono ${m[2].replace(/<[^>]+>/g, "").trim().slice(0, 40)}`);
      }
    }
    for (const m of html.matchAll(/<(rect|circle|ellipse|path|polygon|polyline|g)\b([^>]*?)>/gi)) {
      const fill = (m[2].match(/\bfill\s*=\s*["']([^"']+)["']/i) || [])[1];
      if (!fill) continue;
      const colors = mauAm(fill);
      if (colors.length) add("a", lineOf(html, m.index), `svg fill ${colors.join(",")}`);
    }
    for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
      checkCss(m[1], lineOf(html, m.index));
    }
    for (const m of vis.matchAll(/\bstyle="([^"]*)"/gi)) {
      let css = m[1];
      const before = vis.slice(Math.max(0, m.index - 120), m.index);
      if (/<text\b[^>]*$/.test(before) && MONO.test(css)) {
        const body = (vis.slice(m.index, m.index + 240).match(/>([\s\S]*?)<\/text>/) || [])[1] || "";
        if (laMaDuLieu(body)) css = css.replace(/font-family\s*:[^;]*/gi, "");
      }
      checkCss(`x{${css}}`, lineOf(html, m.index));
    }
  }

  if (file.endsWith(".css")) checkCss(text, 1);
  else checkHtml(text);
  return hits;
}

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(html|css)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

const laCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (laCli) {
  const files = walk(ROOT);
  const hits = [];
  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    const rel = path.relative(ROOT, f);
    for (const h of quetMot(text, rel)) hits.push(h);
  }
  if (hits.length) {
    console.error(hits.join("\n"));
    console.error(`\n${hits.length} vi phạm luật web (a/b/c/d/e).`);
    process.exit(1);
  }
  console.log(`0 vi phạm luật web trên ${files.length} file html/css.`);
}
