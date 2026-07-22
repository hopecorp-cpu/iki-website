// Sinh ảnh hero (Pollinations free) + đóng logo IKI + HOPE lên mọi ảnh.
// sharp lấy từ ops-hub node_modules qua createRequire. Chạy:
//   NODE_PATH=... node scripts/gen-hero-images.mjs test|all|<slug...>
import { createRequire } from "module";
import { readFileSync, writeFileSync, existsSync } from "fs";
const require = createRequire("/Users/NguyenHung/Downloads/HOPE CORP/hope-ops-hub/");
const sharp = require("sharp");

const BASE = "/Users/NguyenHung/Documents/Claude/Projects/HOPE CORP/website";
const W = 1200, H = 675;
const ICON_B64 = readFileSync(`${BASE}/assets/logo/iki-mark.png`).toString("base64");

// Lockup: pill trắng góc dưới-phải, icon IKI + chữ "by HOPE CORP"
function overlaySvg() {
  const pillW = 226, pillH = 62, m = 26;
  const px = W - pillW - m, py = H - pillH - m;
  const iconSz = 42, iconX = px + 15, iconY = py + (pillH - iconSz) / 2;
  const txtX = iconX + iconSz + 12, txtY = py + pillH / 2;
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <g>
    <rect x="${px}" y="${py}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="#ffffff" fill-opacity="0.93"/>
    <image x="${iconX}" y="${iconY}" width="${iconSz}" height="${iconSz}" xlink:href="data:image/png;base64,${ICON_B64}"/>
    <text x="${txtX}" y="${txtY - 5}" font-family="Manrope, Arial, sans-serif" font-size="19" font-weight="800" fill="#16241F" letter-spacing="0.5">IKI</text>
    <text x="${txtX}" y="${txtY + 15}" font-family="Manrope, Arial, sans-serif" font-size="11.5" font-weight="700" fill="#2E8975" letter-spacing="1.2">by HOPE CORP</text>
  </g>
</svg>`);
}

async function fetchImg(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 45000);
      const r = await fetch(url, { signal: ctl.signal });
      clearTimeout(t);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 3000) throw new Error("ảnh quá nhỏ " + buf.length);
      return buf;
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((s) => setTimeout(s, 2500 * (i + 1)));
    }
  }
}

const seedOf = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 100000; };

function heroPathOf(slug) {
  const f = `${BASE}/blog-drafts/${slug}.md`;
  if (!existsSync(f)) return null;
  const m = readFileSync(f, "utf8").match(/^---json\s*\n([\s\S]*?)\n---/);
  if (!m) return null;
  try { const o = JSON.parse(m[1]); return o.hero_local ? `${BASE}/${o.hero_local}` : null; } catch { return null; }
}

async function makeHero(slug, prompt) {
  const dest = prompt ? `${BASE}/assets/blog/${slug}-hero.jpg` : (heroPathOf(slug) || `${BASE}/assets/blog/${slug}-hero.jpg`);
  let base;
  if (prompt) {
    const full = `${prompt}, editorial food and lifestyle photography, soft natural light, wooden surfaces, calm minimal wellness aesthetic, no people, no faces, no hands, no text, no words, no logo, high detail`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=${W}&height=${H}&nologo=true&seed=${seedOf(slug)}`;
    base = await fetchImg(url);
  } else {
    if (!existsSync(dest)) { console.log("  SKIP (không có ảnh gốc):", slug); return false; }
    base = readFileSync(dest);
  }
  const out = await sharp(base).resize(W, H, { fit: "cover", position: "attention" })
    .composite([{ input: overlaySvg(), top: 0, left: 0 }])
    .jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  writeFileSync(dest, out);
  console.log("  OK", (out.length / 1024).toFixed(0) + "KB", slug, prompt ? "(generate)" : "(relogo)");
  return true;
}

// Đảm bảo frontmatter có hero_local + hero_alt (cho bài mới)
function ensureHero(slug, alt) {
  const f = `${BASE}/blog-drafts/${slug}.md`;
  if (!existsSync(f)) return;
  const raw = readFileSync(f, "utf8");
  const m = raw.match(/^---json\s*\n([\s\S]*?)\n---/);
  if (!m) return;
  let obj;
  try { obj = JSON.parse(m[1]); } catch { console.log("  ! JSON lỗi, bỏ hero_local:", slug); return; }
  if (obj.hero_local) return;
  const ordered = {};
  for (const k of Object.keys(obj)) {
    ordered[k] = obj[k];
    if (k === "author") { ordered.hero_local = `assets/blog/${slug}-hero.jpg`; ordered.hero_alt = alt; }
  }
  if (!ordered.hero_local) { ordered.hero_local = `assets/blog/${slug}-hero.jpg`; ordered.hero_alt = alt; }
  const rebuilt = raw.replace(m[0], `---json\n${JSON.stringify(ordered, null, 2)}\n---`);
  writeFileSync(f, rebuilt, "utf8");
  console.log("  + hero_local:", slug);
}

