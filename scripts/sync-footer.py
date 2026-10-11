"""Static, localized IKI footer. Run after page generation to preserve the approved footer."""
from pathlib import Path
import re, sys
ROOT = Path(__file__).resolve().parents[1]
COPY = {
'vi': ['Hệ sinh thái IKI','Học Viện IKI','Cẩm nang sức khỏe','Ứng dụng IKI','Cửa hàng IKI','Hỗ trợ','Chính sách bảo mật','Chính sách đổi trả','Liên hệ IKI','Chăm sóc cùng IKI','Kiến thức và những thói quen nhỏ chăm da, ăn uống, nghỉ ngơi, vận động — cho phụ nữ và gia đình.','Khám phá cộng đồng','Mã số thuế','Địa chỉ','IKI là thương hiệu thuộc HOPE CORP','Về HOPE CORP','Đội ngũ','Đối tác & nhà đầu tư','Chăm sóc sức khỏe chủ động cho phụ nữ và gia đình. Kết nối kiến thức, ứng dụng AI, cộng đồng và sản phẩm.'],
'en': ['IKI ecosystem','IKI Academy','Wellbeing journal','IKI App','IKI Shop','Support','Privacy policy','Returns policy','Contact IKI','Care with IKI','Knowledge and small habits for skincare, food, rest and movement — for women and families.','Explore the community','Tax code','Address','IKI is a brand of HOPE CORP','About HOPE CORP','Our team','Partners & investors','Proactive wellbeing for women and families. Connecting knowledge, AI assistance, community and products.'],
'ja': ['IKIのエコシステム','IKIアカデミー','健康の読みもの','IKIアプリ','IKIショップ','サポート','プライバシーポリシー','返品ポリシー','お問い合わせ','IKIと毎日のケア','肌、食事、休息、運動。女性と家族の毎日に寄り添う知識と小さな習慣。','コミュニティを見る','税務番号','所在地','IKIはHOPE CORPのブランドです','HOPE CORPについて','チーム','パートナー・投資家向け','女性と家族のための主体的な健康づくり。知識、AIサポート、コミュニティ、商品をつなぎます。']}
# Huy hieu 'Da thong bao Bo Cong Thuong' - ma nhung chinh thuc cua ho so ikihealing.com (duyet 21/09/2026).
BCT='<a class="if-bct" href="https://online.gov.vn/nen-tang/36b54e5b-6771-4f8a-a982-cdda06c1bd73" target="_blank" rel="noopener" title="Đã xác nhận với Bộ Công Thương" style="display:inline-block;margin-top:14px"><img src="https://fileserver.online.gov.vn/uploads/Resources/iconxacnhan/DaThongBao.png" alt="Đã xác nhận" style="height:44px;width:auto" loading="lazy"></a>'
# KT-sau-1: bài thẻ trà và 2 bài giấc ngủ không giữ dòng chân trang gọi trà là thực phẩm bổ sung.
BAI_NGU_KHONG_TPBS={'kho-ngu-tran-troc-nep-buoi-toi','uong-tra-thao-moc-buoi-toi-co-mat-ngu-khong'}
# Câu miễn trừ chân trang (08/10/2026): chỉ câu đã chốt, không giữ «Kết quả có thể khác nhau tuỳ cơ địa.»
# Thay câu cũ «Các sản phẩm là thực phẩm bổ sung…» và câu trang chính sách
# «Các sản phẩm được giới thiệu trên website là thực phẩm/thực phẩm bổ sung…».
NOTICE={
'vi':'Nội dung mang tính tham khảo, không thay thế tư vấn y khoa. Sản phẩm IKI không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh.',
'en':'This content is for general information only and is not a substitute for medical advice. IKI products are not medicines and cannot replace medicines used to treat disease.',
'ja':'本コンテンツは参考情報であり、医師による助言に代わるものではありません。IKIの製品は医薬品ではなく、病気を治療する薬の代わりにはなりません。'}
# Câu EN đã gắn ở lượt trước; lần chạy sau đổi sang câu chốt ở trên.
EN_CU='This content is for reference only and does not replace medical advice. IKI products are not medicines and do not replace medicines that treat disease.'
# Không gắn câu miễn trừ: trang noindex dành cho đối tác (không phải trang nội dung công khai).
SKIP_NOTICE={'investor/index.html'}
# 11 trang chính sách: câu chân trang riêng, gọi đúng Trà Thanh Hương và TRUE VEGAN PROTEIN PRO.
# JA giữ tên Latinh «Thanh Hương茶» như các trang ja/ hiện có, không dùng タンフォン.
POLICY_FILES={'404.html','chinh-sach.html','chinh-sach-bao-mat.html','chinh-sach-doi-tra.html','chinh-sach-gia.html','chinh-sach-giao-hang.html','chinh-sach-thanh-toan.html','dieu-khoan-su-dung.html','du-lieu-su-dung.html','giai-quyet-khieu-nai.html','quyen-du-lieu.html'}
POLICY_NOTICE={
'vi':'Trà Thanh Hương là trà thảo mộc; TRUE VEGAN PROTEIN PRO là thực phẩm bổ sung. Sản phẩm IKI không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh.',
'en':'Thanh Hương Tea is a herbal tea; TRUE VEGAN PROTEIN PRO is a food supplement. IKI products are not medicines and cannot replace medicines used to treat disease.',
'ja':'Thanh Hương茶はハーブティーです。TRUE VEGAN PROTEIN PROは栄養補助食品です。IKIの製品は医薬品ではなく、病気を治療する薬の代わりにはなりません。'}
# Logo kênh chính thức (đường SVG từ Simple Icons, CC0) — 11/10/2026. Chỉ gắn kênh đã kiểm tra còn sống.
ICON={'facebook': 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z', 'messenger': 'M.001 11.639C.001 4.949 5.241 0 12.001 0S24 4.95 24 11.639c0 6.689-5.24 11.638-12 11.638-1.21 0-2.38-.16-3.47-.46a.96.96 0 00-.64.05l-2.39 1.05a.96.96 0 01-1.35-.85l-.07-2.14a.97.97 0 00-.32-.68A11.39 11.389 0 01.002 11.64zm8.32-2.19l-3.52 5.6c-.35.53.32 1.139.82.75l3.79-2.87c.26-.2.6-.2.87 0l2.8 2.1c.84.63 2.04.4 2.6-.48l3.52-5.6c.35-.53-.32-1.13-.82-.75l-3.79 2.87c-.25.2-.6.2-.86 0l-2.8-2.1a1.8 1.8 0 00-2.61.48z', 'youtube': 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z', 'zalo': 'M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z', 'pinterest': 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z', 'linkedin': 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'}
KENH=[('Facebook IKI','https://www.facebook.com/profile.php?id=61572357961785','facebook','#0866FF'),
 ('YouTube IKI Beauty & Wellness','https://www.youtube.com/@ikibeautiful.wellness','youtube','#FF0000'),
 ('YouTube IKI Wellness','https://www.youtube.com/@ikiwellnessvn','youtube','#FF0000'),
 ('Zalo IKI','https://zalo.me/599407064751177637','zalo','#0068FF'),
 ('Pinterest IKI','https://www.pinterest.com/ikihealing/','pinterest','#BD081C'),
 ('LinkedIn IKI','https://www.linkedin.com/company/ikihealing','linkedin','#0A66C2')]
