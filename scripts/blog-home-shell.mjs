import fs from 'fs';

// Apply the website shell only to the blog homepage; preserve generated articles and forms.
export function blogHomeShell(html) {
  const home = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const header = home.match(/<header class="sitehead">[\s\S]*?<\/header>/)?.[0];
  const footer = home.match(/<footer>[\s\S]*?<\/footer>/)?.[0];
  if (!header || !footer) throw new Error('Website header/footer missing');
  const activeHeader = header.replace(/ aria-current=(?:"page"|page)/g, '').replace('href="/blog/"', 'href="/blog/" aria-current="page"');
  const blogHeader = activeHeader.replace('href="/" lang="vi"', 'href="/blog/" lang="vi"').replace('href="/en/"', 'href="/en/blog/"').replace('href="/ja/"', 'href="/ja/blog/"');
  return html.replace(/<header\b[\s\S]*?<\/header>/, () => blogHeader)
    .replace(/<footer\b[\s\S]*?<\/footer>/, () => footer)
    .replace('<main>', '<main id="main" class="legacyblog wrap">')
    .replace('</head>', '<link rel="stylesheet" href="/assets/iki-20260908/fonts.css"><link rel="stylesheet" href="/assets/iki-20260908/site.css?v=logo-rose-5"><link rel="stylesheet" href="/assets/iki-20260908/blog-integration.css?v=navigation-4"><script src="/assets/iki-20260908/site.js?v=navigation-4" defer></script></head>');
}
