/* kiem-form.js — cua kiem so dien thoai va email cho moi form cua IKI
 * Luat: SDT phai dung 10 so va bat dau bang so 0. Email phai dung dinh dang.
 * Dung chung cho ikihealing.com va cac trang ban. Sua o day la sua moi noi.
 */
(function () {
  'use strict';

  var RE_SDT = /^0\d{9}$/;
  // Email: phan truoc @ khong co khoang trang; ten mien co it nhat mot dau cham;
  // duoi cung it nhat 2 chu cai; khong cho dau cham doi, dau cham dau hoac cuoi.
  var RE_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

  var LOI_SDT = 'So dien thoai phai co dung 10 so va bat dau bang so 0. Vi du: 0987654321';
  var LOI_EMAIL = 'Email chua dung dinh dang. Vi du: ten@gmail.com';
  var LOI_SDT_VN = 'Số điện thoại phải có đúng 10 số và bắt đầu bằng số 0. Ví dụ: 0987654321';
  var LOI_EMAIL_VN = 'Email chưa đúng định dạng. Ví dụ: ten@gmail.com';

  /* Chuan hoa: bo moi ky tu khong phai so, doi +84 hoac 84 dau so ve 0.
     Lam vay de khach go kieu quoc te khong bi chan oan. */
  function chuanHoaSdt(v) {
    var s = String(v == null ? '' : v).replace(/\D/g, '');
    if (s.indexOf('84') === 0 && s.length === 11) s = '0' + s.slice(2);
    else if (s.indexOf('840') === 0 && s.length === 12) s = s.slice(2);
    return s;
  }

  function sdtHopLe(v) { return RE_SDT.test(chuanHoaSdt(v)); }
  function emailHopLe(v) { return RE_EMAIL.test(String(v == null ? '' : v).trim()); }

  function laOSdt(el) {
    if (!el || el.tagName !== 'INPUT') return false;
    var t = (el.type || '').toLowerCase();
    var n = ((el.name || '') + ' ' + (el.id || '') + ' ' + (el.className || '')).toLowerCase();
    return t === 'tel' || (el.getAttribute('inputmode') === 'tel') ||
      /(^|[^a-z])(phone|sdt|dienthoai|tel)([^a-z]|$)/.test(n);
  }
  function laOEmail(el) {
    if (!el || el.tagName !== 'INPUT') return false;
    if ((el.type || '').toLowerCase() === 'email') return true;
    var n = ((el.name || '') + ' ' + (el.id || '')).toLowerCase();
    return /(^|[^a-z])email([^a-z]|$)/.test(n);
  }

  function batBuoc(el) {
    return el.required || el.getAttribute('aria-required') === 'true';
  }

  /* Tra ve chuoi loi, hoac chuoi rong neu dat.
     O de trong ma khong bat buoc thi coi nhu dat. */
  function soatO(el) {
    var v = (el.value || '').trim();
    if (!v) return batBuoc(el) ? (laOSdt(el) ? LOI_SDT_VN : (laOEmail(el) ? LOI_EMAIL_VN : '')) : '';
    if (laOSdt(el)) return sdtHopLe(v) ? '' : LOI_SDT_VN;
    if (laOEmail(el)) return emailHopLe(v) ? '' : LOI_EMAIL_VN;
    return '';
  }

  function hienLoi(el, msg) {
    if (el.setCustomValidity) el.setCustomValidity(msg ? msg.replace(LOI_SDT_VN, LOI_SDT).replace(LOI_EMAIL_VN, LOI_EMAIL) : '');
    var id = 'loi-' + (el.id || el.name || 'o');
    /* Hop loi phai gan RIENG cho tung o. Truoc day tim bang
       el.parentNode.querySelector('[data-loi-form]') nen moi o trong cung mot khoi
       dung chung MOT hop: o hop le chay sau se xoa mat loi cua o sai truoc do,
       thanh ra chan dung ma khach khong thay loi nao. */
    var box = el.__loiBox;
    if (box && !box.isConnected) box = el.__loiBox = null;
    if (msg) {
      if (!box) {
        box = document.createElement('div');
        box.setAttribute('data-loi-form', '1');
        box.id = id;
        el.__loiBox = box;
        box.style.cssText = 'color:#c0392b;font-size:13px;line-height:1.4;margin:6px 0 0;font-weight:600';
        if (el.parentNode) el.parentNode.insertBefore(box, el.nextSibling);
      }
      box.textContent = msg;
      box.style.display = '';
      el.setAttribute('aria-invalid', 'true');
      el.style.borderColor = '#c0392b';
    } else {
      if (box) { box.textContent = ''; box.style.display = 'none'; }
      el.removeAttribute('aria-invalid');
      el.style.borderColor = '';
    }
  }

  function chuanBiO(el) {
    if (el.__kiemForm) return;
    el.__kiemForm = true;
    if (laOSdt(el)) {
      el.setAttribute('inputmode', 'numeric');
      el.setAttribute('maxlength', '15');
      el.setAttribute('autocomplete', 'tel');
      if (!el.getAttribute('title')) el.setAttribute('title', LOI_SDT_VN);
    }
    if (laOEmail(el) && !el.getAttribute('title')) el.setAttribute('title', LOI_EMAIL_VN);

    el.addEventListener('input', function () { hienLoi(el, ''); });
    el.addEventListener('blur', function () {
      /* Go xong thi tu chuan hoa +84 ve 0 cho khach de doi chieu */
      if (laOSdt(el) && el.value) {
        var s = chuanHoaSdt(el.value);
        if (s && s !== el.value.replace(/\D/g, '')) el.value = s;
        else if (RE_SDT.test(s)) el.value = s;
      }
      hienLoi(el, soatO(el));
    });
  }

  function soatKhoi(goc) {
    var os = goc.querySelectorAll ? goc.querySelectorAll('input') : [];
    var loiDau = null;
    for (var i = 0; i < os.length; i++) {
      var el = os[i];
      if (!laOSdt(el) && !laOEmail(el)) continue;
      if (el.disabled || el.offsetParent === null && el.type !== 'hidden') { /* van soat o an trong tab */ }
      if (laOSdt(el) && el.value) el.value = chuanHoaSdt(el.value);
      var msg = soatO(el);
      hienLoi(el, msg);
      if (msg && !loiDau) loiDau = el;
    }
    if (loiDau) {
      try { loiDau.focus(); } catch (e) {}
      return false;
    }
    return true;
  }

  function gan() {
    var os = document.querySelectorAll('input');
    for (var i = 0; i < os.length; i++) {
      if (laOSdt(os[i]) || laOEmail(os[i])) chuanBiO(os[i]);
    }
  }

  /* Chan o giai doan bat (capture) de chay TRUOC moi ma san co cua trang,
     ke ca form dat novalidate hay form gui thang bang POST. */
  document.addEventListener('submit', function (ev) {
    var f = ev.target;
    if (!f || f.tagName !== 'FORM') return;
    if (!soatKhoi(f)) {
      ev.preventDefault();
      ev.stopPropagation();
      if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    }
  }, true);

  /* Form gui bang nut bam thay vi su kien submit (quiz, gio hang):
     tim khoi chua o nhap gan nhat roi soat khoi do. */
  document.addEventListener('click', function (ev) {
    var nut = ev.target && ev.target.closest ? ev.target.closest('button,[role="button"],a.btn,.cta,.btn-cta') : null;
    if (!nut || nut.type === 'reset') return;
    if (nut.form) return; /* nut trong form: da co nhanh submit lo */
    var chu = (nut.textContent || '').toLowerCase();
    if (!/đặt hàng|dat hang|gửi|gui|nhận|nhan|đăng ký|dang ky|hoàn tất|hoan tat|tiếp tục|tiep tuc|xem kết quả|xem ket qua/.test(chu)) return;
    var khoi = nut.closest('form,section,div[class*="form"],div[class*="order"],div[class*="dat"]') || document;
    var co = khoi.querySelector && khoi.querySelector('input[type="tel"],input[type="email"],input[inputmode="tel"]');
    if (!co) return;
    if (!soatKhoi(khoi)) {
      ev.preventDefault();
      ev.stopPropagation();
      if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    }
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', gan);
  else gan();
  /* O nhap sinh ra sau (popup, buoc sau cua quiz) */
  if (window.MutationObserver) {
    new MutationObserver(gan).observe(document.documentElement, { childList: true, subtree: true });
  }

  window.KiemForm = { sdtHopLe: sdtHopLe, emailHopLe: emailHopLe, chuanHoaSdt: chuanHoaSdt };
})();
