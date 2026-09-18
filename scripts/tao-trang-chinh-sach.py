"""Sinh bộ trang chính sách bắt buộc cho hồ sơ thông báo nền tảng TMĐT (Luật TMĐT 2025 + NĐ 248/2026, Điều 4-16).

Nội dung chính sách nằm TRONG file này (một nguồn); khung trang lấy từ chinh-sach-doi-tra.html bản gốc.
Chạy xong thì chạy scripts/sync-footer.py để footer đồng bộ.
"""
from pathlib import Path
import re, html

ROOT = Path(__file__).resolve().parents[1]
NGAY = "18/09/2026"
CTY = "CÔNG TY CỔ PHẦN TMDV HOPE"
DC = "Số 63/253 đường Ngô Quyền, phường Lê Thanh Nghị, thành phố Hải Phòng, Việt Nam"
MST = "0801404967"
GPKD = "Giấy chứng nhận đăng ký doanh nghiệp số 0801404967, đăng ký lần đầu ngày 23/08/2023, đăng ký thay đổi lần thứ 5 ngày 22/08/2026 tại Phòng Đăng ký kinh doanh – Sở Tài chính thành phố Hải Phòng"
HOTLINE = '<a href="tel:0987931551">098 793 1551</a>'
EMAIL = '<a href="mailto:contact@ikihealing.com">contact@ikihealing.com</a>'
ZALO = '<a href="https://zalo.me/599407064751177637">Zalo OA IKI</a>'

LIEN_HE = f"""<h2>Thông tin liên hệ</h2>
<p><strong>{CTY}</strong><br>{GPKD}.<br>Mã số thuế: {MST}<br>Địa chỉ: {DC}<br>
Điện thoại: {HOTLINE} (8h00–17h00, thứ Hai đến thứ Bảy)<br>Email: {EMAIL}</p>"""

TRANG = {}

TRANG["chinh-sach.html"] = ("Chính sách & Điều khoản", "Tổng hợp chính sách và điều khoản áp dụng khi mua hàng tại ikihealing.com — Công ty Cổ phần TMDV HOPE.", f"""
<p>Website <strong>ikihealing.com</strong> là nền tảng thương mại điện tử kinh doanh trực tiếp có chức năng đặt hàng trực tuyến của {CTY}. Các chính sách dưới đây áp dụng cho mọi đơn hàng đặt trên website.</p>
<ul>
<li><a href="dieu-khoan-su-dung.html">Điều khoản sử dụng</a> — thông tin chủ quản, quyền và nghĩa vụ các bên, điều kiện cung cấp hàng hoá</li>
<li><a href="chinh-sach-bao-mat.html">Chính sách bảo mật &amp; dữ liệu cá nhân</a></li>
<li><a href="chinh-sach-gia.html">Chính sách giá</a></li>
<li><a href="chinh-sach-thanh-toan.html">Chính sách thanh toán</a></li>
<li><a href="chinh-sach-giao-hang.html">Chính sách giao hàng &amp; kiểm hàng</a></li>
<li><a href="chinh-sach-doi-tra.html">Chính sách đổi trả &amp; hoàn tiền</a></li>
<li><a href="giai-quyet-khieu-nai.html">Tiếp nhận và giải quyết phản ánh, khiếu nại</a></li>
</ul>
{LIEN_HE}""")

