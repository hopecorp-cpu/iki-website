#!/usr/bin/env node
/**
 * popup-thu-email.mjs — NGUỒN DUY NHẤT của pop-up thu email trên bài blog.
 *
 * Tách ra khỏi build-article.mjs (20/08/2026) vì có HAI đường sinh bài blog:
 *   1. build-article.mjs dựng từ blog-drafts/*.md  -> đã có pop-up từ trước
 *   2. máy viết blog trên Vercel commit THẲNG .html -> KHÔNG đi qua build-article,
 *      nên 115/392 bài không có pop-up mà không ai thấy (đo 20/08/2026).
 * Cả hai đường nay nhập khối từ đây; gan-popup.mjs vá các bài đã lỡ thiếu.
 * CẤM chép khối này sang chỗ khác — hai bản chép tay thì sớm muộn cũng lệch.
 *
 * Gửi về /api/ebook-lead (từ 03/09/2026 quà = ebook 100 món; trước là /api/blog-lead, KHÔNG phải mailto): pop-up cũ trong script.js của trang chủ
 * mở ứng dụng mail của khách, đa số khách rơi ngay ở bước đó và không vào bảng leads.
 */

// Popup thoát-trang thu email (exit-intent) → /api/blog-lead → chuỗi nuôi 30 ngày. Hiện 1 lần/khách; ẩn nếu đã đăng ký.
/**
 * Ba sản phẩm chủ lực, bản RÚT GỌN cho pop-up: chỉ tên + quy cách + slug.
 * CỐ Ý KHÔNG có giá — pop-up nằm trong 392 trang tĩnh, in giá vào là ngày đổi giá phải dựng lại
 * cả 392 bài, mà quên một lượt là web nói sai giá. Giá sống ở trang sản phẩm, chỗ link trỏ tới.
 */
export const SP_POPUP = {
  "true-vegan-protein": { ten: "True Vegan Protein Pro", loai: "Bột đạm thực vật · hộp 500g" },
  "tra-tue-minh": { ten: "Trà Tuệ Minh", loai: "Trà thảo mộc túi lọc · hộp 30 gói" },
  "tra-thanh-huong": { ten: "Trà Thanh Hương", loai: "Trà thảo mộc bốn vị · túi lọc" },
};

