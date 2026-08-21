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
 * Gửi về /api/blog-lead (KHÔNG phải mailto): pop-up cũ trong script.js của trang chủ
 * mở ứng dụng mail của khách, đa số khách rơi ngay ở bước đó và không vào bảng leads.
 */

// Popup thoát-trang thu email (exit-intent) → /api/blog-lead → chuỗi nuôi 30 ngày. Hiện 1 lần/khách; ẩn nếu đã đăng ký.
export const EXIT_POPUP = `<div id="ikiExit" role="dialog" aria-modal="true" aria-label="Nhận cẩm nang chăm sóc sức khoẻ miễn phí" hidden>
  <div class="ie-card">
    <button class="ie-x" type="button" aria-label="Đóng">&times;</button>
    <svg class="ie-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"></rect><path d="M12 8v13M5 12v9h14v-9"></path><path d="M12 8S10.5 3.5 8 4.5 9 8 12 8zM12 8s1.5-4.5 4-3.5S15 8 12 8z"></path></svg>
    <span class="ie-tag">Cẩm nang miễn phí</span>
    <h3>Khoan đã — nhận cẩm nang<br>trước khi rời trang</h3>
    <p>Cẩm nang <strong>Chăm sóc sức khoẻ chủ động</strong>: lộ trình 6 chặng theo thể tạng. Gửi ngay vào email của bạn, không cần mua gì.</p>
    <form class="ie-form" novalidate>
      <input type="email" class="ie-email" placeholder="Email của bạn..." aria-label="Email" required autocomplete="email" />
      <input type="text" class="ie-honey" tabindex="-1" autocomplete="off" aria-hidden="true" />
      <button type="submit" class="ie-btn">Gửi cẩm nang cho tôi &rarr;</button>
    </form>
    <p class="ie-ok" role="status" hidden>&#10003; Đã gửi! Kiểm tra email trong 1&ndash;3 phút (nhớ xem cả mục Quảng cáo / Spam).</p>
    <p class="ie-err" role="alert" hidden>Gửi chưa được &mdash; thử lại giúp mình nhé.</p>
    <button class="ie-no" type="button">Không, cảm ơn</button>
    <p class="ie-note">Không spam &middot; Huỷ nhận bất cứ lúc nào. Bằng việc để lại email, bạn đồng ý nhận nội dung chăm sóc sức khoẻ từ IKI.</p>
  </div>
</div>
<style>
#ikiExit[hidden]{display:none!important}
#ikiExit{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(18,38,31,.55);opacity:0;transition:opacity .25s ease}
#ikiExit.ie-show{opacity:1}
#ikiExit .ie-card{position:relative;background:#fff;width:100%;max-width:430px;border-radius:22px;padding:34px 26px 22px;text-align:center;box-shadow:0 24px 70px rgba(16,24,40,.28);transform:translateY(14px) scale(.98);transition:transform .28s cubic-bezier(.2,.8,.25,1);font-family:var(--font-sans,'Manrope',system-ui,sans-serif)}
#ikiExit.ie-show .ie-card{transform:none}
#ikiExit .ie-card::before{content:"";position:absolute;top:0;left:0;right:0;height:5px;border-radius:22px 22px 0 0;background:linear-gradient(90deg,#A8D254,#4BC0AB)}
#ikiExit .ie-x{position:absolute;top:12px;right:14px;border:none;background:none;font-size:26px;line-height:1;color:#98a2b3;cursor:pointer}
#ikiExit .ie-x:hover{color:#475467}
#ikiExit .ie-ico{width:38px;height:38px;color:#2E8975;margin:2px auto 8px;display:block}
#ikiExit .ie-tag{display:inline-block;font-weight:700;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:#2E8975}
#ikiExit h3{font-family:var(--font-display,'Cormorant Garamond',serif);font-weight:700;font-size:1.7rem;line-height:1.12;margin:8px 0 8px;color:#12261f}
#ikiExit p{color:#667085;font-size:1rem;margin:0 auto 16px;max-width:340px;line-height:1.5}
#ikiExit p strong{color:#2E8975}
#ikiExit .ie-form{display:flex;flex-direction:column;gap:10px;max-width:340px;margin:0 auto}
#ikiExit .ie-email{border:1px solid #d0d5dd;border-radius:12px;padding:14px 16px;font-size:1rem;font-family:inherit;outline:none}
#ikiExit .ie-email:focus{border-color:#4BC0AB;box-shadow:0 0 0 3px rgba(75,192,171,.16)}
#ikiExit .ie-honey{display:none}
#ikiExit .ie-btn{border:none;border-radius:12px;padding:14px;font-size:1rem;font-weight:700;color:#fff;background:linear-gradient(135deg,#2E8975,#4BC0AB);cursor:pointer;font-family:inherit}
#ikiExit .ie-btn:disabled{opacity:.6;cursor:default}
#ikiExit .ie-ok{color:#2E8975;font-weight:600;margin:6px auto 0}
#ikiExit .ie-err{color:#d92d20;font-weight:600;margin:6px auto 0}
#ikiExit .ie-no{border:none;background:none;color:#98a2b3;font-size:.9rem;text-decoration:underline;cursor:pointer;margin-top:12px;font-family:inherit}
#ikiExit .ie-note{color:#98a2b3;font-size:.74rem;margin:12px auto 0;max-width:340px;line-height:1.4}
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
  var ENDPOINT='https://hope-ops-hub.vercel.app/api/blog-lead';
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
    var honey=(el.querySelector('.ie-honey').value||'').trim();
    var btn=el.querySelector('.ie-btn'), ok=el.querySelector('.ie-ok'), err=el.querySelector('.ie-err'); err.hidden=true;
    if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)){ err.textContent='Email chưa đúng — kiểm tra lại giúp mình.'; err.hidden=false; return; }
    btn.disabled=true; btn.textContent='Đang gửi…';
    var cmp='';try{cmp=new URLSearchParams(location.search).get('utm_campaign')||'';}catch(e){}var src='exit:'+((location.pathname.split('/').pop()||'blog').replace(/\\.html$/,''))+(cmp?'|'+cmp:'');
    fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,source:src,consent:true,_honey:honey,phone:''})})
      .then(function(r){ return r.ok?r.json().catch(function(){return {ok:true};}):Promise.reject(r.status); })
      .then(function(j){ if(j&&j.ok===false) throw 0;
        done=true; try{localStorage.setItem('iki_lead_ok','1');}catch(e){}
        el.querySelector('.ie-form').hidden=true; el.querySelector('.ie-note').hidden=true; ok.hidden=false; setTimeout(close,3400); })
      .catch(function(){ btn.disabled=false; btn.textContent='Gửi cẩm nang cho tôi →'; err.textContent='Gửi chưa được — thử lại giúp mình nhé.'; err.hidden=false; });
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
export function chenPopup(html) {
  if (!html) return html;
  const v = vungPopup(html);
  if (v) {
    const dangCo = html.slice(v[0], v[1]);
    if (dangCo === EXIT_POPUP) return html;
    return html.slice(0, v[0]) + EXIT_POPUP + html.slice(v[1]);
  }
  const i = html.lastIndexOf("</body>");
  if (i < 0) return html;
  return html.slice(0, i) + EXIT_POPUP + "\n" + html.slice(i);
}
