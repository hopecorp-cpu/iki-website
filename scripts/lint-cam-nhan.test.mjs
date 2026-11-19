import test from "node:test";
import assert from "node:assert/strict";
import { lintCamNhan } from "./lint-cam-nhan.mjs";

const loai = (text, name = "Chị A.") => lintCamNhan({ name, text }).map((x) => x.nhom);

test("chặn tên bệnh, triệu chứng, xét nghiệm, thuốc, bác sĩ, khỏi/hết, số cân", () => {
  assert.ok(loai("Uống xong đỡ đau dạ dày").includes("tên bệnh"));
  assert.ok(loai("Bệnh nhân K dùng thấy khoẻ").includes("tên bệnh"));
  assert.ok(loai("Hết đi ngoài phân nát").includes("triệu chứng"));
  assert.ok(loai("Mình bị tiêu hóa kém lâu năm").includes("triệu chứng")); // dấu kiểu cũ "hóa"
  assert.ok(loai("Xét nghiệm đường huyết đẹp hơn").includes("chỉ số xét nghiệm"));
  assert.ok(loai("Không phải uống thuốc nữa").includes("thuốc"));
  assert.ok(loai("Bác sĩ bảo dùng tiếp").includes("bác sĩ"));
  assert.ok(loai("Dùng một tháng là khỏi").includes("khỏi / hết"));
  assert.ok(loai("Mình xuống 3kg").includes("cân nặng"));
  assert.ok(loai("Mình lên cân rồi").includes("cân nặng"));
});

test("không bắt nhầm chữ thường ngày", () => {
  assert.deepEqual(loai("Ngày của mình có nhịp rõ ràng, uống đạm thực vật thấy dễ chịu.", "Anh K."), []);
  assert.deepEqual(loai("Món này giá trị dinh dưỡng cao, mình cẩn thận chọn đồ ăn truyền thống."), []);
  assert.deepEqual(loai("Chị uống sữa vào thấy ngủ ngon em ạ."), []);
});
