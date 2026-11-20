import fs from 'fs';

// Apply the website shell only to the blog homepage; preserve generated articles and forms.
export function blogHomeShell(html) {
  // Trang chủ mới (19/11/2026) có đầu trang riêng, nên lấy đầu trang chung từ trang Cộng đồng.
  const shell = fs.readFileSync(new URL('../cong-dong.html', import.meta.url), 'utf8');
  const header = shell.match(/<header class="sitehead">[\s\S]*?<\/header>/)?.[0];
  const footer = shell.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/)?.[0];
  if (!header || !footer) throw new Error('Website header/footer missing');
  const activeHeader = header.replace(/ aria-current=(?:"page"|page)/g, '').replace('href="/blog/"', 'href="/blog/" aria-current="page"');
  const blogHeader = activeHeader.replace(/href="[^"]*" lang="vi"/, 'href="/blog/" lang="vi"').replace(/href="[^"]*" lang="en"/, 'href="/en/blog/" lang="en"').replace(/href="[^"]*" lang="ja"/, 'href="/ja/blog/" lang="ja"');
  return html.replace(/<header\b[\s\S]*?<\/header>/, () => blogHeader)
    .replace(/<footer\b[\s\S]*?<\/footer>/, () => footer)
    .replace('<main>', '<main id="main" class="legacyblog wrap">')
    .replace('</head>', '<link rel="stylesheet" href="/assets/iki-20260908/fonts.css"><link rel="stylesheet" href="/assets/iki-20260908/site.css?v=mau-20261119"><link rel="stylesheet" href="/assets/iki-20260908/blog-integration.css?v=mau-20261120"><script src="/assets/iki-20260908/site.js?v=navigation-4" defer></script></head>');
}
