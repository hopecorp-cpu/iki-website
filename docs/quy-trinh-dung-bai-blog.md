# Quy trình dựng bài blog — đọc trước khi chạy build bằng tay

Ghi ngày 20/09/2026 sau khi một lượt sửa bài suýt làm mất pop-up thu email và làm lùi tên
thương hiệu. Máy tự động (`.github/workflows/build-blog.yml`) chạy đủ các bước dưới; người chạy
tay hay dừng ở bước 1 rồi push luôn.

## Bốn bước, không được bỏ bước nào

```bash
# 1. Dựng bài. Nhiều file thì đi qua xargs (zsh KHÔNG tách biến thành nhiều tham số).
grep -l '"no_product"' blog-drafts/*.md | xargs node scripts/build-article.mjs
#    hoặc: node scripts/build-article.mjs blog-drafts/<slug>.md

# 2. Dựng trang tài liệu. Thiếu bước này thì sitemap.xml MẤT 3 địa chỉ /tai-lieu/.
node scripts/build-tailieu.mjs

# 3. Đồng bộ chân trang. Thiếu thì mất dòng <link> nạp footer.css.
python3 scripts/sync-footer.py

# 4. Đồng bộ định vị thương hiệu. Thiếu thì og:site_name LÙI về tên cũ.
node scripts/sync-brand-positioning.mjs
```

Về bước 4: bốn file dựng (`build-article`, `build-structure`, `build-tailieu`, `build-san-pham`)
vẫn ghi cứng tên cũ trong thẻ `og:site_name`. Chính `sync-brand-positioning.mjs` mới là chỗ sửa
lại thành tên hiện tại, lấy từ `scripts/brand-profile.mjs`. Nên nếu thấy diff đổi `og:site_name`
thì đó là dấu hiệu thiếu bước 4, không phải scripts cũ hơn bản đã đăng.

## Kiểm sau khi dựng

```bash
grep -c ikiExit blog/<slug>.html     # phải > 0 — đây là pop-up tặng ebook, chỗ thu thông tin khách
grep -c '<loc>' sitemap.xml          # phải giữ nguyên số địa chỉ, không được giảm
git diff --stat                      # nhìn số dòng: sửa vài chữ mà ra vài trăm dòng là có gì đó sai
```

## Cờ `no_product` trong frontmatter

13 bài đang cắm cờ này: 10 bài cẩm nang bệnh và 3 bài lộ trình. Đây là chủ ý, không phải thiếu sót.

- Bài có cờ: **không** khối giới thiệu sản phẩm, **không** link cửa hàng, nhưng **vẫn có** pop-up
  tặng ebook. Từ 20/09/2026 `taoPopup` nhận tham số thứ ba để gỡ riêng hai khối mời sản phẩm.
- Muốn đổi định vị một bài có cờ thì hỏi trước, vì đó là quyết định nội dung chứ không phải lỗi.

## Bài không có draft `.md`

Nhiều bài cũ chỉ có `blog/<slug>.html`, không có nguồn trong `blog-drafts/`. Sửa những bài đó thì
**sửa thẳng HTML**, đừng chạy build. Kiểm lại bằng số từ trước và sau:

```bash
git show HEAD:blog/<slug>.html | python3 -c "import sys,re;h=sys.stdin.read();t=re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S);print(len(re.sub(r'<[^>]+>',' ',t).split()))"
```

Đếm thẻ `<p>` bằng `b.count("<p>")` sẽ ra kết quả sai vì bỏ sót `<p class=...>`. Dùng
`re.findall(r'<p[ >]', b)`.