TRANG["dieu-khoan-su-dung.html"] = ("Điều khoản sử dụng", "Điều khoản sử dụng website ikihealing.com: thông tin chủ quản, quyền và nghĩa vụ của IKI và khách hàng, điều kiện cung cấp hàng hoá.", f"""
<h2>1. Thông tin về chủ quản nền tảng</h2>
<p>Website ikihealing.com (thương hiệu IKI) do <strong>{CTY}</strong> (tên tiếng Anh: HOPE SERVICE CORPORATION, viết tắt HOPE CORP) sở hữu và vận hành.</p>
<ul>
<li>{GPKD}.</li>
<li>Mã số thuế: {MST}</li>
<li>Trụ sở: {DC}</li>
<li>Điện thoại: {HOTLINE} · Email: {EMAIL}</li>
<li>Người chịu trách nhiệm quản lý, vận hành: Ông Nguyễn Văn Hưng — Tổng Giám đốc.</li>
</ul>
<p>Website bán trực tiếp sản phẩm do HOPE CORP phân phối, không cho bên thứ ba mở gian hàng, không phải sàn giao dịch.</p>

<h2>2. Phạm vi áp dụng</h2>
<p>Khi truy cập, đăng ký nhận tin hoặc đặt hàng trên ikihealing.com, khách hàng đồng ý với các điều khoản này và các chính sách liên quan tại trang <a href="chinh-sach.html">Chính sách &amp; Điều khoản</a>. HOPE CORP có thể cập nhật điều khoản; bản cập nhật có hiệu lực kể từ ngày đăng trên website và không áp dụng ngược cho đơn hàng đã xác nhận trước đó.</p>

<h2>3. Quyền và nghĩa vụ của HOPE CORP</h2>
<ul>
<li>Cung cấp thông tin sản phẩm trung thực, đầy đủ: tên, thành phần, xuất xứ, quy cách, giá bán, cách dùng, bảo quản, số tự công bố sản phẩm.</li>
<li>Bán đúng sản phẩm, số lượng, giá đã xác nhận với khách hàng; giao hàng theo <a href="chinh-sach-giao-hang.html">chính sách giao hàng</a>.</li>
<li>Xuất hoá đơn điện tử theo quy định và theo yêu cầu của khách hàng.</li>
<li>Bảo mật thông tin khách hàng theo <a href="chinh-sach-bao-mat.html">chính sách bảo mật</a>.</li>
<li>Tiếp nhận và giải quyết phản ánh, khiếu nại theo <a href="giai-quyet-khieu-nai.html">quy trình đã công bố</a>.</li>
<li>Có quyền từ chối hoặc huỷ đơn hàng khi không liên lạc được với khách hàng, thông tin đặt hàng sai lệch, hoặc có dấu hiệu gian lận; khi huỷ đơn đã thanh toán, HOPE CORP hoàn lại toàn bộ số tiền.</li>
</ul>

<h2>4. Quyền và nghĩa vụ của khách hàng</h2>
<ul>
<li>Được cung cấp thông tin đầy đủ, chính xác về sản phẩm, giá và điều kiện giao dịch trước khi đặt hàng.</li>
<li>Được kiểm tra hàng khi nhận, đổi trả và hoàn tiền theo chính sách đã công bố.</li>
<li>Được bảo vệ dữ liệu cá nhân, được yêu cầu xem, sửa, xoá dữ liệu hoặc ngừng nhận tin.</li>
<li>Cung cấp thông tin đặt hàng (họ tên, số điện thoại, địa chỉ nhận hàng) chính xác và chịu trách nhiệm về thông tin đã cung cấp.</li>
<li>Thanh toán đầy đủ giá trị đơn hàng và phí giao hàng (nếu có) theo phương thức đã chọn.</li>
<li>Đọc kỹ thành phần, hướng dẫn sử dụng trên nhãn trước khi dùng. Sản phẩm là thực phẩm/thực phẩm bổ sung, không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh.</li>
</ul>

<h2>5. Quy trình đặt hàng</h2>
<ol>
<li>Chọn sản phẩm tại <a href="/shop/">Cửa hàng IKI</a>, chọn số lượng, bấm đặt hàng.</li>
<li>Điền họ tên, số điện thoại, địa chỉ nhận hàng và chọn phương thức thanh toán.</li>
<li>Nhân viên IKI gọi điện hoặc nhắn Zalo xác nhận đơn, báo phí giao hàng và thời gian giao dự kiến. Hợp đồng mua bán được xác lập khi khách hàng đồng ý với nội dung xác nhận.</li>
<li>Đơn hàng được đóng gói và bàn giao cho đơn vị vận chuyển.</li>
</ol>

<h2>6. Điều kiện hoặc hạn chế trong việc cung cấp hàng hoá</h2>
<ul>
<li>Website chỉ bán thực phẩm, thực phẩm bổ sung, trà thảo mộc, gia vị và đồ dùng thiết yếu đã được tự công bố theo quy định; không bán hàng cấm, hàng hạn chế kinh doanh.</li>
<li>Giao hàng trên toàn lãnh thổ Việt Nam; chưa giao ra nước ngoài.</li>
<li>Số lượng mỗi đơn có thể bị giới hạn theo tồn kho; khi hết hàng, nhân viên báo trước và khách hàng có quyền huỷ đơn không mất phí.</li>
<li>Chương trình tặng quà có điều kiện, thời hạn và số lượng quà ghi rõ tại từng chương trình; quà tặng không quy đổi thành tiền.</li>
<li>Đơn mua số lượng lớn hoặc mua để bán lại áp dụng chính sách đại lý riêng, liên hệ {HOTLINE}.</li>
</ul>

<h2>7. Ưu tiên hiển thị</h2>
<p>Website chỉ hiển thị sản phẩm của HOPE CORP. Thứ tự hiển thị do HOPE CORP sắp xếp theo nhóm sản phẩm và sản phẩm mới; không có dịch vụ trả phí để được ưu tiên hiển thị.</p>

<h2>8. Livestream bán hàng</h2>
<p>Website hiện không có chức năng livestream bán hàng. Khi HOPE CORP tổ chức livestream trên các mạng xã hội, thông tin sản phẩm, giá và quà tặng giới thiệu trong buổi phát sóng phải trùng với thông tin công bố trên website.</p>

<h2>9. Dịch vụ số (khoá học, thực đơn cá nhân hoá)</h2>
<p>Bên cạnh hàng hoá, website cung cấp một số dịch vụ số như khoá học trực tuyến và thực đơn theo thể trạng. Nội dung, thời lượng, giá và cách nhận dịch vụ được ghi tại trang giới thiệu từng dịch vụ. Dịch vụ được cung cấp qua email, Zalo hoặc ứng dụng IKI ngay sau khi thanh toán được xác nhận. Việc chấm dứt dịch vụ và hoàn tiền thực hiện theo mục "Dịch vụ số" trong <a href="chinh-sach-doi-tra.html">chính sách đổi trả &amp; hoàn tiền</a>.</p>

<h2>10. Luật áp dụng</h2>
<p>Điều khoản này được điều chỉnh theo pháp luật Việt Nam, bao gồm Luật Thương mại điện tử 2025, Luật Bảo vệ quyền lợi người tiêu dùng 2023 và các văn bản hướng dẫn.</p>
{LIEN_HE}""")

