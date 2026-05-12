# Team Photos

Thư mục chứa ảnh chân dung đội ngũ HOPE CORP — hiển thị trên trang `/team.html`.

## File cần upload (3 ảnh)

| Tên file | Người | Ghi chú |
|---|---|---|
| `nguyen-van-hung.jpg` | Nguyễn Văn Hưng (CEO/Founder) | Ảnh dùng cho team page + investor materials |
| `pham-ngoc-thanh-tam.jpg` | Phạm Ngọc Thanh Tâm (COO/Founder) | — |
| `nguyen-hoang-hai.jpg` | Nguyễn Hoàng Hải (Board Member) | — |

## Yêu cầu ảnh

- **Định dạng**: JPG hoặc PNG
- **Kích thước**: tối thiểu 400×400px, lý tưởng 800×800px
- **Tỉ lệ**: 1:1 (vuông) — sẽ được crop thành hình tròn trên web
- **Chất lượng**: chuyên nghiệp, ánh sáng tốt, background sạch
- **Dung lượng**: dưới 500KB/ảnh (compress qua tinyjpg.com nếu lớn)

## Fallback nếu chưa có ảnh

Trang `/team.html` đã có **fallback CSS**: nếu file ảnh không tồn tại, sẽ hiển thị viết tắt tên (vd: "HN", "TT", "HH") trên background gradient lime/teal — vẫn professional.

## Cách upload

1. Lưu 3 ảnh vào thư mục này với đúng tên file
2. `git add team-photos/*.jpg`
3. `git commit -m "Add team photos"`
4. `git push origin main`
5. Đợi GitHub Pages rebuild (~1-2 phút)
6. F5 https://ikihealing.com/team.html → ảnh xuất hiện

## Future expansion

Khi có thêm thành viên (Health Coach team, Engineering team, etc.), tạo:
- `health-coach-1.jpg`, `health-coach-2.jpg`, ...
- `cto.jpg`, `engineer-1.jpg`, ...
- Hoặc subfolder `team-photos/health-coach/`, `team-photos/engineering/`

Update `team.html` để render thêm cards tương ứng.
