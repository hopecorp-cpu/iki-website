# Website redesign 08/09/2026

User approved backup then production rollout of morning preview v2. Baseline 089eaa27030340c0252b69d8c66da6f08c9054ea; backup tag backup/ikihealing-before-redesign-20260908. Local ZIP stored by operator in HOPE CORP/backups/ikihealing-2026-09-08.

Updates: homepage, app (with 5 existing screenshot gallery), academy, community, product introduction, about, team, technology. Blog index main content/search/forms retained, shell and CSS updated. Existing articles, quiz, shop, policies, investor unchanged. Resources isolated in assets/iki-20260908. Main product navigation retains /shop. IKI Beauty remains marked in development. Analytics consent bootstrap retained.

Blog homepage generator applies scripts/blog-home-shell.mjs to retain the new shell on future content builds; other generated pages remain unchanged. EN/JA retain original content.

Rollback: restore only changed paths from backup tag, commit and push. Do not reset main or deploy a dirty checkout.

Validation: 9 pages at 1440px and 390px, no horizontal overflow or broken images, no JavaScript errors. Clicked mobile menus, app tabs, gallery open/next/Escape and Blog search (8 results). Local href/src check passed. 424 protected files retained byte-for-byte. Full blog build tested in an isolated copy: generated HTML unchanged; existing generator only adds its normal resource entries to sitemap.xml.

Logo correction: replaced the 122px recolored mark with the user-supplied 1568px original JPG in headers; original transparent green mark in footers. CSS preserves image proportions and crops square whitespace only in layout. Verified desktop/mobile homepage, Blog, app and mobile menu. Cache version logo-original-2.
