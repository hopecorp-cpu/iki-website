"""Apply the approved Vietnamese design to existing EN/JA pages.
No API translation; editorial translations are versioned in data/locales.
Usage: python3 scripts/sync-locale-design.py
Requires beautifulsoup4. Keeps existing translated blog content and shop scripts.
"""
from pathlib import Path
from bs4 import BeautifulSoup, Comment, Doctype
import re, json
ROOT=Path(__file__).resolve().parents[1]
PAGES=['index.html','team.html','hoc-vien.html','cong-dong.html','app.html','ve-hope.html','cong-nghe.html']
ROWS=[line.split('\t') for line in (ROOT/'data/locales/website-refresh.tsv').read_text().splitlines() if line]
assert all(len(r)==3 for r in ROWS)
# Source snapshots for the original translations are versioned for reproducibility separately.
CACHE=ROOT/'data/locales/shop-source-map.json'
def texts(soup):
 return [x for x in soup.find_all(string=True) if not isinstance(x,(Comment,Doctype)) and x.parent.name not in ('style','script') and x.strip()]
def inline(s):return [v for v in re.findall(r'<script\b[^>]*>(.*?)</script>',s,re.S) if v.strip()]

def translated(s,lang,dictionary):
 soup=BeautifulSoup(s,'html.parser')
 for node in texts(soup):
  key=str(node).strip()
  if key in dictionary: node.replace_with(str(node).replace(key,dictionary[key]))
 for e in soup.find_all(True):
  for a in ['alt','aria-label','placeholder','title']:
   if e.get(a) in dictionary:e[a]=dictionary[e[a]]
 if soup.html:soup.html['lang']=lang
 for e in soup.select('script[data-lang]'):e['data-lang']=lang
 return soup

def localpath(href,lang):
 if href.startswith('https://ikihealing.com/'):href=href[len('https://ikihealing.com'):]
 if not href.startswith('/') or href.startswith('//'):return href,False
 path=re.split('[?#]',href)[0]
 if path.startswith(('/en/','/ja/')):return href,False
 target=ROOT/lang/path.lstrip('/')
 if path.endswith('/'):target=target/'index.html'
 if path=='/' or path.lstrip('/') in PAGES or target.exists():return '/'+lang+href,False
 # Do not manufacture translations: label links to existing Vietnamese content.
 return href,not path.startswith(('/assets/','/iki-logo'))

def links(soup,lang,route):
 for e in soup.select('a[href]'):
  if e.find_parent(class_='language-options') or e.find_parent(class_='langs'):continue
  href,vi=localpath(e['href'],lang);e['href']=href
  if vi and e.get_text(strip=True):
   e['lang']='vi';e['class']=e.get('class',[])+['locale-fallback'];e['title']='Content in Vietnamese' if lang=='en' else 'ベトナム語のコンテンツ'
 for group in soup.select('.language-options, nav.langs'):
  for a in group.select('a'):
   code=a.get('lang') or a.get('data-lang');a['href']=('' if code=='vi' else '/'+code)+route
   a.attrs.pop('aria-current',None);a['class']=[c for c in a.get('class',[]) if c not in ('on','active')]
   if code==lang:a['aria-current']='true';a['class']+=['on']
 for summary in soup.select('.language-switch summary,.shop-language summary'):
  for n in list(summary.find_all(string=True,recursive=False)):
   if n.strip() in ['VI','EN','JA','日本語']:n.replace_with(' '+('EN' if lang=='en' else 'JA')+' ')
 if soup.head and (route=='/' or route.lstrip('/') in PAGES):
  for existing in soup.select('link[rel=alternate][hreflang]'):existing.decompose()
  for code in ['vi','en','ja','x-default']:
   href='https://ikihealing.com'+('' if code in ['vi','x-default'] else '/'+code)+route
   soup.head.append(soup.new_tag('link',rel='alternate',hreflang=code,href=href))
 canonical=soup.select_one('link[rel=canonical]')
 if canonical:canonical['href']='https://ikihealing.com/'+lang+route
 for m in soup.select('meta[property="og:url"]'):m['content']='https://ikihealing.com/'+lang+route
 for m in soup.select('meta[property="og:locale"]'):m['content']='en_US' if lang=='en' else 'ja_JP'
 return soup

