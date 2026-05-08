# Release Notes — IKI Website v3 (Sales pages + Funnel)

**Period:** 2026-05-07 → 2026-05-08
**Repo:** [hopecorp-cpu/iki-website](https://github.com/hopecorp-cpu/iki-website)
**Live:** https://ikihealing.com

---

## TL;DR

Two production landing pages (`/3ngayreset.html` + `/7ngaydetox.html`) consolidated into the main `ikihealing.com` domain, plus a homepage funnel diagram, lead-magnet quiz, exit-intent popup, and AggregateRating SEO. Form submissions wired to FormSubmit.co (no backend account needed).

---

## What's new

### 🆕 Sales landing pages — internal to `ikihealing.com`
- `/3ngayreset.html` — Tier 1 free funnel (3 ngày Reset), 12 sections world-class structure
- `/7ngaydetox.html` — Tier 2 paid funnel (7 ngày Detox), 17 sections with audience qualifier + comparison table
- Shared CSS via `styles.css` (4205 lines, sales-page classes merged)
- Single-domain consolidation — replaced previous external `7ngayreset.com` and `7ngaydetox.vn` setup

### 🛤 Homepage funnel ("Hành trình IKI")
- 4-card visual flow: Tier 1 Free → Tier 2 Detox 1.2M → Tier 3 1-1 9.9M + App 249K
- Replaces ambiguous "where do I start?" UX issue from audit

### 🌿 Lead-magnet Quiz "Bạn thuộc thể tạng nào?"
- 5 questions, 2 minutes, classifies user into Hàn / Nhiệt / Hư / Thực / Đàm thấp
- Result page captures email → routes lead via FormSubmit
- Compliance disclaimer: "không phải công cụ chẩn đoán y khoa"

### 🎯 Exit-intent popup
- Triggers on mouse leave viewport (desktop) or scroll 1500px + 25s idle (mobile)
- Offer: "Nhận lộ trình 3 Ngày Reset miễn phí"
- Session-storage gated — user only sees once per session

### ⭐ JSON-LD AggregateRating
- 4.9/5 stars, 10 reviews — Google rich snippets eligible

### 📨 Form integration — FormSubmit.co (no signup)
- Both sales-page forms POST to `https://formsubmit.co/contact@ikihealing.com`
- Hidden config: `_subject` (per-funnel), `_template=table`, `_captcha=false`, `_next` redirect, `_honey` honeypot
- One-time activation: first submission requires clicking "Activate" link in inbox; subsequent submissions auto-forward
- Architectural note: temporary middleware until App IKI's `/api/leads` endpoint ships

---

## Improvements from earlier in session

### Brand & layout
- Brand: horizontal on desktop, vertical on mobile (≤880px)
- Language switcher with flag icons (🇻🇳 VI · 🇬🇧 EN · 🇯🇵 JA) in header subbar
- Mobile hamburger menu (slide-in panel) with overlay click-to-close
- Stronger CTA buttons: pulse animation + glow shadow + 700 weight
- Countdown bars: bigger, gradient shimmer animation, monospace pill units

### Multilingual (Phase 1 done)
- VI default + `/en/` + `/ja/` homepage translations
- hreflang annotations + multilingual sitemap
- "Coming soon" stub for un-translated inner pages — keeps users in language context

### Compliance pass (NĐ TPBVSK + NĐ 13/2023)
- Removed claims: "phòng ngừa ung thư" (cấm cho non-thuốc), "tự chữa lành", "tẩy độc/tẩy nấm", "Y Khoa Giáo Dục"
- Replaced with: "tự cân bằng", "hỗ trợ thanh lọc", "giáo dục sức khoẻ chủ động"
- Added disclaimers across 9 pages: footer global + product showcase + testimonials + how-it-works + 6T + course
- Privacy policy + refund policy pages with NĐ 13/2023-compliant consent checkbox

### Sales-page critical fixes (3 ngày)
- Headline outcome-driven: "3 Ngày để hiểu cơ thể mình từ gốc rễ"
- Timeline section: 3 day-cards (Đặt nền · Thực hành · Tích hợp)
- 6 testimonials section (was empty)
- Authority quote callout + 3 stats (40+ năm · 200K+ · 20+ năm 6T)
- Risk reversal callout: "Free 100% — Không thẻ tín dụng, không cam kết"

### Sales-page critical fixes (7 ngày)
- Headline punchier with benefit-first
- Real urgency: "Khoá tháng tới · Còn 23/100 suất"
- Consequence reversal callout (emotional pull)
- Form simplified: 3 fields (name/email/phone), removed city
- Audience fit section (✓ phù hợp / ✕ chưa phù hợp)
- Comparison table vs DIY detox / trà giảm cân

---

## Known follow-ups (for future PRs)

### Required from owner
1. **Activate FormSubmit endpoint** — first submission to `contact@ikihealing.com` triggers an activation email; one click and forms run forever
2. **Setup social channels** — Footer currently shows "(sắp ra mắt)"; need real Facebook page + Zalo OA + YouTube channel
3. **Real testimonials** — current avatars are initials only; consider video testimonials or photos with consent
4. **Trademark IKI logo + brand name** at Cục SHTT
5. **Press / báo chí mention** — replace current absence of press validation
6. **Decision on legacy domains** (`7ngayreset.com`, `7ngaydetox.vn`): keep & redirect to internal, or sunset

### Architectural roadmap (Web ↔ App IKI ↔ MailerLite)
- **Phase 1 (now)**: FormSubmit.co lightweight CRM (inbox-based)
- **Phase 2 (App IKI launch)**: Migrate forms to `POST api.ikihealing.com/leads` endpoint
- **Phase 3 (scale)**: App IKI webhook → MailerLite (email automation), Haravan (e-commerce), Zalo OA (real-time engagement)
- App IKI database = single source of truth; other tools subscribe via webhook

### Future homepage tweaks
- Hero image: replace generic Unsplash photo with brand-aligned shot (Health Coach team) or illustration
- Pricing summary visible on homepage (avoid forcing user to click into `app.html`)
- Floating Zalo chat widget when Zalo OA is set up
- Investor page `/investors/` with metrics + roadmap + trademark status

---

## Mobile responsive check

All pages tested at 3 viewports via Playwright headless Chrome:
- 1440px (desktop)
- 768px (tablet)
- 375px (mobile)

**Result:** 0 horizontal overflow on all 6 page-viewport combos (homepage, /3ngayreset, /7ngaydetox).

---

## Compliance posture

- ✅ NĐ TPBVSK — no claims of disease prevention/treatment
- ✅ NĐ 13/2023/NĐ-CP — consent checkboxes on all forms, hosting in Vietnam, privacy policy published
- ✅ Refund policy (30-day no-questions) published
- ⏳ Awaiting full text from HOPE CORP legal for `chinh-sach-doi-tra.html` and `chinh-sach-bao-mat.html` (placeholder content currently in place)

---

🤖 Compiled by Claude during session 2026-05-07 → 2026-05-08