export const EXIT_POPUP_MAU = `<div id="ikiExit" role="dialog" aria-modal="true" aria-label="Nhận ebook 100 Bữa Ăn Đủ Đạm miễn phí" hidden>
  <div class="ie-card">
    <button class="ie-x" type="button" aria-label="Đóng">&times;</button>
    <svg class="ie-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"></path><path d="M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"></path></svg>
    <span class="ie-tag">Ebook miễn phí</span>
    <h3>Khoan đã — nhận ebook<br>100 Bữa Ăn Đủ Đạm Không Cần Thịt</h3>
    <p>100 món Việt dễ nấu, mỗi món kèm <strong>lượng đạm ước tính</strong> cho từng khẩu phần. Nhận link tải ngay, bản PDF gửi thêm vào email. Không cần mua gì.</p>
    <form class="ie-form" novalidate>
      <input type="email" class="ie-email" placeholder="Email của bạn..." aria-label="Email" required autocomplete="email" />
      <input type="tel" class="ie-sdt" placeholder="Số Zalo (không bắt buộc) — để nhận thêm thực đơn 3 ngày" aria-label="Số Zalo" autocomplete="tel" />
      <input type="text" class="ie-honey" tabindex="-1" autocomplete="off" aria-hidden="true" />
      <button type="submit" class="ie-btn">Nhận ebook miễn phí &rarr;</button>
    </form>
    <p class="ie-ok" role="status" hidden>&#10003; Xong! Bấm nút dưới để tải ngay. Bản PDF cũng đã gửi vào email (xem cả mục Quảng cáo / Spam).</p>
    <a class="ie-tai" href="#" target="_blank" rel="noopener" hidden>Tải ebook (PDF) ngay &rarr;</a>
    <a class="ie-sp-sau" href="{{SP_LINK}}" hidden>
      <span class="ie-sp-ten">{{SP_TEN}}</span>
      <span class="ie-sp-loai">{{SP_LOAI}}</span>
      <span class="ie-sp-xem">Xem chi tiết và giá &rarr;</span>
    </a>
    <p class="ie-err" role="alert" hidden>Gửi chưa được &mdash; thử lại giúp mình nhé.</p>
    <button class="ie-no" type="button">Không, cảm ơn</button>
    <div class="ie-sp">
      <span class="ie-sp-hay">hoặc</span>
      <a class="ie-sp-lien" href="{{SP_LINK}}">
        <span class="ie-sp-ten">{{SP_TEN}}</span>
        <span class="ie-sp-loai">{{SP_LOAI}}</span>
        <span class="ie-sp-xem">Xem chi tiết và giá &rarr;</span>
      </a>
    </div>
    <p class="ie-note">Không spam &middot; Huỷ nhận bất cứ lúc nào. Bằng việc để lại email, bạn đồng ý nhận nội dung chăm sóc sức khoẻ từ IKI. Nội dung chia sẻ kiến thức ẩm thực, không thay thế tư vấn y khoa.</p>
  </div>
</div>
<style>
#ikiExit[hidden]{display:none!important}
/* Thuộc tính hidden bị các luật display bên dưới đè (vd .ie-form{display:flex}) nên phải ép một
   luật chung: thiếu nó thì màn ĐÃ GỬI vẫn hiện ô email và nút 'Đang gửi...' — lỗi có sẵn, trước
   đây pop-up tự đóng sau 3,4 giây nên không ai kịp thấy. */
#ikiExit [hidden]{display:none!important}
#ikiExit{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(18,38,31,.55);opacity:0;transition:opacity .25s ease}
#ikiExit.ie-show{opacity:1}
#ikiExit .ie-card{position:relative;background:#fff;width:100%;max-width:430px;border-radius:22px;padding:34px 26px 22px;text-align:center;box-shadow:0 24px 70px rgba(16,24,40,.28);transform:translateY(14px) scale(.98);transition:transform .28s cubic-bezier(.2,.8,.25,1);font-family:var(--font-sans,'Manrope',system-ui,sans-serif)}
#ikiExit.ie-show .ie-card{transform:none}
#ikiExit .ie-card::before{content:"";position:absolute;top:0;left:0;right:0;height:5px;border-radius:22px 22px 0 0;background:linear-gradient(90deg,#A8D254,#4BC0AB)}
#ikiExit .ie-x{position:absolute;top:12px;right:14px;border:none;background:none;font-size:26px;line-height:1;color:#98a2b3;cursor:pointer}
#ikiExit .ie-x:hover{color:#475467}
#ikiExit .ie-ico{width:38px;height:38px;color:#2E8975;margin:2px auto 8px;display:block}
#ikiExit .ie-tag{display:inline-block;font-weight:700;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:#2E8975}
#ikiExit h3{font-family:var(--font-display,'Cormorant Garamond',serif);font-weight:700;font-size:1.6rem;line-height:1.12;margin:8px 0 8px;color:#12261f}
#ikiExit p{color:#667085;font-size:1rem;margin:0 auto 16px;max-width:340px;line-height:1.5}
#ikiExit p strong{color:#2E8975}
#ikiExit .ie-form{display:flex;flex-direction:column;gap:10px;max-width:340px;margin:0 auto}
#ikiExit .ie-email,#ikiExit .ie-sdt{border:1px solid #d0d5dd;border-radius:12px;padding:14px 16px;font-size:1rem;font-family:inherit;outline:none}
#ikiExit .ie-sdt{font-size:.92rem}
#ikiExit .ie-email:focus,#ikiExit .ie-sdt:focus{border-color:#4BC0AB;box-shadow:0 0 0 3px rgba(75,192,171,.16)}
#ikiExit .ie-honey{display:none}
#ikiExit .ie-btn{border:none;border-radius:12px;padding:14px;font-size:1rem;font-weight:700;color:#fff;background:linear-gradient(135deg,#2E8975,#4BC0AB);cursor:pointer;font-family:inherit}
#ikiExit .ie-btn:disabled{opacity:.6;cursor:default}
#ikiExit .ie-ok{color:#2E8975;font-weight:600;margin:6px auto 0}
#ikiExit .ie-tai{display:block;max-width:340px;margin:12px auto 0;border-radius:12px;padding:14px;font-size:1rem;font-weight:700;color:#fff;background:#1F4D1F;text-decoration:none}
#ikiExit .ie-tai:hover{background:#2E6B2D}
#ikiExit .ie-err{color:#d92d20;font-weight:600;margin:6px auto 0}
#ikiExit .ie-no{border:none;background:none;color:#98a2b3;font-size:.9rem;text-decoration:underline;cursor:pointer;margin-top:12px;font-family:inherit}
#ikiExit .ie-note{color:#98a2b3;font-size:.74rem;margin:12px auto 0;max-width:340px;line-height:1.4}
#ikiExit .ie-sp{margin-top:14px;padding-top:14px;border-top:1px solid #eef0f3}
#ikiExit .ie-sp-hay{display:block;color:#98a2b3;font-size:.76rem;margin-bottom:8px}
#ikiExit .ie-sp-lien,#ikiExit .ie-sp-sau{display:block;text-decoration:none;border:1px solid #e6e6da;border-radius:14px;padding:11px 14px;background:#fafbfa;transition:border-color .18s ease,background .18s ease}
#ikiExit .ie-sp-lien:hover,#ikiExit .ie-sp-sau:hover{border-color:#A8D254;background:#f5faee}
#ikiExit .ie-sp-sau{margin-top:12px}
#ikiExit .ie-sp-ten{display:block;color:#12261f;font-weight:700;font-size:.95rem}
#ikiExit .ie-sp-loai{display:block;color:#667085;font-size:.78rem;margin-top:2px}
#ikiExit .ie-sp-xem{display:block;color:#2E6B2D;font-weight:700;font-size:.82rem;margin-top:6px}
@media (prefers-reduced-motion: reduce){#ikiExit,#ikiExit .ie-card{transition:none}}
</style>
<script>
(function(){
  // Đã ĐỂ EMAIL rồi thì không bao giờ hiện lại. Đã đóng mà chưa để email thì nghỉ 7 ngày —
  // bản cũ ghi cờ '1' và khoá VĨNH VIỄN, ai lỡ thấy một lần là cả đời không thấy lại (đo 21/08
  // trên máy CEO: cờ đang là '1' nên mọi bài đều im). Cờ cũ dạng '1' coi như đã hết hạn.
  try{ if(localStorage.getItem('iki_lead_ok')) return;
       var daXem=localStorage.getItem('iki_exit_v1')||'';
       var moc=/^\\d{10,}$/.test(daXem)?parseInt(daXem,10):0;
       if(moc && Date.now()-moc < 7*864e5) return; }catch(e){}
  // Quà đổi từ "cẩm nang" sang ebook 100 món (03/09/2026): 367 phiên blog/tuần mà cẩm nang thu 0,
  // trong khi ebook đã 313 lượt tải. Đi qua /api/ebook-lead để khách nhận LINK TẢI NGAY + email +
  // (nếu để số) vào máy chia sale — cùng cửa với landing, không dựng đường thứ hai.
  var ENDPOINT='https://hope-ops-hub.vercel.app/api/ebook-lead';
  var el=document.getElementById('ikiExit'); if(!el) return;
  var shown=false, done=false;
  function open(){ if(shown) return; shown=true; try{localStorage.setItem('iki_exit_v1',String(Date.now()));}catch(e){}
    el.hidden=false; requestAnimationFrame(function(){el.classList.add('ie-show');});
    var i=el.querySelector('.ie-email'); if(i) setTimeout(function(){try{i.focus();}catch(e){}},60); }
  function close(){ el.classList.remove('ie-show'); setTimeout(function(){el.hidden=true;},260); }
  el.querySelector('.ie-x').addEventListener('click',close);
  el.querySelector('.ie-no').addEventListener('click',close);
  el.addEventListener('click',function(e){ if(e.target===el) close(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&!el.hidden) close(); });
  // BA CỬA MỞ, ai tới trước mở trước. Bản cũ đòi cuộn quá 50% VÀ đủ 25 giây CÙNG LÚC — trên bài
  // dài 11.000px thì gần như không ai chạm tới, người đọc trôi mất mà chưa thấy gì.
  //   1. chuột rời mép trên (định thoát)  2. đọc tới 60% bài  3. ở lại 40 giây VÀ đã cuộn 20%
  // Điều kiện cuộn 20% ở cửa 3 là CỐ Ý: người mở tab rồi bỏ đó không đáng để đốt lượt hiện duy nhất.
  function tyLe(){ var h=document.documentElement; return h.scrollTop/((h.scrollHeight-h.clientHeight)||1); }
  document.addEventListener('mouseout',function(e){ if(!e.relatedTarget && e.clientY<=0) open(); });
  var duGio=false;
  setTimeout(function(){ duGio=true; if(tyLe()>=0.2) open(); }, 40000);
  window.addEventListener('scroll',function(){ var r=tyLe();
    if(r>=0.6) open(); else if(duGio && r>=0.2) open(); },{passive:true});
  el.querySelector('.ie-form').addEventListener('submit',function(ev){ ev.preventDefault(); if(done) return;
    var email=(el.querySelector('.ie-email').value||'').trim();
    var sdt=(el.querySelector('.ie-sdt').value||'').replace(/[^\\d+]/g,''); if(sdt.indexOf('+84')===0) sdt='0'+sdt.slice(3);
    var honey=(el.querySelector('.ie-honey').value||'').trim();
    var btn=el.querySelector('.ie-btn'), ok=el.querySelector('.ie-ok'), err=el.querySelector('.ie-err'); err.hidden=true;
    if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)){ err.textContent='Email chưa đúng — kiểm tra lại giúp mình.'; err.hidden=false; return; }
    if(sdt && !/^0(3|5|7|8|9)\\d{8}$/.test(sdt)){ err.textContent='Số Zalo chưa đúng — số di động Việt Nam 10 chữ số, hoặc để trống.'; err.hidden=false; return; }
    btn.disabled=true; btn.textContent='Đang gửi…';
    var cmp='';try{cmp=new URLSearchParams(location.search).get('utm_campaign')||'';}catch(e){}var src='exit:'+((location.pathname.split('/').pop()||'blog').replace(/\\.html$/,''))+(cmp?'|'+cmp:'');
    fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,sdt:sdt,ten:'',source:src,_honey:honey})})
      .then(function(r){ return r.json().catch(function(){return {ok:r.ok};}); })
      .then(function(j){ if(!j||j.ok===false) throw (j&&j.error)||0;
        done=true; try{localStorage.setItem('iki_lead_ok','1');}catch(e){}
        el.querySelector('.ie-form').hidden=true; el.querySelector('.ie-note').hidden=true;
        var spSau=el.querySelector('.ie-sp-sau'), spTruoc=el.querySelector('.ie-sp'), tai=el.querySelector('.ie-tai');
        if(spTruoc) spTruoc.hidden=true;
        ok.hidden=false;
        if(tai&&j.link){ tai.href=j.link; tai.hidden=false; }
        // Vừa nhận quà là lúc thiện cảm cao nhất — mời xem sản phẩm ngay dưới nút tải. KHÔNG tự
        // đóng nữa: người ta cần bấm nút tải, đóng hộ là mất quà.
        if(spSau) spSau.hidden=false; })
      .catch(function(l){ btn.disabled=false; btn.textContent='Nhận ebook miễn phí →'; err.textContent=(typeof l==='string'&&l)?l:'Gửi chưa được — thử lại giúp mình nhé.'; err.hidden=false; });
  });
})();
</script>`;