def assets(soup):
 for href in ['/assets/iki-20260908/fonts.css','/assets/iki-20260908/site.css?v=logo-rose-5','/assets/iki-20260908/locale-design.css?v=1']:
  if not soup.find('link',href=href):
   tag=soup.new_tag('link',rel='stylesheet',href=href);(soup.head or soup).append(tag)
 if not soup.find('script',src='/assets/iki-20260908/locale-ui.js?v=1'):
  tag=soup.new_tag('script',src='/assets/iki-20260908/locale-ui.js?v=1',defer=True);(soup.head or soup).append(tag)
 return soup

shopmaps=json.loads(CACHE.read_text());changed=[];missing=set()
for lang,i in [('en',1),('ja',2)]:
 d={r[0]:r[i] for r in ROWS}
 for rel in PAGES:
  src=(ROOT/rel).read_text();out=translated(src,lang,d)
  for t in texts(out):
   if re.search('[đĐăĂơƠưƯạảấậắằặểễệọộớờợủứựỳỷỹ]',str(t)) and str(t).strip() not in ['Nguyễn Văn Hưng','Phạm Ngọc Thanh Tâm','Nguyễn Hoàng Hải','Tiếng Việt']:missing.add(str(t).strip())
  route='/' if rel=='index.html' else '/'+rel
  links(out,lang,route);assets(out)
  if rel=='app.html':
   for asset in out.select('script[src]'):
    if asset['src']=='/assets/iki-20260908/showcase.js':asset['src']='/assets/iki-20260908/showcase-'+lang+'.js'
  for m in out.select('meta[name=description],meta[property="og:description"],meta[name="twitter:description"]'):
   m['content']=d['Kiến thức dễ hiểu. Thói quen vừa sức. Có công nghệ và cộng đồng đồng hành — từ việc chăm chị đến những điều chị muốn dành cho gia đình.'] if rel=='index.html' else d['Phía sau IKI là những con người kết nối công nghệ, kiến thức và cộng đồng — để việc chăm sóc sức khỏe chủ động có chỗ trong đời sống của chị và gia đình.']
  if rel not in ['index.html','team.html']:
   desc=out.select_one('main p')
   for m in out.select('meta[name=description],meta[property="og:description"],meta[name="twitter:description"]'):
    if desc:m['content']=desc.get_text(' ',strip=True)
  for m in out.select('meta[property="og:title"],meta[name="twitter:title"]'):m['content']=out.title.get_text()
  target=ROOT/lang/rel;target.write_text(str(out));changed.append(str(target.relative_to(ROOT)))
 # Shop uses the approved current markup, the existing localised UI strings and exact locale scripts.
 old=(ROOT/lang/'shop/index.html').read_text();out=translated((ROOT/'shop/index.html').read_text(),lang,{**shopmaps[lang],**d})
 old_scripts=inline(old);current=[e for e in out.find_all('script') if e.string and e.string.strip()]
 assert len(old_scripts)==len(current)
 for tag,body in zip(current,old_scripts):tag.string=body
 links(out,lang,'/shop/')
 shop_title='IKI Shop — Care for yourself and your family' if lang=='en' else 'IKIショップ — 自分と家族のために'
 if out.title:out.title.string=shop_title
 for meta in out.select('meta[property="og:title"],meta[name="twitter:title"]'):meta['content']=shop_title
 for meta in out.select('meta[name=description],meta[property="og:description"],meta[name="twitter:description"]'):meta['content']=d['Từ dinh dưỡng thực vật, thức uống đến những lựa chọn cho căn bếp. Tìm hiểu thành phần, cách dùng và chọn theo nhu cầu của chị cùng người thân.']
 for logo in out.select('.brand-lock[href]'):logo['href']='/'+lang+'/'
 css=out.new_tag('link',rel='stylesheet',href='/assets/iki-20260908/locale-design.css?v=1');out.append(css)
 (ROOT/lang/'shop/index.html').write_text(str(out));assert inline(str(out))==old_scripts
 changed.append(lang+'/shop/index.html')
 # Same header/footer around each existing translated Blog page. Article contents stay untouched.
 shell=BeautifulSoup((ROOT/lang/'index.html').read_text(),'html.parser')
 header=str(shell.header);footer=str(shell.footer)
 for path in (ROOT/lang/'blog').glob('*.html'):
  s=path.read_text();original=BeautifulSoup(s,'html.parser');main=original.find('main');oldtext=main.get_text() if main else ''
  h=BeautifulSoup(header,'html.parser');f=BeautifulSoup(footer,'html.parser')
  route='/blog/' if path.name=='index.html' else '/blog/'+path.name
  for g in [h,f]:links(g,lang,route)
  for a in h.select('#nav a'):a.attrs.pop('aria-current',None)
  a=h.select_one('#nav a[href="/'+lang+'/blog/"]')
  if a:a['aria-current']='page'
  s=re.sub(r'<header\b[^>]*>.*?</header>',str(h),s,count=1,flags=re.S)
  s=re.sub(r'<footer\b[^>]*>.*?</footer>',str(f),s,count=1,flags=re.S)
  out=BeautifulSoup(s,'html.parser');assets(out)
  for anchor in out.select('a[href]'):
   for key,destination in {'academy':'hoc-vien.html','community':'cong-dong.html','app':'app.html','about':'ve-hope.html'}.items():
    if anchor['href']=='/'+lang+'/coming-soon.html?p='+key:anchor['href']='/'+lang+'/'+destination
   if anchor['href']=='https://app.ikihealing.com/landing':anchor['href']='/'+lang+'/app.html'
  if out.body:out.body['class']=out.body.get('class',[])+(['localized-legacy'] if 'localized-legacy' not in out.body.get('class',[]) else [])
  tag=out.new_tag('script',src='/assets/iki-20260908/locale-shell.js?v=1',defer=True)
  if not out.find('script',src=tag['src']):(out.head or out).append(tag)
  assert (out.main.get_text() if out.main else '')==oldtext
  # Keep the existing article markup byte-for-byte apart from obsolete navigation URLs.
  s=re.sub(r'<head\b[^>]*>.*?</head>',str(out.head),s,count=1,flags=re.S)
  if out.body:
   body_tag=str(out.body).split('>',1)[0]+'>'
   s=re.sub(r'<body\b[^>]*>',lambda _:body_tag,s,count=1)
  for key,destination in {'academy':'hoc-vien.html','community':'cong-dong.html','app':'app.html','about':'ve-hope.html'}.items():
   s=s.replace('/'+lang+'/coming-soon.html?p='+key,'/'+lang+'/'+destination)
  s=s.replace('https://app.ikihealing.com/landing','/'+lang+'/app.html')
  path.write_text(s);changed.append(str(path.relative_to(ROOT)))