TRANG["chinh-sach-gia.html"] = ("Chính sách giá", "Chính sách giá tại ikihealing.com: giá niêm yết bằng VND, đã gồm thuế GTGT, cách tính phí giao hàng và quà tặng.", f"""
<ul>
<li>Giá sản phẩm niêm yết bằng Việt Nam đồng (VND) tại trang từng sản phẩm và là giá bán cuối cùng cho mỗi đơn vị sản phẩm, <strong>đã bao gồm thuế giá trị gia tăng (GTGT)</strong>.</li>
<li>Giá <strong>chưa bao gồm phí giao hàng</strong>. Phí giao hàng tính theo biểu phí của đơn vị vận chuyển, được nhân viên báo rõ khi xác nhận đơn và trước khi giao. Chương trình miễn phí giao hàng (nếu có) được ghi rõ điều kiện tại trang sản phẩm hoặc khi xác nhận đơn.</li>
<li>Ngoài giá sản phẩm và phí giao hàng đã báo, khách hàng không phải trả thêm khoản phí nào khác.</li>
<li>Giá áp dụng cho đơn hàng là giá hiển thị tại thời điểm đặt hàng. Nếu giá thay đổi sau khi đặt nhưng trước khi xác nhận, nhân viên thông báo lại và khách hàng có quyền huỷ đơn không mất phí.</li>
<li>Khuyến mãi của IKI thực hiện bằng hình thức <strong>tặng quà</strong> kèm đơn hàng; nội dung quà, điều kiện và thời hạn được công bố cụ thể cho từng chương trình.</li>
<li>Trường hợp giá hiển thị sai do lỗi kỹ thuật, HOPE CORP thông báo cho khách hàng trước khi giao; khách hàng được chọn tiếp tục mua theo giá đúng hoặc huỷ đơn, được hoàn lại toàn bộ số tiền đã thanh toán.</li>
<li>Hoá đơn điện tử được xuất theo giá trị đơn hàng thực tế. Khách hàng cần hoá đơn công ty vui lòng cung cấp tên, mã số thuế, địa chỉ khi xác nhận đơn.</li>
</ul>
{LIEN_HE}""")

