// Public positioning approved on 2026-09-14; keep website and generated descriptions aligned.
export const BRAND_NAME = "IKI Beauty & Wellness";
export const BRAND_DESCRIPTION = "IKI Beauty & Wellness là hệ sinh thái chăm sóc sức khỏe chủ động cho phụ nữ và gia đình thuộc HOPE CORP, kết nối kiến thức, công nghệ hỗ trợ cá nhân hóa, cộng đồng và sản phẩm.";
export const BRAND_SCOPE = "Định hướng Health Care và HealthTech: dinh dưỡng cân bằng, nghỉ ngơi, vận động, chăm sóc sắc đẹp và sức khỏe gia đình. Chăm da là một điểm chạm trong hệ sinh thái.";
export const APP_DESCRIPTION = "Ứng dụng IKI Beauty & Wellness đang được phát triển: ghi nhận làn da, chụp nhãn sản phẩm, xây thói quen và trò chuyện với trợ lý Tiểu Nhã. Tính năng và kênh phát hành được cập nhật tại trang ứng dụng.";
export const BRAND_LINKS = ["https://www.facebook.com/profile.php?id=61572357961785", "https://www.youtube.com/@ikibeautiful.wellness"];
export const LEGACY_APP_SLUGS = new Set(["app-iki-ca-nhan-hoa", "app-iki-lao-dong-hanh-tiet-khi", "app-iki-quet-bua-an-cham-am-duong", "app-iki-nhat-ky-30-giay-phan-tich"]);
export const ARCHIVE_NOTE = "Cập nhật 14/09/2026: Bài viết được lưu lại để tham khảo thiết kế ứng dụng IKI ở giai đoạn trước. Định hướng hiện tại là IKI Beauty & Wellness — hệ sinh thái chăm sóc sức khỏe chủ động cho phụ nữ và gia đình. Các tính năng, hình ảnh và giá trong bản cũ không phải thông tin phát hành của ứng dụng hiện tại.";
export function brandOrganization() {
  return { "@context": "https://schema.org", "@type": "Organization", "@id": "https://ikihealing.com/#organization", name: BRAND_NAME,
    alternateName: ["IKI", "IKI Healing", "IKI by HOPE CORP"], description: BRAND_DESCRIPTION,
    url: "https://ikihealing.com/", logo: "https://ikihealing.com/assets/brand/20260914/iki-avatar-hong-1024.png",
    parentOrganization: { "@type": "Organization", name: "CÔNG TY CỔ PHẦN TMDV HOPE", taxID: "0801404967" }, sameAs: BRAND_LINKS };
}
