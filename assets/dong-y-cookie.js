/* dong-y-cookie.js — thanh đồng ý cookie (Google Consent Mode v2 + Meta pixel).
 *
 * Vì sao (NĐ 330/2026 bảo vệ dữ liệu cá nhân): đo lường và quảng cáo theo hành vi (GA4, Google Ads,
 * Meta pixel) cần khách ĐỒNG Ý trước. Khối gtag('consent','default',{...denied}) đã đặt sẵn trong
 * <head> mỗi trang (scripts/gan-dong-y-cookie.mjs); file này chỉ đọc lựa chọn đã lưu hoặc hỏi khách.
 *
 * Lưu ở localStorage 'iki_cookie_dy' = 'ok' | 'khong'. Chưa có -> hiện thanh dưới đáy.
 * Chữ theo data-lang trên thẻ <script> (vi mặc định, en, ja). Không dùng emoji. Tự chứa CSS.
 */
(function () {
  'use strict';
  var KHOA = 'iki_cookie_dy';
  var CHU = {
    vi: { noi: 'IKI dùng cookie để đo lượt truy cập và quảng cáo phù hợp hơn. Bạn có thể chọn.', ok: 'Đồng ý', khong: 'Chỉ cookie cần thiết', cs: 'Chính sách dữ liệu' },
    en: { noi: 'IKI uses cookies to measure visits and show more relevant ads. The choice is yours.', ok: 'Accept', khong: 'Essential cookies only', cs: 'Privacy policy' },
    ja: { noi: 'IKIはアクセス測定と、より適切な広告表示のためにcookieを使用します。選択できます。', ok: '同意する', khong: '必須cookieのみ', cs: 'プライバシーポリシー' }
  };
  function doc() { try { return localStorage.getItem(KHOA) || ''; } catch (e) { return ''; } }
  function ghi(v) { try { localStorage.setItem(KHOA, v); } catch (e) {} }
  function gt() { window.dataLayer = window.dataLayer || []; if (typeof window.gtag === 'function') return window.gtag; return function () { window.dataLayer.push(arguments); }; }
  function capQuyen() {
    gt()('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
    try { if (typeof window.fbq === 'function') window.fbq('consent', 'grant'); } catch (e) {}
  }
  function tuChoi() {
    /* Mặc định trong <head> đã là denied — chỉ cần thu hồi pixel Meta nếu trang có. */
    try { if (typeof window.fbq === 'function') window.fbq('consent', 'revoke'); } catch (e) {}
  }
  function ngonNgu() {
    var sc = document.currentScript;
    if (!sc) { var all = document.querySelectorAll('script[src*="dong-y-cookie"]'); sc = all[all.length - 1]; }
    var l = (sc && sc.getAttribute('data-lang')) || '';
    /* Bản dịch en/ja do máy sinh từ trang Việt mang theo data-lang="vi" -> đường dẫn thắng khi là /en/ hoặc /ja/. */
    var p = location.pathname, theoDuong = p.indexOf('/en/') === 0 ? 'en' : p.indexOf('/ja/') === 0 ? 'ja' : '';
    if (theoDuong) l = theoDuong;
    return CHU[l] ? l : 'vi';
  }
  function linkCs() {
    /* Chưa có bản dịch en/ja của trang chính sách (kiểm 04/09/2026) — mọi ngôn ngữ trỏ về bản Việt. */
    return '/chinh-sach-bao-mat.html';
  }
  function dungThanh(l) {
    if (document.getElementById('ikiCookieDy')) return;
    var c = CHU[l];
    var css = document.createElement('style');
    css.textContent =
      '#ikiCookieDy{position:fixed;left:12px;right:12px;bottom:12px;z-index:2147482000;background:#fff;border:1.5px solid #2E6B2D;border-radius:12px;padding:12px 14px;box-shadow:0 8px 28px rgba(16,24,40,.16);font:13px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1C2E27;display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;max-width:760px;margin:0 auto}' +
      '#ikiCookieDy p{margin:0;flex:1 1 260px}' +
      '#ikiCookieDy a{color:#2E6B2D;text-decoration:underline;white-space:nowrap}' +
      '#ikiCookieDy .ck-nut{display:flex;gap:8px;flex:none}' +
      '#ikiCookieDy button{border-radius:8px;padding:8px 14px;font:inherit;font-weight:700;cursor:pointer;border:1.5px solid #2E6B2D}' +
      '#ikiCookieDy .ck-ok{background:#2E6B2D;color:#fff}' +
      '#ikiCookieDy .ck-khong{background:#fff;color:#2E6B2D}' +
      '@media (max-width:480px){#ikiCookieDy{bottom:8px;left:8px;right:8px}#ikiCookieDy .ck-nut{width:100%}#ikiCookieDy button{flex:1}}';
    var box = document.createElement('div');
    box.id = 'ikiCookieDy';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', 'Cookie');
    var p = document.createElement('p');
    p.appendChild(document.createTextNode(c.noi + ' '));
    var a = document.createElement('a');
    a.href = linkCs(); a.target = '_blank'; a.rel = 'noopener'; a.textContent = c.cs;
    p.appendChild(a);
    var nut = document.createElement('div');
    nut.className = 'ck-nut';
    var bOk = document.createElement('button'); bOk.type = 'button'; bOk.className = 'ck-ok'; bOk.textContent = c.ok;
    var bNo = document.createElement('button'); bNo.type = 'button'; bNo.className = 'ck-khong'; bNo.textContent = c.khong;
    nut.appendChild(bOk); nut.appendChild(bNo);
    box.appendChild(p); box.appendChild(nut);
    bOk.addEventListener('click', function () { ghi('ok'); capQuyen(); box.parentNode && box.parentNode.removeChild(box); });
    bNo.addEventListener('click', function () { ghi('khong'); tuChoi(); box.parentNode && box.parentNode.removeChild(box); });
    document.head.appendChild(css);
    document.body.appendChild(box);
  }
  var l = ngonNgu();
  function chay() {
    var v = doc();
    if (v === 'ok') { capQuyen(); return; }
    if (v === 'khong') { tuChoi(); return; }
    tuChoi();
    dungThanh(l);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay); else chay();
  /* Cho trang khác gọi lại (vd nút "Cài đặt cookie" ở chân trang): window.ikiCookieDy.mo() */
  window.ikiCookieDy = { mo: function () { dungThanh(l); }, trangThai: doc };
})();
