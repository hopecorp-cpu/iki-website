/*!
 * nguon.js — GHI NHỚ KHÁCH TỚI TỪ ĐÂU, rồi tự gắn vào MỌI form lead của IKI.
 *
 * Vì sao có file này (29/09/2026, CEO: "gài tracking để xem nguồn leads đổ về các kênh nào"):
 * trước nay mỗi form chỉ gửi CỬA khách điền (exit:<slug>, ebook:100mon, quiz:HAN...), không gửi
 * KÊNH khách tới từ đâu — đo 2.924 lead từ 01/08 thì đúng 1 dòng có dấu vết quảng cáo.
 *
 * Ba việc, cố ý gói trong MỘT file dùng chung thay vì sửa từng form (400+ trang tĩnh):
 *   1. Đọc utm_source/medium/campaign (hoặc fbclid/gclid/ttclid, hoặc referrer) của LẦN GHÉ ĐẦU
 *      rồi nhớ trong localStorage 90 ngày — khách đọc 3 bài mới điền form thì vẫn còn nguồn gốc.
 *   2. Bọc window.fetch: mọi POST JSON sang hope-ops-hub tự kèm khối `nguon`.
 *   3. Form gửi kiểu cổ điển (POST navigation): chèn input ẩn `nguon` lúc submit.
 * Không đo được thì KHÔNG bịa "direct" — để trống, báo cáo bên ops-hub sẽ nói "chưa đo được".
 * Mọi thứ bọc try/catch: file này hỏng thì form vẫn phải gửi được.
 */
(function () {
  var KHOA = "iki_nguon", HAN = 90 * 864e5, API = "hope-ops-hub.vercel.app";
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; } }
  function q(k) { try { return new URLSearchParams(location.search).get(k) || ""; } catch (e) { return ""; } }

  function lanNay() {
    var s = q("utm_source") || q("s"), m = q("utm_medium"), c = q("utm_campaign") || q("utm_content");
    if (!s) {
      if (q("fbclid")) { s = "facebook"; m = m || "paid"; }
      else if (q("gclid") || q("gad_source")) { s = "google"; m = m || "cpc"; }
      else if (q("ttclid")) { s = "tiktok"; m = m || "paid"; }
      else if (q("li_fat_id")) { s = "linkedin"; m = m || "paid"; }
    }
    var ref = host(document.referrer);
    if (ref && (ref === host(location.href) || /ikihealing\.com$/.test(ref))) ref = "";
    if (!s && !ref) return null;
    return { s: s, m: m, c: c, ref: s ? "" : ref, t: Date.now() };
  }

  var dau = null;
  try {
    var cu = JSON.parse(localStorage.getItem(KHOA) || "null");
    if (cu && cu.t && Date.now() - cu.t < HAN) dau = cu;
  } catch (e) { }
  var moi = lanNay();
  // Lượt ghé mới CÓ nhãn thì đè lượt cũ chỉ có referrer; còn đã có nhãn rồi thì giữ LẦN ĐẦU.
  if (moi && (!dau || (!dau.s && moi.s))) { dau = moi; try { localStorage.setItem(KHOA, JSON.stringify(dau)); } catch (e) { } }

  function khoi() {
    var n = { lp: location.pathname };
    if (dau) { if (dau.s) n.s = dau.s; if (dau.m) n.m = dau.m; if (dau.c) n.c = dau.c; if (dau.ref) n.ref = dau.ref; }
    return n;
  }
  window.ikiNguon = khoi;

  // 1b) MÃ CỘNG TÁC VIÊN từ link ?ref=MA (affiliate IKI, 29/09/2026). Nhớ 30 ngày, CTV gửi link
  // SAU CÙNG thắng (khác nguồn quảng cáo giữ lần đầu): người vừa chia link là người vừa thuyết phục.
  var KHOA_CTV = "iki_ctv", HAN_CTV = 30 * 864e5, maCtv = "";
  try {
    var r = q("ref").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Đ/g, "D").replace(/[^A-Z0-9]/g, "").slice(0, 20);
    if (r.length >= 3) localStorage.setItem(KHOA_CTV, JSON.stringify({ ma: r, t: Date.now() }));
    var luu = JSON.parse(localStorage.getItem(KHOA_CTV) || "null");
    if (luu && luu.ma && Date.now() - luu.t < HAN_CTV) maCtv = luu.ma;
  } catch (e) { }
  window.ikiMaCtv = function () { return maCtv; };

  // 2) Bọc fetch — form nào gửi JSON sang ops-hub cũng tự có nguồn, khỏi sửa từng form.
  try {
    var goc = window.fetch;
    window.fetch = function (u, o) {
      try {
        var url = typeof u === "string" ? u : (u && u.url) || "";
        if (o && o.body && typeof o.body === "string" && url.indexOf(API) >= 0) {
          var b = JSON.parse(o.body);
          if (b && typeof b === "object" && (!b.nguon || (maCtv && !b.ma_ctv && url.indexOf("quiz-pay/create") >= 0))) {
            if (!b.nguon) b.nguon = khoi();
            // Chỉ đơn hàng mới mang mã CTV; form lead thì không (hoa hồng chỉ tính trên đơn).
            if (maCtv && !b.ma_ctv && url.indexOf("quiz-pay/create") >= 0) b.ma_ctv = maCtv;
            o = Object.assign({}, o, { body: JSON.stringify(b) });
          }
        }
      } catch (e) { }
      return goc.apply(this, [u, o]);
    };
  } catch (e) { }

  // 3) Form POST cổ điển (trang tài liệu): chèn input ẩn trước khi trang chuyển đi.
  document.addEventListener("submit", function (ev) {
    try {
      var f = ev.target;
      if (!f || f.tagName !== "FORM" || String(f.action || "").indexOf(API) < 0) return;
      if (f.querySelector('input[name="nguon"]')) return;
      var i = document.createElement("input");
      i.type = "hidden"; i.name = "nguon";
      var n = khoi();
      i.value = (n.s ? n.s : (n.ref ? "ref:" + n.ref : "?")) + "/" + (n.m || "") + "/" + (n.c || "") + "@" + n.lp;
      f.appendChild(i);
    } catch (e) { }
  }, true);
})();