TRANG["chinh-sach-thanh-toan.html"] = ("Chính sách thanh toán", "Các phương thức thanh toán tại ikihealing.com: thanh toán khi nhận hàng (COD) và chuyển khoản vào tài khoản công ty.", f"""
<h2>1. Thanh toán khi nhận hàng (COD)</h2>
<p>Khách hàng kiểm tra hàng khi nhận và thanh toán cho nhân viên giao hàng đúng số tiền đã được xác nhận (giá sản phẩm + phí giao hàng nếu có). Khách hàng không phải thanh toán thêm bất kỳ khoản nào khác.</p>

<h2>2. Chuyển khoản ngân hàng</h2>
<p>Khi chọn chuyển khoản trên website, hệ thống hiển thị mã QR thanh toán (qua cổng PayOS) với đúng số tiền của đơn. Khách hàng quét mã bằng ứng dụng ngân hàng; hệ thống tự xác nhận khi nhận được thanh toán. Khách hàng cũng có thể chuyển khoản trực tiếp vào tài khoản của công ty:</p>
<ul>
<li>Chủ tài khoản: <strong>CÔNG TY CỔ PHẦN TMDV HOPE</strong></li>
<li>Số tài khoản: <strong>5545566888</strong> — Ngân hàng TMCP Quân Đội (MB Bank)</li>
<li>Nội dung: mã đơn hàng hoặc số điện thoại đặt hàng + họ tên</li>
</ul>
<p>IKI <strong>chỉ nhận chuyển khoản vào tài khoản đứng tên công ty</strong> nêu trên. Khách hàng vui lòng không chuyển tiền vào tài khoản cá nhân dưới bất kỳ lý do nào.</p>

<h2>3. An toàn thanh toán</h2>
<ul>
<li>Website không yêu cầu và không lưu thông tin thẻ, mật khẩu hay mã OTP ngân hàng của khách hàng.</li>
<li>Giao dịch chuyển khoản do ngân hàng và cổng thanh toán được cấp phép xử lý.</li>
</ul>

<h2>4. Hoàn tiền</h2>
<p>Trường hợp đơn hàng bị huỷ hoặc đủ điều kiện hoàn tiền, HOPE CORP hoàn tiền bằng chuyển khoản vào tài khoản ngân hàng do khách hàng cung cấp trong vòng <strong>07 ngày làm việc</strong> kể từ khi xác nhận hoàn tiền. Chi tiết tại <a href="chinh-sach-doi-tra.html">chính sách đổi trả &amp; hoàn tiền</a>.</p>
{LIEN_HE}""")