def svg(name):return f'<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="{ICON[name]}"/></svg>'
# Nút liên hệ nổi góc phải: gọi + Messenger (+ Zalo khi trang không có khung chat Zalo OA). Miễn phí, chỉ là đường link.
NHAN={'vi':('Liên hệ nhanh','Gọi 098 793 1551','Nhắn Facebook Messenger','Nhắn Zalo'),
 'en':('Quick contact','Call +84 98 793 1551','Message on Facebook Messenger','Message on Zalo'),
 'ja':('お問い合わせ','電話 +84 98 793 1551','Facebook Messengerで連絡','Zaloで連絡')}
PHONE='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'
def noi(lang):
 n=NHAN[lang]
 return (f'<div class="if-float" role="group" aria-label="{n[0]}">'
  f'<a class="if-f-call" href="tel:0987931551" aria-label="{n[1]}" title="{n[1]}">{PHONE}</a>'
  f'<a class="if-f-mess" href="https://m.me/61572357961785" target="_blank" rel="noopener" aria-label="{n[2]}" title="{n[2]}">{svg("messenger")}</a>'
  f'<a class="if-f-zalo" href="https://zalo.me/599407064751177637" target="_blank" rel="noopener" aria-label="{n[3]}" title="{n[3]}">{svg("zalo")}</a></div>')
def plain(html):
 return re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',html)).strip()
def la_cau_cu(text,lang):
 t=text.lower()
 if lang=='vi':
  return t.startswith('các sản phẩm là thực phẩm bổ sung') or t.startswith('các sản phẩm được giới thiệu trên website là thực phẩm')
 if lang=='en':
  return (t.startswith('these products are') and 'supplement' in t) or (t.startswith('products presented on this website') or t.startswith('products introduced on this website'))
 if lang=='ja':
  return (('これらの製品' in text or text.startswith('本製品')) and ('栄養補助' in text or '健康補助' in text)) or text.startswith('当ウェブサイトで紹介する製品')
 return False
