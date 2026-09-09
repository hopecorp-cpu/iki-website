"""Static, localized IKI footer. Run after page generation to preserve the approved footer."""
from pathlib import Path
import re, sys
ROOT = Path(__file__).resolve().parents[1]
COPY = {
'vi': ['Hệ sinh thái IKI','Học Viện IKI','Cẩm nang sức khỏe','Ứng dụng IKI','Cửa hàng IKI','Hỗ trợ','Chính sách bảo mật','Chính sách đổi trả','Liên hệ IKI','Chăm sóc cùng IKI','Kiến thức và những thói quen nhỏ chăm da, ăn uống, nghỉ ngơi, vận động — cho phụ nữ và gia đình.','Khám phá cộng đồng','Mã số thuế','Địa chỉ','IKI là thương hiệu thuộc HOPE CORP','Về HOPE CORP','Đội ngũ','Đối tác & nhà đầu tư','Chăm sóc sức khỏe chủ động cho phụ nữ và gia đình. Kết nối kiến thức, ứng dụng AI, cộng đồng và sản phẩm.'],
'en': ['IKI ecosystem','IKI Academy','Wellbeing journal','IKI App','IKI Shop','Support','Privacy policy','Returns policy','Contact IKI','Care with IKI','Knowledge and small habits for skincare, food, rest and movement — for women and families.','Explore the community','Tax code','Address','IKI is a brand of HOPE CORP','About HOPE CORP','Our team','Partners & investors','Proactive wellbeing for women and families. Connecting knowledge, AI assistance, community and products.'],
'ja': ['IKIのエコシステム','IKIアカデミー','健康の読みもの','IKIアプリ','IKIショップ','サポート','プライバシーポリシー','返品ポリシー','お問い合わせ','IKIと毎日のケア','肌、食事、休息、運動。女性と家族の毎日に寄り添う知識と小さな習慣。','コミュニティを見る','税務番号','所在地','IKIはHOPE CORPのブランドです','HOPE CORPについて','チーム','パートナー・投資家向け','女性と家族のための主体的な健康づくり。知識、AIサポート、コミュニティ、商品をつなぎます。']}
def footer(lang='vi', sales=False, shop=False, green=False, old=''):
 c=COPY[lang]; base='https://ikihealing.com'; prefix='' if lang=='vi' else '/'+lang
 def url(path):
  if prefix and (ROOT/(prefix.lstrip('/')+path)).exists():return base+prefix+path
  if prefix and (ROOT/(prefix.lstrip('/')+path)/'index.html').exists():return base+prefix+path
  return base+path
 def a(path,label):return f'<a href="{url(path)}">{label}</a>'
 assets='/footer-assets' if sales else '/assets/footer-20260909'
 brand=f'<a class="if-brand" href="{url("/")}" aria-label="IKI Beauty and Wellness"><img src="{assets}/iki-rose.png" width="32" height="64" alt="Logo IKI"><span>IKI<small>BEAUTY &amp; WELLNESS</small></span></a>'
 social='<div class="if-social"><a href="https://www.facebook.com/ikihealing/" aria-label="Facebook IKI"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 21v-9h3l.5-4H14V6c0-1 .5-2 2-2h2V1h-3c-3 0-5 2-5 5v2H7v4h3v9"/></svg></a><a href="https://www.youtube.com/@ikibeautiful.wellness" aria-label="YouTube IKI"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/></svg></a></div>'
 # Preserve the product notice where the original footer contains one.
 notice=''
 if sales:notice='<p class="if-notice">Sản phẩm này không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh. Đọc kỹ hướng dẫn trên nhãn trước khi sử dụng.</p>'
 elif not 'data-iki-footer' in old:
  notes=[p for p in re.findall(r'<p\b[^>]*>[\s\S]*?</p>',old,re.I) if any(t in re.sub('<[^>]+>','',p).lower() for t in ['không phải là thuốc','không nhằm chẩn đoán','không thay thế','not a medicine','not intended to','医療','医薬品'])]
  notice=''.join('<p class="if-notice">'+re.sub(r'</?p\b[^>]*>','',p)+'</p>' for p in notes)
 else:
  notice=''.join(re.findall(r'<p class="if-notice">[\s\S]*?</p>',old))
 name='CÔNG TY CỔ PHẦN TMDV HOPE' if lang=='vi' else 'HOPE SERVICE CORPORATION'
 products = ''.join([a('/shop/?sp=true-vegan-protein', 'Đạm thực vật'),a('/shop/', 'Trà thảo mộc'),a('/shop/', 'Dầu ăn lành'),a('/shop/', 'Gia vị &amp; Nêm')]) if shop and lang=='vi' else ''.join([a('/hoc-vien.html',c[1]),a('/blog/',c[2]),a('/app.html',c[3]),a('/shop/',c[4])])
 return f'''<link rel="stylesheet" href="{assets}/footer.css?v=1"><footer id="footer" class="iki-standard-footer{' if-green' if green else ''}" data-iki-footer="20260909" lang="{lang}"><div class="if-wrap"><div class="if-grid"><section>{brand}<strong class="if-company-name">{name}</strong><span class="if-tagline">FROM NATURE, FOR LIFE</span><p>{c[18]}</p>{social}</section><nav aria-label="{c[0]}"><h2>{'Sản phẩm' if shop and lang=='vi' else c[0]}</h2>{products}</nav><nav aria-label="{c[5]}"><h2>{c[5]}</h2>{a('/tai-lieu/',c[2])}{a('/chinh-sach-bao-mat.html',c[6])}{a('/chinh-sach-doi-tra.html',c[7])}<a href="mailto:contact@ikihealing.com">{c[8]}</a><a href="tel:0987931551">098 793 1551</a></nav><section><h2>{c[9]}</h2><p>{c[10]}</p><a class="if-community" href="{url('/cong-dong.html')}">{c[11]} <span aria-hidden="true">→</span></a><a class="if-hope" href="{url('/ve-hope.html')}"><img {'id="hopeLogoF"' if shop else ''} src="{assets}/hope.png" width="32" height="32" alt=""><span><b>HOPE</b><small>{c[14]}</small></span></a></section></div><div class="if-legal"><div><strong>{name}</strong>{'<span class="if-registered">CÔNG TY CỔ PHẦN TMDV HOPE</span>' if lang!='vi' else ''}<p>{c[12]}: 0801404967<br>{c[13]}: 63/253 Ngô Quyền, P. Lê Thanh Nghị, TP Hải Phòng, Việt Nam<br>Email: <a href="mailto:contact@ikihealing.com">contact@ikihealing.com</a></p></div><nav aria-label="HOPE CORP">{a('/ve-hope.html',c[15])}{a('/team.html',c[16])}{a('/investor/',c[17])}</nav></div>{notice}<div class="if-bottom"><span>© 2026 IKI by HOPE CORP</span><span>{a('/chinh-sach-bao-mat.html',c[6])} · {a('/chinh-sach-doi-tra.html',c[7])}</span></div></div></footer>'''
def apply(root=ROOT,sales=False,green=False):
 changed=[]
 for p in root.rglob('*.html'):
  if any(x in ['.git','node_modules'] for x in p.parts):continue
  s=p.read_text(); rel=p.relative_to(root);lang=rel.parts[0] if rel.parts[0] in COPY else 'vi'
  shop='shop' in rel.parts
  if '<footer' not in s:
   if str(rel)=='investor/index.html':
    t=s.replace('</body>',footer(lang,sales,shop,green)+'</body>')
    p.write_text(t);changed.append(str(rel))
   continue
  # Remove our adjacent stylesheet on rerun; HTML output remains idempotent.
  clean=re.sub(r'<link rel="stylesheet" href="(?:/assets/footer-20260909|/footer-assets)/footer.css\?v=1">','',s)
  t=re.sub(r'<footer\b[\s\S]*?</footer>',lambda m: footer(lang,sales,shop,green or 'course-page' in s,m.group()),clean,flags=re.I)
  if t!=s:p.write_text(t);changed.append(str(rel))
 return changed
if __name__=='__main__':
 target=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT
 print('\n'.join(apply(target,'--sales' in sys.argv,'--green' in sys.argv)))
