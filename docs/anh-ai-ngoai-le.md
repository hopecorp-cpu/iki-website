# Ảnh AI — ngoại lệ

TH chốt 07/10/2026: 18 bài EXISTING và 366 ảnh hero không rõ nguồn gắn `anh_ai: true` và câu chú thích, trừ ảnh có bằng chứng là ảnh thật hoặc ảnh kho có giấy phép. Bằng chứng được nhận: code máy viết gọi Unsplash/Pexels cho đúng ảnh đó, EXIF máy ảnh (Make/Model) trong file, hoặc file gốc của IKI. Ảnh được trừ thì bỏ cờ; nếu giấy phép đòi ghi nguồn thì thêm credit.

Phạm vi: 383 file. 366 file trong danh sách không rõ nguồn, cộng 17 file `{slug}-hero.jpg` của nhóm EXISTING. Bài `lo-trinh-cham-soc-suc-khoe-nguoi-moi-bat-dau` dùng `assets/blog/lo-trinh-nguoi-moi-hero.jpg`, file này đã nằm trong 366.

## Kết quả rà

Không có ảnh nào trong 383 file đủ bằng chứng để loại. Không ảnh nào cần dòng ghi nguồn.

| Ảnh | Bằng chứng | Ghi nguồn nếu giấy phép đòi |
|---|---|---|
| _(không có)_ | | |

### Việc đã kiểm

1. **Script sinh ảnh.** `git blame` dòng EXISTING trong `scripts/gen-hero-images.mjs` (commit `ff2f3dea`): 18 bài cũ chỉ đóng logo lên ảnh có sẵn, không gọi nguồn ảnh. Nhánh generate chỉ gọi `https://image.pollinations.ai/prompt/`. `scripts/relogo-tmp.mjs` cũng chỉ gọi Pollinations. Không có script trong repo gọi Unsplash hay Pexels cho từng file hero của hai danh sách này.
2. **Lịch sử git.** `git log -S unsplash` và `-S pexels` không có commit nào gắn URL Unsplash/Pexels với `assets/blog/*-hero.jpg` của hai danh sách. Unsplash còn trong hướng dẫn trang marketing (`.claude/agents/html-builder.md`) và các trang ngoài blog hero này. Commit thêm ảnh blog ghi «máy viết blog tự động» hoặc «DAI research-first», không ghi giấy phép kho ảnh.
3. **EXIF.** `exiftool` 12.76 và `exif` 0.6.22 trên đúng file jpg hiện tại, và trên 445 blob lịch sử của `assets/blog/*-hero.jpg` (kể cả bản trước lần đóng logo `ff2f3dea`, vì lần đó nén lại bằng mozjpeg và gỡ metadata). Không file nào có thẻ Model. Make chỉ có ở 77 file, giá trị `sana` — model sinh ảnh (UserComment JSON có `"model":"sana"`), không phải hãng máy ảnh. Không có Artist, Copyright, hay Software của máy ảnh.
4. **File gốc IKI.** So SHA-256 với `assets/photos/`, `team-photos/`, `assets/san-pham/`, `assets/san-pham-shop/`. Không hero nào trong 383 file trùng ảnh sản phẩm, ảnh màn hình app, hay chân dung. Các file trùng tên trong `assets/iki-20260908/assets/` là bản sao cùng hero blog; một số mang Make `sana`.

## Ảnh không có trang hero

Hai file không bài nào hiển thị làm ảnh hero, nên không có câu chú thích.

| Ảnh | Ghi chú |
|---|---|
| `assets/blog/tra-tue-minh-la-gi-hero.jpg` | Không có bài và không có bản nháp trỏ tới file. |
| `assets/blog/dau-nanh-va-noi-tiet-to-nu-hero.jpg` | Chỉ còn bản nháp chuyển hướng `blog-drafts/_chuyen-huong/dau-nanh-va-noi-tiet-to-nu.md`. Bản nháp có `anh_ai: true`. Không có trang HTML. Không chèn câu chú thích vào bản nháp. |

## Trang chỉ hiện ảnh dạng thumbnail

Các trang dưới đây nhúng ảnh hero của danh sách này trong thẻ bài (nền card), trang chủ, hoặc Học Viện. Không thêm chú thích trên các trang này.

- `blog/danh-muc-bao-cao.html`
- `blog/danh-muc-cam-nang-suc-khoe.html`
- `blog/danh-muc-dinh-duong.html`
- `blog/danh-muc-dong-y.html`
- `blog/danh-muc-thoi-quen.html`
- `blog/danh-muc-thuc-pham.html`
- `blog/moi-quan-tam.html`
- `en/blog/danh-muc-dinh-duong.html`
- `en/blog/danh-muc-dong-y.html`
- `en/blog/danh-muc-thoi-quen.html`
- `en/blog/danh-muc-thuc-pham.html`
- `en/blog/moi-quan-tam.html`
- `en/hoc-vien.html`
- `en/index.html`
- `hoc-vien.html`
- `index.html`
- `ja/blog/danh-muc-dinh-duong.html`
- `ja/blog/danh-muc-dong-y.html`
- `ja/blog/danh-muc-thoi-quen.html`
- `ja/blog/danh-muc-thuc-pham.html`
- `ja/blog/moi-quan-tam.html`
- `ja/hoc-vien.html`
- `ja/index.html`

## Cờ và chú thích đã gắn

- 201 bản nháp có hero thuộc danh sách: thêm `"anh_ai": true` trong frontmatter. Không chèn câu chú thích vào thân bản nháp.
- Trang bài có ảnh đó làm hero: VI 382, EN 50, JA 40. Câu chữ: «Ảnh minh hoạ được tạo bằng AI.» / «AI-generated illustration.» / 「AIで生成したイラストです。」
- 182 bài tiếng Việt không có file `blog-drafts/<slug>.md` (máy viết commit thẳng HTML). Những bài này có chú thích trên trang; không có frontmatter để đặt cờ. Workflow Build blog không dựng lại chúng vì không có bản nháp đổi.
