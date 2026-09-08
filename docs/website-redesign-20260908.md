# Website redesign 08/09/2026

User approved backup then production rollout of morning preview v2. Baseline 089eaa27030340c0252b69d8c66da6f08c9054ea; backup tag backup/ikihealing-before-redesign-20260908. Local ZIP stored by operator in HOPE CORP/backups/ikihealing-2026-09-08.

Updates: homepage, app (with 5 existing screenshot gallery), academy, community, product introduction, about, team, technology. Blog index main content/search/forms retained, shell and CSS updated. Existing articles, quiz, shop, policies, investor unchanged. Resources isolated in assets/iki-20260908. Main product navigation retains /shop. IKI Beauty remains marked in development. Analytics consent bootstrap retained.

Blog homepage generator applies scripts/blog-home-shell.mjs to retain the new shell on future content builds; other generated pages remain unchanged. EN/JA retain original content.

Rollback: restore only changed paths from backup tag, commit and push. Do not reset main or deploy a dirty checkout.

Validation: 9 pages at 1440px and 390px, no horizontal overflow or broken images, no JavaScript errors. Clicked mobile menus, app tabs, gallery open/next/Escape and Blog search (8 results). Local href/src check passed. 424 protected files retained byte-for-byte. Full blog build tested in an isolated copy: generated HTML unchanged; existing generator only adds its normal resource entries to sitemap.xml.

Logo correction: replaced the 122px recolored mark with the user-supplied 1568px original JPG in headers; original transparent green mark in footers. CSS preserves image proportions and crops square whitespace only in layout. Verified desktop/mobile homepage, Blog, app and mobile menu. Cache version logo-original-2.

Palette correction: harmonized retained Blog CTA panels, buttons, labels, search focus/hover, input fields and consent text to plum/cream/rose; shared cookie banner follows the same palette on redesigned pages. Kept original logo green. Blog content and form submission behavior unchanged. Verified computed colors, checkbox toggle, search and mobile menu at 1440/390px; no page errors or overflow.

## Programme and navigation update

Reset links now use /3ngayreset.html, never 7ngayreset.com. Rewrote the two existing programme pages with a green visual variant, lifestyle education overview, day-by-day reference outline, questions before enrolment and existing FormSubmit destination/field names. Existing ticket amounts retained; removed unverified testimonials, 200K counts, countdowns, comparison claims and treatment/outcome promises. Backup copies in local course-pages-before-update directory.

Community expanded with real Facebook and Zalo channels, Blog entry, joining guidance and participation principles; no invented group URLs or timetable. Academy 1-1 card now targets a detailed section. Product cards now link their existing product detail pages.

Shared Vietnamese header: 15px desktop / 16px collapsed menu, visible VI/English/Japanese dropdown linking available translations; homepage fallback is explicitly labelled. Footer language links removed; full legal company name, MST 0801404967, address and email copied from existing public privacy page. Existing foreign-language page content unchanged.

Validation: 7 affected page types at 1440/1024/390px, no overflow/missing images/JS errors; clicked navigation/language menu, Reset destination, course radio/consent and empty-form validation, Blog search. No live leads submitted. 424 protected Blog/investor/shop/quiz/policy files remain unchanged. Local href and anchor audit passed.

Logo color update: user requested no green mark. Apply rose color treatment in CSS to the existing high-resolution header/footer logo, preserving source image and proportions. Verified desktop/mobile headers; programme background remains green.

Homepage sharing introduction updated: title/description/Open Graph/Twitter lead with the benefit of caring for oneself and family, followed by the proactive health ecosystem for women. og:site_name explicitly IKI. Visible homepage content unchanged.