// Bài mới cần generate {slug: [prompt, alt]}
const NEW = {
  "day-bung-kho-tieu-sau-an": ["fresh ginger tea, sliced ginger and green vegetables, warm cozy still life", "Trà gừng ấm và rau xanh"],
  "thuc-uong-am-tra-thao-moc": ["herbal tea in a ceramic cup with dried herbs and steam, warm morning", "Tách trà thảo mộc ấm"],
  "kho-ngu-tran-troc-nep-buoi-toi": ["calm bedside nightstand with a warm lamp and a cup of herbal tea at night, serene", "Góc thư giãn buổi tối trước khi ngủ"],
  "hay-met-ue-oai-giua-buoi": ["fresh colorful healthy breakfast bowl with fruit and oats, bright morning energy", "Bữa sáng đủ chất cho năng lượng"],
  "an-gi-cho-nang-luong-ben": ["balanced meal prep with colorful vegetables, grains and legumes in bowls", "Bữa ăn cân bằng giữ năng lượng"],
  "dam-thuc-vat-va-dong-vat": ["plant based protein foods, tofu beans lentils nuts on a wooden board", "Nguồn đạm thực vật đa dạng"],
  "cham-da-tu-ben-trong": ["fresh fruits vegetables water and green tea, clean glowing skin nutrition still life", "Dinh dưỡng cho làn da khoẻ"],
  "toc-yeu-rung-dinh-duong": ["nuts seeds eggs and leafy greens on a table, hair health nutrition", "Thực phẩm dinh dưỡng cho mái tóc"],
  "kinh-nghiem-dan-gian-cham-soc": ["vietnamese folk remedy ingredients, ginger lemongrass turmeric honey and lemon, rustic", "Gia vị dân gian Việt: gừng sả nghệ mật ong"],
  "giu-tinh-than-can-bang": ["serene minimal meditation corner with a plant and a cup of tea, soft calm light", "Không gian tĩnh lặng giữ tinh thần cân bằng"],
  "thu-gian-can-bang-hoi-tho": ["peaceful still life with a candle and a green plant, calm breathing minimal", "Thư giãn và cân bằng hơi thở"],
  "duong-va-do-che-bien-san": ["whole natural foods next to sugar cubes and processed snacks, mindful eating comparison", "Ăn uống điều độ với đường và đồ chế biến sẵn"],
  "vi-sao-chon-dam-thuc-vat": ["plant protein foods with a scoop of protein powder, soy milk, beans and nuts, clean still life", "Chọn nguồn đạm thực vật"],
  "tra-thao-moc-tue-minh": ["warm herbal tea cup with dried medicinal herbs and green leaves, cozy still life", "Trà thảo mộc uống ấm mỗi ngày"],
  "tra-thanh-huong-thu-gian": ["evening herbal tea with osmanthus flowers beside a warm lamp, relaxing still life", "Thức uống thảo mộc thư giãn buổi tối"],
  "app-iki-ca-nhan-hoa": ["smartphone on a wooden desk beside a cup of tea and a small plant, calm wellness lifestyle, no faces", "Chăm sóc sức khoẻ cá nhân hoá cùng App IKI"],
};

// 18 bài cũ chỉ đóng logo lên ảnh có sẵn
const EXISTING = ["5-the-tang-theo-dong-y","8-nhom-thuc-pham-lanh-manh","an-chay-du-chat-can-bang","an-sang-tran-nang-luong","an-theo-mua-va-the-tang","cac-loai-hat-dinh-duong","gia-vi-viet-gung-nghe-sa","giac-ngu-chat-luong","lo-trinh-cham-soc-suc-khoe-nguoi-moi-bat-dau","lo-trinh-nguoi-cao-tuoi","lo-trinh-nguoi-tre","lo-trinh-nguoi-trung-nien","minh-triet-an-uong-am-duong","qua-bo-gia-tri-va-cach-an","rau-la-xanh-moi-ngay","thoi-quen-buoi-sang","uong-nuoc-dung-cach-moi-ngay","van-dong-nhe-moi-ngay"];

const mode = process.argv[2] || "test";
let jobs = [];
if (mode === "test") jobs = [["thuc-uong-am-tra-thao-moc", true], ["an-sang-tran-nang-luong", false]];
else if (mode === "new") jobs = Object.keys(NEW).map((s) => [s, true]);
else if (mode === "existing") jobs = EXISTING.map((s) => [s, false]);
else if (mode === "all") jobs = [...Object.keys(NEW).map((s) => [s, true]), ...EXISTING.map((s) => [s, false])];
else jobs = process.argv.slice(2).map((s) => [s, !!NEW[s]]);

let ok = 0, fail = 0;
for (const [slug, gen] of jobs) {
  try {
    const done = await makeHero(slug, gen ? NEW[slug][0] : null);
    if (done) { ok++; if (gen) ensureHero(slug, NEW[slug][1]); }
  } catch (e) { console.log("  FAIL", slug, "-", e.message); fail++; }
}
console.log(`\n=== xong: ${ok} ok, ${fail} fail ===`);