def doi_cau_chan(notice,lang):
 parts=re.findall(r'<p class="if-notice">[\s\S]*?</p>',notice)
 if not parts:return notice
 out=[]
 for p in parts:
  if la_cau_cu(plain(p),lang) or (lang=='en' and plain(p)==EN_CU):out.append(f'<p class="if-notice">{NOTICE[lang]}</p>')
  else:out.append(p)
 return ''.join(out)
def la_o_chan_san_pham(text,lang):
 return text==NOTICE[lang] or text==POLICY_NOTICE[lang] or la_cau_cu(text,lang)
def dat_cau_chinh_sach(notice,lang):
 parts=re.findall(r'<p class="if-notice">[\s\S]*?</p>',notice)
 out=[]; done=False
 for p in parts:
  if la_o_chan_san_pham(plain(p),lang):
   if not done:out.append(f'<p class="if-notice">{POLICY_NOTICE[lang]}</p>'); done=True
  else:out.append(p)
 if not done:out.append(f'<p class="if-notice">{POLICY_NOTICE[lang]}</p>')
 return ''.join(out)
def bo_tpbs(notice):
 parts=re.findall(r'<p class="if-notice">[\s\S]*?</p>',notice)
 if not parts:return '' if 'thực phẩm bổ sung' in re.sub('<[^>]+>','',notice).lower() else notice
 return ''.join(p for p in parts if 'thực phẩm bổ sung' not in re.sub('<[^>]+>','',p).lower())
def footer(lang='vi', sales=False, shop=False, green=False, old='', strip_tpbs=False, policy=False, skip_notice=False):
 c=COPY[lang]; base='https://ikihealing.com'; prefix='' if lang=='vi' else '/'+lang
 def url(path):
  if prefix and (ROOT/(prefix.lstrip('/')+path)).exists():return base+prefix+path
  if prefix and (ROOT/(prefix.lstrip('/')+path)/'index.html').exists():return base+prefix+path
  return base+path
 def a(path,label):return f'<a href="{url(path)}">{label}</a>'
 assets='/footer-assets' if sales else '/assets/footer-20260909'
 brand=f'<a class="if-brand" href="{url("/")}" aria-label="IKI Beauty and Wellness"><img src="{assets}/iki-rose.png" width="32" height="64" alt="Logo IKI"><span>IKI<small>BEAUTY &amp; WELLNESS</small></span></a>'
 social='<div class="if-social">'+''.join(f'<a href="{u}" target="_blank" rel="noopener" aria-label="{t}" title="{t}">{svg(i).replace('<svg ','<svg style="color:'+c+'" ',1)}</a>' for t,u,i,c in KENH)+'</div>'
 # Preserve the product notice where the original footer contains one.
 notice=''
 if sales:notice='<p class="if-notice">Sản phẩm này không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh. Đọc kỹ hướng dẫn trên nhãn trước khi sử dụng.</p>'
 elif not 'data-iki-footer' in old:
  notes=[p for p in re.findall(r'<p\b[^>]*>[\s\S]*?</p>',old,re.I) if any(t in re.sub('<[^>]+>','',p).lower() for t in ['không phải là thuốc','không phải thuốc','không nhằm chẩn đoán','không thay thế','not a medicine','not intended to','医療','医薬品'])]
  notice=''.join('<p class="if-notice">'+re.sub(r'</?p\b[^>]*>','',p)+'</p>' for p in notes)
 else:
  notice=''.join(re.findall(r'<p class="if-notice">[\s\S]*?</p>',old))
 notice=doi_cau_chan(notice,lang)
 if strip_tpbs:notice=bo_tpbs(notice)
 # Trang đã có chân trang chuẩn mà chưa có câu miễn trừ: gắn câu đã chốt vào đúng chỗ if-notice.
 if not policy and not skip_notice and '<p class="if-notice">' not in notice:
  notice=f'<p class="if-notice">{NOTICE[lang]}</p>'
 if policy:notice=dat_cau_chinh_sach(notice,lang)
 name='CÔNG TY CỔ PHẦN TMDV HOPE' if lang=='vi' else 'HOPE SERVICE CORPORATION'
 products = ''.join([a('/shop/?sp=true-vegan-protein', 'Đạm thực vật'),a('/shop/', 'Trà thảo mộc'),a('/shop/', 'Dầu ăn lành'),a('/shop/', 'Gia vị &amp; Nêm')]) if shop and lang=='vi' else ''.join([a('/hoc-vien.html',c[1]),a('/blog/',c[2]),a('/app.html',c[3]),a('/shop/',c[4])])
 return f'''<link rel="stylesheet" href="{assets}/footer.css?v=3"><footer id="footer" class="iki-standard-footer{' if-green' if green else ''}" data-iki-footer="20260909" lang="{lang}"><div class="if-wrap"><div class="if-grid"><section>{brand}<strong class="if-company-name">{name}</strong><span class="if-tagline">FROM NATURE, FOR LIFE</span><p>{c[18]}</p>{social}</section><nav aria-label="{c[0]}"><h2>{'Sản phẩm' if shop and lang=='vi' else c[0]}</h2>{products}</nav><nav aria-label="{c[5]}"><h2>{c[5]}</h2>{a('/tai-lieu/',c[2])}{a('/chinh-sach-bao-mat.html',c[6])}{a('/chinh-sach-doi-tra.html',c[7])}{a('/chinh-sach.html','Chính sách &amp; điều khoản') if lang=='vi' else ''}<a href="mailto:contact@ikihealing.com">{c[8]}</a><a href="tel:0987931551">098 793 1551</a></nav><section><h2>{c[9]}</h2><p>{c[10]}</p><a class="if-community" href="{url('/cong-dong.html')}">{c[11]} <span aria-hidden="true">→</span></a><a class="if-hope" href="{url('/ve-hope.html')}"><img {'id="hopeLogoF"' if shop else ''} src="{assets}/hope.png" width="32" height="32" alt=""><span><b>HOPE</b><small>{c[14]}</small></span></a></section></div><div class="if-legal"><div><strong>{name}</strong>{'<span class="if-registered">CÔNG TY CỔ PHẦN TMDV HOPE</span>' if lang!='vi' else ''}<p>{'GPKD số 0801404967, đăng ký lần đầu ngày 23/08/2023, thay đổi lần 6 ngày 24/09/2026 tại Sở Tài chính TP Hải Phòng<br>' if lang=='vi' else ''}{c[12]}: 0801404967<br>{c[13]}: Số 40A Quang Trung, P. Hải Dương, TP Hải Phòng, Việt Nam<br>{'Điện thoại: <a href="tel:0987931551">098 793 1551</a><br>' if lang=='vi' else ''}Email: <a href="mailto:contact@ikihealing.com">contact@ikihealing.com</a></p>{BCT}</div><nav aria-label="HOPE CORP">{a('/ve-hope.html',c[15])}{a('/team.html',c[16])}{a('/investor/',c[17])}</nav></div>{notice}<div class="if-bottom"><span>© 2026 IKI by HOPE CORP</span><span>{a('/chinh-sach-bao-mat.html',c[6])} · {a('/chinh-sach-doi-tra.html',c[7])}{(' · '+a('/chinh-sach.html','Chính sách &amp; điều khoản')) if lang=='vi' else ''}</span></div></div>{'' if sales else noi(lang)}</footer>'''
