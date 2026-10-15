/* NGƯỜI KÝ, NGƯỜI TRÌNH điền vào tệp Word tạo sẵn (nút "Tạo thư mục và tệp mẫu")
 * ----------------------------------------------------------------------------
 * Tệp này lên GitHub nên chỉ để chỗ trống. Điền tên thật vào tệp
 *   config/nguoi-ky.local.js   (không lên GitHub, đã có trong .gitignore)
 * với nội dung giống hệt dưới đây, chỉ đổi phần trong ngoặc kép.
 * Mỗi phường, mỗi phòng dùng web thì tự điền tên của mình.
 */
window.NGUOI_KY = Object.assign({
  NGUOI_TRINH: "[Họ tên người trình]",          // ký "Người trình" trên phiếu trình
  TEN_LUU: "[tên]",                             // "Lưu: VT, VHXH (tên)"
  LD_PHONG: "[Họ tên lãnh đạo phòng]",          // KT. Trưởng phòng / Phó Trưởng phòng
  VAN_PHONG: "[Họ tên bộ phận văn phòng]",      // ô ý kiến bộ phận văn phòng
  PCT: "[Họ tên Phó Chủ tịch phụ trách]",       // KT. Chủ tịch / Phó Chủ tịch
  CT: "[Họ tên Chủ tịch]",                      // ô ý kiến Chủ tịch UBND
}, window.NGUOI_KY || {});