/** Ranh giới khối pop-up trong một trang đã dựng: từ thẻ mở tới hết thẻ script của nó. */
function vungPopup(html) {
  const d = html.indexOf('<div id="ikiExit"');
  if (d < 0) return null;
  const s = html.indexOf("<script>", d);
  if (s < 0) return null;
  const e = html.indexOf("</script>", s);
  if (e < 0) return null;
  return [d, e + "</script>".length];
}

/**
 * Chèn pop-up nếu chưa có, THAY nếu đã có bản cũ. Idempotent theo NỘI DUNG chứ không theo
 * sự tồn tại của id — chỉ kiểm id là bài mang bản cũ nằm lại mãi (đo 21/08: 392 bài đang giữ
 * BA phiên bản khác nhau, và bản nào cũng khoá cờ vĩnh viễn).
 */
export function chenPopup(html, sp) {
  if (!html) return html;
  const v = vungPopup(html);
  if (v) {
    const dangCo = html.slice(v[0], v[1]);
    const moi = taoPopup(sp);
    if (dangCo === moi) return html;
    return html.slice(0, v[0]) + moi + html.slice(v[1]);
  }
  const i = html.lastIndexOf("</body>");
  if (i < 0) return html;
  return html.slice(0, i) + taoPopup(sp) + "\n" + html.slice(i);
}

/**
 * Dựng pop-up cho MỘT bài, gắn đúng sản phẩm mà bài đó đã chọn.
 * Dùng chung sản phẩm với khối CTA cuối bài — một trang chỉ kể một câu chuyện; pop-up mời món A
 * mà cuối bài mời món B là tự bẻ mạch người đọc.
 */
export function taoPopup(spSlug, goc = "../") {
  const sp = SP_POPUP[spSlug] || SP_POPUP["true-vegan-protein"];
  const slug = SP_POPUP[spSlug] ? spSlug : "true-vegan-protein";
  return EXIT_POPUP_MAU
    .replace(/\{\{SP_LINK\}\}/g, `${goc}shop/?sp=${slug}`)
    .replace(/\{\{SP_TEN\}\}/g, sp.ten)
    .replace(/\{\{SP_LOAI\}\}/g, sp.loai);
}