def apply(root=ROOT,sales=False,green=False):
 changed=[]
 for p in root.rglob('*.html'):
  if any(x in ['.git','node_modules'] for x in p.parts):continue
  s=p.read_text(); rel=p.relative_to(root);lang=rel.parts[0] if rel.parts[0] in COPY else 'vi'
  shop='shop' in rel.parts
  policy=rel.name in POLICY_FILES
  skip_notice=str(rel) in SKIP_NOTICE
  strip_tpbs=lang=='vi' and (rel.stem in BAI_NGU_KHONG_TPBS or 'cta-sp-nhan">Trà thảo mộc IKI' in s)
  if '<footer' not in s:
   if str(rel)=='investor/index.html':
    t=s.replace('</body>',footer(lang,sales,shop,green)+'</body>')
    p.write_text(t);changed.append(str(rel))
   # Trang không có chân trang chuẩn (quiz, khảo sát, ebook): chỉ gắn nút liên hệ nổi. Bỏ trang chuyển hướng và file mẫu.
   elif not sales and 'http-equiv="refresh"' not in s and rel.parts[0]!='scripts' and '</body>' in s:
    khoi=f'<!-- iki-lien-he --><link rel="stylesheet" href="/assets/footer-20260909/footer.css?v=3"><div class="iki-standard-footer iki-lienhe-noi">{noi(lang)}</div><!-- /iki-lien-he -->'
    t=re.sub(r'<!-- iki-lien-he -->[\s\S]*?<!-- /iki-lien-he -->','',s).replace('</body>',khoi+'</body>',1)
    if t!=s:p.write_text(t);changed.append(str(rel))
   continue
  # Remove our adjacent stylesheet on rerun; HTML output remains idempotent.
  clean=re.sub(r'<link rel="stylesheet" href="(?:/assets/footer-20260909|/footer-assets)/footer.css\?v=\d+">','',s)
  t=re.sub(r'<footer\b[\s\S]*?</footer>',lambda m, policy=policy, skip_notice=skip_notice: footer(lang,sales,shop,green or 'course-page' in s,m.group(),strip_tpbs,policy,skip_notice),clean,flags=re.I)
  if t!=s:p.write_text(t);changed.append(str(rel))
 return changed
if __name__=='__main__':
 target=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT
 print('\n'.join(apply(target,'--sales' in sys.argv,'--green' in sys.argv)))