TRANG["chinh-sach-giao-hang.html"] = ("Chính sách giao hàng & kiểm hàng", "Chính sách giao hàng của ikihealing.com: phạm vi, thời gian, phí giao hàng, trách nhiệm khi hàng hư hỏng và quy định kiểm hàng.", f"""
<h2>1. Phương thức và phạm vi giao hàng</h2>
<ul>
<li>Giao hàng toàn quốc qua đơn vị vận chuyển đối tác (hiện tại là J&amp;T Express), hoặc khách hàng nhận trực tiếp tại địa chỉ công ty sau khi hẹn trước.</li>
<li>Đơn mua số lượng lớn có thể giao theo thoả thuận riêng.</li>
</ul>

<h2>2. Thời gian giao hàng dự kiến</h2>
<ul>
<li>Đơn được bàn giao cho đơn vị vận chuyển trong 1–2 ngày làm việc sau khi xác nhận.</li>
<li>Khu vực Hải Phòng: 1–2 ngày. Các tỉnh, thành khác: thường 3–5 ngày.</li>
<li>Thời gian có thể kéo dài do thiên tai, dịch bệnh, dịp lễ Tết, không liên lạc được với người nhận hoặc địa chỉ không chính xác. Khi giao chậm, IKI thông báo cho khách hàng; khách hàng có quyền chọn tiếp tục chờ hoặc huỷ đơn và được hoàn lại tiền đã thanh toán.</li>
</ul>

<h2>3. Phí giao hàng</h2>
<p>Phí giao hàng theo biểu phí của đơn vị vận chuyển, tính theo khối lượng và địa chỉ nhận, được báo rõ khi xác nhận đơn. Chương trình miễn phí giao hàng (nếu có) ghi rõ điều kiện tại từng chương trình.</p>

<h2>4. Chứng từ và trách nhiệm trong giao nhận</h2>
<ul>
<li>Mỗi kiện hàng có thông tin người nhận (họ tên, số điện thoại, địa chỉ) và mã vận đơn để tra cứu hành trình.</li>
<li>Đơn vị vận chuyển chịu trách nhiệm giao hàng theo nguyên tắc nguyên đai, nguyên kiện.</li>
<li>Hàng hư hỏng, thất lạc trong quá trình vận chuyển do HOPE CORP đứng ra giải quyết với khách hàng (gửi lại hàng mới hoặc hoàn tiền); HOPE CORP tự làm việc với đơn vị vận chuyển về bồi thường.</li>
</ul>

<h2>5. Kiểm hàng khi nhận</h2>
<ul>
<li>Khách hàng được đồng kiểm với nhân viên giao hàng trước khi thanh toán: kiểm tra tên sản phẩm, số lượng, quà tặng, tình trạng bên ngoài của bao bì so với đơn đã xác nhận.</li>
<li>Vui lòng không bóc tem niêm phong của sản phẩm khi kiểm hàng.</li>
<li>Nếu hàng sai, thiếu, móp vỡ: khách hàng có quyền từ chối nhận, không thanh toán và báo ngay qua {HOTLINE}. Đơn đã thanh toán trước được gửi lại hàng đúng hoặc hoàn tiền theo lựa chọn của khách hàng.</li>
<li>Khuyến khích quay video khi mở kiện hàng để đối chiếu khi cần.</li>
</ul>
{LIEN_HE}""")