print('Changed',len(changed),'pages. Unmapped:',sorted(missing))
(ROOT/'data/locales/design-pages.json').write_text(json.dumps(changed,indent=2)+'\n')

for rel in PAGES:
 path=ROOT/rel;s=path.read_text();soup=BeautifulSoup(s,'html.parser');group=soup.select_one('.language-options')
 if not group:continue
 route='/' if rel=='index.html' else '/'+rel
 for code in ['en','ja']:
  a=group.select_one('a[lang="'+code+'"]')
  if a:a['href']='/'+code+route;a.string='English' if code=='en' else '日本語'
 # Replace only the language dropdown to keep the Vietnamese source diff small.
 s=re.sub(r'<div class="language-options">.*?</div>',str(group),s,count=1,flags=re.S)
 path.write_text(s)

showcase=(ROOT/'assets/iki-20260908/showcase.js').read_text()
first,rest=showcase.split('\n',1)
shots=json.loads(first[len('const shots='):-1])
for lang,i in [('en',1),('ja',2)]:
 d={r[0]:r[i] for r in ROWS}
 short={'Chụp sản phẩm':('Photograph a product','商品を撮影'),'Kiểm tra thông tin':('Review details','情報を確認'),'Tiểu Nhã đồng hành':('Tiểu Nhã assistance','Tiểu Nhãのサポート'),'Lời nhắc riêng':('Your reminders','自分に合うリマインダー'),'Hành trình của chị':('Your journey','あなたの記録')}
 translated_shots=[{**shot,'title':d[shot['title']],'body':d[shot['body']],'short':short[shot['short']][i-1]} for shot in shots]
 js='const shots='+json.dumps(translated_shots,ensure_ascii=False)+';\n'+rest.replace('Ảnh thiết kế IKI Beauty','IKI Beauty design preview' if lang=='en' else 'IKI Beautyのデザイン')
 (ROOT/('assets/iki-20260908/showcase-'+lang+'.js')).write_text(js)
