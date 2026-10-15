/*
 * HƯỚNG XỬ LÝ VĂN BẢN ĐẾN
 * ----------------------------------------------------------------------------
 * Khi bấm "Xử lý" một văn bản đến, web đọc trích yếu, so với "tuKhoa" bên dưới
 * để gợi ý cần làm gì. Người dùng luôn chọn lại được.
 *
 * han:       số ngày làm mặc định kể từ ngày đến (khẩn tối đa 3 ngày, hỏa tốc 1 ngày)
 * sanPham:   văn bản phải soạn
 * hoSo:      bộ hồ sơ trình ký đi kèm
 * thuMuc:    thư mục loại trong congviec/2026 P.Gia Định/
 * suKien:    true = có ngày tham dự (tập huấn, họp...) cần đưa lên lịch
 * choXem:    true = chưa biết làm gì, chuyển sang mục "Chờ xem xét" cho công chức
 * Thêm hướng mới: chép một mục, đổi id, sửa từ khóa.
 */
window.HUONG_XU_LY = [
  {
    id: "bao-cao", ten: "Làm báo cáo", ngan: "Báo cáo",
    sanPham: "Báo cáo của UBND phường (…/BC-UBND), kèm phụ lục nếu Sở có mẫu",
    hoSo: ["Báo cáo", "Phụ lục theo mẫu (nếu có)", "Tờ trình (TTr_)", "Phiếu trình (PTr_)", "Phiếu trình 5 ô (PTr_5o_)"],
    thuMuc: "BÁO CÁO", han: 5,
    tuKhoa: ["báo cáo", "tình hình", "kết quả thực hiện", "kết quả triển khai", "định kỳ", "sơ kết", "tổng kết"],
  },
  {
    id: "tra-loi", ten: "Trả lời, cung cấp thông tin", ngan: "Trả lời",
    sanPham: "Công văn của UBND phường (…/UBND) hoặc của phòng (…/PVHXH)",
    hoSo: ["Công văn", "Danh sách, biểu mẫu kèm theo (nếu có)", "Tờ trình (TTr_)", "Phiếu trình (PTr_)", "Phiếu trình 5 ô (PTr_5o_)"],
    thuMuc: "CÔNG VĂN", han: 5,
    tuKhoa: ["cung cấp", "rà soát", "thống kê", "số liệu", "đăng ký", "đề cử", "đề xuất", "nhu cầu", "danh sách"],
  },
  {
    id: "gop-y", ten: "Góp ý dự thảo", ngan: "Góp ý",
    sanPham: "Công văn góp ý (…/UBND)",
    hoSo: ["Công văn góp ý", "Tờ trình (TTr_)", "Phiếu trình (PTr_)", "Phiếu trình 5 ô (PTr_5o_)"],
    thuMuc: "GÓP Ý", han: 5,
    tuKhoa: ["góp ý", "lấy ý kiến", "dự thảo"],
  },
  {
    id: "ke-hoach", ten: "Ban hành kế hoạch triển khai tại phường", ngan: "Kế hoạch",
    sanPham: "Kế hoạch của UBND phường (…/KH-UBND)",
    hoSo: ["Kế hoạch", "Tờ trình (TTr_)", "Phiếu trình (PTr_)", "Phiếu trình 5 ô (PTr_5o_)"],
    thuMuc: "KẾ HOẠCH", han: 10,
    tuKhoa: ["kế hoạch", "phong trào", "đề án", "chương trình", "hưởng ứng", "chiến lược"],
  },
  {
    id: "trien-khai", ten: "Công văn triển khai đến đơn vị, khu phố", ngan: "Triển khai",
    sanPham: "Công văn triển khai (…/UBND) gửi các phòng, khu phố, trường học, đơn vị",
    hoSo: ["Công văn triển khai", "Tờ trình (TTr_)", "Phiếu trình (PTr_)", "Phiếu trình 5 ô (PTr_5o_)"],
    thuMuc: "CÔNG VĂN", han: 7,
    tuKhoa: ["triển khai", "hướng dẫn", "thông tư", "nghị định", "nghị quyết", "đôn đốc", "thực hiện"],
  },
  {
    id: "quyet-dinh", ten: "Ban hành quyết định", ngan: "Quyết định",
    sanPham: "Quyết định của UBND phường (…/QĐ-UBND)",
    hoSo: ["Quyết định", "Danh sách kèm theo (nếu có)", "Tờ trình (TTr_)", "Phiếu trình (PTr_)", "Phiếu trình 5 ô (PTr_5o_)"],
    thuMuc: "QUYẾT ĐỊNH", han: 10,
    tuKhoa: ["thành lập", "kiện toàn", "quy chế", "ban hành quy định", "phân công"],
  },
  {
    id: "tham-du", ten: "Cử người tham dự (tập huấn, họp, hội nghị)", ngan: "Tham dự",
    sanPham: "Danh sách hoặc công văn cử người; đưa ngày tham dự lên lịch",
    hoSo: ["Danh sách cử người (nếu cần gửi)", "Phiếu trình xin ý kiến lãnh đạo"],
    thuMuc: "thư mời", han: 2, suKien: true,
    tuKhoa: ["tập huấn", "hội nghị", "giấy mời", "đào tạo", "bồi dưỡng", "hội thảo", "họp", "khóa học", "nhân sự tham gia"],
  },
  {
    id: "de-biet", ten: "Để biết, lưu hồ sơ", ngan: "Để biết",
    sanPham: "Không cần soạn văn bản. Đọc, ghi chú nội dung liên quan, kết thúc trên qlvb",
    hoSo: [],
    thuMuc: "thông tin xem", han: 3,
    tuKhoa: ["danh mục", "công bố", "phê duyệt", "thông báo kế hoạch tài trợ", "định hướng"],
  },
  {
    id: "cho-xem-xet", ten: "Chưa rõ cần làm gì, để công chức xem", ngan: "Chờ xem xét",
    sanPham: "Chưa xác định. Công chức phụ trách mở văn bản, chọn lại hướng xử lý",
    hoSo: [],
    thuMuc: "", han: 2, choXem: true,
    tuKhoa: [],
  },
  {
    id: "chuyen", ten: "Không thuộc mảng, đề nghị chuyển", ngan: "Chuyển",
    sanPham: "Báo văn thư hoặc lãnh đạo phòng để chuyển đúng người xử lý",
    hoSo: [],
    thuMuc: "", han: 1,
    tuKhoa: [],
  },
];

/* Các mảng của phòng (dùng cho danh mục báo cáo) */
window.MANG = [
  "KHCN – ĐMST – CĐS", "Văn hóa – Thể thao", "Du lịch", "Giáo dục", "Y tế",
  "Nội vụ", "Thi đua – Khen thưởng", "Chung của phòng",
];

/* Loại lịch ngoài văn bản */
window.LOAI_LICH = [
  { id: "viec", ten: "Việc cần làm", mau: "amber" },
  { id: "tap-huan", ten: "Tập huấn", mau: "violet" },
  { id: "hop", ten: "Họp", mau: "violet" },
  { id: "hoi-nghi", ten: "Hội nghị, sự kiện", mau: "violet" },
  { id: "kiem-tra", ten: "Kiểm tra, khảo sát", mau: "violet" },
  { id: "khac", ten: "Khác", mau: "violet" },
];