TRANG["chinh-sach-doi-tra.html"] = ("Chính sách đổi trả & Hoàn tiền", "Chính sách đổi trả của IKI — Công ty Cổ phần TMDV HOPE: điều kiện, thời hạn, quy trình đổi trả và hoàn tiền cho hàng hoá và dịch vụ số.", f"""
<h2>1. Trường hợp được đổi trả</h2>
<ul>
<li>Giao sai sản phẩm, sai số lượng, thiếu quà tặng so với đơn đã xác nhận.</li>
<li>Sản phẩm móp vỡ, rò rỉ, hư hỏng bao bì do vận chuyển.</li>
<li>Sản phẩm lỗi do sản xuất, hết hạn sử dụng hoặc không đúng thông tin công bố.</li>
<li>Khách hàng đổi ý: sản phẩm còn nguyên tem niêm phong, chưa mở, còn đủ quà tặng kèm.</li>
</ul>

<h2>2. Không áp dụng đổi trả</h2>
<ul>
<li>Sản phẩm đã mở niêm phong hoặc đã sử dụng mà không thuộc trường hợp lỗi do sản xuất (vì lý do an toàn vệ sinh thực phẩm).</li>
<li>Sản phẩm hư hỏng do bảo quản không đúng hướng dẫn trên nhãn sau khi đã nhận hàng.</li>
</ul>

<h2>3. Thời hạn</h2>
<ul>
<li>Sai hàng, thiếu hàng, móp vỡ: báo trong vòng <strong>48 giờ</strong> kể từ khi nhận hàng.</li>
<li>Khách hàng đổi ý (sản phẩm chưa mở): trong vòng <strong>7 ngày</strong> kể từ khi nhận hàng.</li>
<li>Lỗi do sản xuất: trong vòng <strong>30 ngày</strong> kể từ khi nhận hàng và còn trong hạn sử dụng.</li>
</ul>

<h2>4. Chi phí đổi trả</h2>
<ul>
<li>Lỗi do IKI hoặc do vận chuyển (sai hàng, thiếu hàng, móp vỡ, lỗi sản xuất): HOPE CORP chịu toàn bộ phí vận chuyển hai chiều.</li>
<li>Khách hàng đổi ý: khách hàng chịu phí gửi trả hàng.</li>
</ul>

<h2>5. Quy trình</h2>
<ol>
<li>Liên hệ {HOTLINE}, {ZALO} hoặc {EMAIL}, cung cấp số điện thoại đặt hàng, mã vận đơn, mô tả tình trạng kèm ảnh hoặc video.</li>
<li>IKI xác nhận yêu cầu trong vòng 24 giờ làm việc và hướng dẫn cách gửi trả (nếu cần).</li>
<li>Sau khi nhận lại hàng và kiểm tra, IKI gửi sản phẩm thay thế trong 3–5 ngày làm việc, hoặc hoàn tiền theo lựa chọn của khách hàng.</li>
</ol>

<h2>6. Hoàn tiền</h2>
<ul>
<li>Hoàn tiền bằng chuyển khoản vào tài khoản ngân hàng do khách hàng cung cấp, trong vòng <strong>07 ngày làm việc</strong> kể từ khi IKI xác nhận đủ điều kiện hoàn tiền.</li>
<li>Số tiền hoàn gồm giá trị sản phẩm trả lại; phí giao hàng được hoàn khi lỗi thuộc về IKI hoặc đơn vị vận chuyển.</li>
<li>Quà tặng kèm đơn phải được trả lại cùng sản phẩm chính; quà tặng không quy đổi thành tiền.</li>
</ul>

<h2>7. Dịch vụ số (khoá học, thực đơn cá nhân hoá)</h2>
<ul>
<li>Khách hàng có thể trải nghiệm nội dung miễn phí trước khi đăng ký gói trả phí.</li>
<li>Khách hàng được huỷ và hoàn tiền 100% nếu yêu cầu trước khi dịch vụ được kích hoạt hoặc gửi nội dung.</li>
<li>Dịch vụ đã kích hoạt hoặc đã gửi nội dung không hoàn tiền; nếu gặp trở ngại khi sử dụng, IKI hỗ trợ bảo lưu hoặc chuyển đổi sang gói phù hợp.</li>
<li>Trường hợp IKI không cung cấp được dịch vụ như đã cam kết, IKI chấm dứt dịch vụ và hoàn tiền phần chưa sử dụng trong vòng 07 ngày làm việc.</li>
</ul>
{LIEN_HE}""")

