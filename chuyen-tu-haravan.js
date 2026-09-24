/* Chuyển khách từ store Haravan cũ (ikihealingdetox.com) về ikihealing.com — CEO chốt 17/09 + 24/09/2026.
 * Haravan chỉ nạp file này (một dòng <script> đầu <head> của theme.liquid). Sửa bảng ở ĐÂY, không cần vào Haravan.
 * Gỡ: xoá dòng <script> trong theme Haravan. Trang /checkouts, /account... của Haravan không đi qua theme nên đơn đang thanh toán vẫn xong. */
(function () {
  if (!/ikihealingdetox\.com$/i.test(location.hostname)) return;
  var M = {"tra-thanh-huong": "tra-thanh-huong", "nhan-ban-tu-mat-ong-bac-ha-1400g": "mat-ong-bac-ha-1400g", "mat-ong-bac-ha": "mat-ong-bac-ha-530g", "me-den-huu-co-hat-duong-hanuti-150g-320g": "me-den-huu-co-hat-duong-hanuti-150g-320g", "dau-oliu-pomace-mueloliva-1l-nhap-khau-tay-ban-nha-chai-thuy-tinh-cao-cap": "dau-oliu-pomace-mueloliva-1l-nhap-khau-tay-ban-nha-chai-thuy-tinh-cao-cap", "dau-dua-len-men-tach-lanh-raw-virgin-coconut-oil": "dau-dua-len-men-tach-lanh-raw-virgin-coconut-oil", "muoi-tre-sadhu": "muoi-tre-sadhu", "minh-triet-trong-an-uong-cua-phuong-dong": "minh-triet-trong-an-uong-cua-phuong-dong", "dau-me-ep-thu-cong-nguyen-chat": "dau-me-ep-thu-cong-nguyen-chat", "dau-phong-ep-thu-cong-nguyen-chat": "dau-phong-ep-thu-cong-nguyen-chat", "mat-mia-tu-nhien": "mat-mia-tu-nhien", "duong-mia-tho-tu-nhien": "duong-mia-tho-tu-nhien", "kem-danh-rang-thao-moc-siri-siri-sudanta": "kem-danh-rang-thao-moc-siri-siri-sudanta", "bot-cafe-iki": "bot-cafe-iki", "xi-dau-huu-co-thai-lan": "xi-dau-huu-co-thai-lan", "tuong-tamari-3-nam-homefood": "tuong-tamari-3-nam-homefood", "mang-hap-thu-song-dien-tu-eco-g9": "mang-hap-thu-song-dien-tu-eco-g9", "tra-tue-minh": "tra-tue-minh", "bot-dam-dinh-duong-true-vegan-proten-pro-500g": "bot-dam-dinh-duong-true-vegan-protein-pro-500g"};
  var p = location.pathname, d = "https://ikihealing.com", u = d + "/shop/";
  var m = p.match(/^\/products\/([^\/?#]+)/);
  if (m && M[decodeURIComponent(m[1])]) u = d + "/shop/?sp=" + M[decodeURIComponent(m[1])];
  else if (/^\/(blogs|pages)\//.test(p)) u = d + "/";
  location.replace(u + (u.indexOf("?") > 0 ? "&" : "?") + "utm_source=ikihealingdetox");
})();