TRANG["giai-quyet-khieu-nai.html"] = ("Tiếp nhận và giải quyết khiếu nại", "Phương thức tiếp nhận và quy trình giải quyết phản ánh, yêu cầu, khiếu nại của khách hàng tại ikihealing.com.", f"""
<h2>1. Kênh tiếp nhận</h2>
<ul>
<li>Điện thoại: {HOTLINE} (8h00–17h00, thứ Hai đến thứ Bảy)</li>
<li>Email: {EMAIL}</li>
<li>Nhắn tin: {ZALO} (khung chat ở góc phải mọi trang của website)</li>
<li>Trực tiếp hoặc bằng văn bản gửi về: {CTY}, {DC}</li>
</ul>

<h2>2. Quy trình giải quyết</h2>
<ol>
<li><strong>Tiếp nhận:</strong> khách hàng nêu nội dung phản ánh, khiếu nại kèm thông tin đơn hàng (số điện thoại đặt hàng, mã vận đơn) và hình ảnh, video liên quan (nếu có).</li>
<li><strong>Xác nhận:</strong> IKI xác nhận đã nhận yêu cầu trong vòng <strong>24 giờ làm việc</strong>.</li>
<li><strong>Xử lý:</strong> IKI kiểm tra, làm rõ và đưa ra phương án giải quyết trong vòng <strong>03 ngày làm việc</strong> kể từ khi nhận đủ thông tin; trường hợp phức tạp cần xác minh với nhà sản xuất hoặc đơn vị vận chuyển, IKI thông báo thời hạn cụ thể nhưng không quá 07 ngày làm việc.</li>
<li><strong>Kết quả:</strong> IKI thông báo kết quả cho khách hàng qua kênh khách hàng đã liên hệ và thực hiện phương án đã thống nhất (đổi hàng, hoàn tiền, bồi thường theo quy định).</li>
</ol>

<h2>3. Nguyên tắc</h2>
<ul>
<li>Mọi phản ánh được ghi nhận và phản hồi, kể cả khi chưa có đơn hàng.</li>
<li>Thông tin khách hàng cung cấp khi khiếu nại được bảo mật theo <a href="chinh-sach-bao-mat.html">chính sách bảo mật</a>.</li>
<li>Ưu tiên thương lượng, hoà giải. Trường hợp không thống nhất được, khách hàng có quyền yêu cầu cơ quan quản lý nhà nước có thẩm quyền, tổ chức xã hội bảo vệ quyền lợi người tiêu dùng hoà giải, hoặc khởi kiện tại Toà án theo quy định pháp luật.</li>
</ul>
{LIEN_HE}""")


def dung_trang(ten, tieude, mota, noidung, khung):
    slug = ten
    t = khung
    t = re.sub(r"<title>.*?</title>", f"<title>{html.escape(tieude)} · IKI Healing</title>", t, 1)
    t = re.sub(r'<meta name="description" content="[^"]*"', f'<meta name="description" content="{html.escape(mota)}"', t, 1)
    t = t.replace("https://ikihealing.com/chinh-sach-doi-tra.html", f"https://ikihealing.com/{slug}")
    t = re.sub(r'<meta property="og:title" content="[^"]*"', f'<meta property="og:title" content="{html.escape(tieude)} — IKI"', t, 1)
    t = re.sub(r'<meta property="og:description" content="[^"]*"', f'<meta property="og:description" content="{html.escape(mota)}"', t, 1)
    hero = f'''<section class="page-hero">
    <div class="container">
      <div class="crumbs">
        <a href="index.html">Trang chủ</a><span>›</span><a href="chinh-sach.html">Chính sách</a><span>›</span><span>{html.escape(tieude)}</span>
      </div>
      <span class="eyebrow">Cam kết minh bạch</span>
      <h1>{html.escape(tieude)}</h1>
      <p>Cập nhật lần cuối: {NGAY} · Áp dụng cho đơn hàng đặt trên ikihealing.com.</p>
    </div>
  </section>'''
    t = re.sub(r'<section class="page-hero">[\s\S]*?</section>', hero, t, 1)
    t = re.sub(r'(<article class="policy-content">)[\s\S]*?(</article>)', lambda m: m.group(1) + noidung + "\n      " + m.group(2), t, 1)
    return t


if __name__ == "__main__":
    import subprocess
    # Khung lấy từ bản đã commit (trang đổi trả bị ghi đè ngay trong vòng lặp này)
    khung = subprocess.run(["git", "show", "HEAD:chinh-sach-doi-tra.html"], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    for ten, (tieude, mota, nd) in TRANG.items():
        (ROOT / ten).write_text(dung_trang(ten, tieude, mota, nd, khung))
        print(ten)
