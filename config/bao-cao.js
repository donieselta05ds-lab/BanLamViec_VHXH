/*
 * DANH MỤC BÁO CÁO
 * ----------------------------------------------------------------------------
 * Mỗi báo cáo là một mục trong danh sách dưới đây. Muốn thêm báo cáo mới,
 * chép một mục có sẵn, đổi id và sửa thông tin. Lịch tự sinh các kỳ báo cáo.
 *
 * chuKy (chu kỳ):
 *   { loai: "tuan",  chot: 2, han: 3 }        // thứ trong tuần: 0 = CN, 1 = T2 ... 6 = T7
 *   { loai: "thang", han: 16 }                // ngày trong tháng
 *   { loai: "quy",   han: 10 }                // ngày ... của tháng đầu quý sau
 *   { loai: "nam",   thang: 12, han: 15 }     // ngày, tháng trong năm
 *   { loai: "dot-xuat" }                      // không lặp lại, nhập hạn ở "Việc"
 *   Để han: null nếu chưa biết hạn. Báo cáo vẫn hiện trong tab "Báo cáo"
 *   với nhãn "Cần xác nhận hạn" và chưa đưa lên lịch.
 *
 * xacNhan: true  = lịch đã đúng theo văn bản chỉ đạo
 *          false = lịch đang là gợi ý (suy ra từ các kỳ trước)
 *
 * deCuong:    các mục nội dung cần có trong báo cáo (để biết soạn gì)
 * nguonSoLieu: lấy số liệu ở đâu
 * Báo cáo thêm bằng nút "+ Thêm báo cáo" trên web được lưu trong trình duyệt;
 * dùng "Sao lưu" để xuất ra tệp, hoặc chép vào danh sách dưới đây cho cố định.
 *
 * mang: mảng phụ trách. Sau này mỗi mảng của phòng thêm báo cáo của mình
 *       với mang tương ứng, ví dụ "Văn hóa – Thể thao", "Y tế", "Giáo dục".
 */
window.BAO_CAO = [
  {
    id: "bc-tuan-kh40",
    ten: "BC tuần kết quả CĐS theo KH 40-KH/BCĐTP",
    mang: "KHCN – ĐMST – CĐS",
    noiNhan: "Sở Khoa học và Công nghệ",
    canCu: "7226/SKHCN-CĐS",
    chuKy: { loai: "tuan", chot: 2, han: 3 },
    xacNhan: false,
    ghiChu: "Kỳ từ thứ Ba tuần trước đến thứ Ba tuần này. Các kỳ trước phát hành thứ Tư đến thứ Sáu.",
    deCuong: ["Kết quả thực hiện trong tuần: văn bản đã ban hành, hoạt động đã tổ chức", "Số liệu theo Phụ lục I, Phụ lục II của Sở", "Nhiệm vụ tuần tới", "Khó khăn, vướng mắc, đề xuất"],
    nguonSoLieu: "Văn bản đi đã phát hành trong kỳ trên qlvb; số liệu Tổ CNS cộng đồng, VNeID từ khu phố, Công an phường",
    mau: "templates/bc-tuan-kh40/",
  },
  {
    id: "bc-tuan-100-ngay",
    ten: "BC tuần Kế hoạch hành động 100 ngày",
    mang: "KHCN – ĐMST – CĐS",
    noiNhan: "Văn phòng Đảng ủy phường",
    canCu: "147-CV/VPĐU",
    chuKy: { loai: "tuan", chot: 2, han: 3 },
    xacNhan: false,
    ghiChu: "Đi cùng BC tuần KH40, cùng kỳ số liệu.",
    deCuong: ["Kết quả xử lý các điểm nghẽn về CĐS trong tuần", "Tiến độ các nhiệm vụ của Kế hoạch 100 ngày", "Nhiệm vụ tuần tới", "Khó khăn, đề xuất"],
    nguonSoLieu: "Văn bản đi trong kỳ; báo cáo tuần KH40 cùng kỳ",
    mau: "templates/bc-tuan-100-ngay/",
  },
  {
    id: "chi-so-cds-thang",
    ten: "Số liệu, tài liệu kiểm chứng Chỉ số chuyển đổi số hằng tháng",
    mang: "KHCN – ĐMST – CĐS",
    noiNhan: "Sở Khoa học và Công nghệ",
    canCu: "7079/SKHCN-CĐS",
    chuKy: { loai: "thang", han: 16 },
    xacNhan: false,
    ghiChu: "Tháng 9 gửi bằng 897/PVHXH ngày 18/09.",
    deCuong: ["Số liệu các chỉ tiêu Chỉ số CĐS theo biểu của Sở", "Tài liệu kiểm chứng: văn bản, hình ảnh, đường dẫn"],
    nguonSoLieu: "Văn bản đi trong tháng; số liệu dịch vụ công trực tuyến, VNeID",
    mau: "templates/chi-so-cds-thang/",
  },
  {
    id: "bc-thang",
    ten: "Báo cáo tháng (số liệu tháng trước)",
    mang: "KHCN – ĐMST – CĐS",
    noiNhan: "Cần xác nhận",
    canCu: "",
    chuKy: { loai: "thang", han: null },
    xacNhan: false,
    ghiChu: "Lấy văn bản đi đã phát hành của tháng trước, viết theo văn phong báo cáo tháng trước.",
    deCuong: ["Kết quả thực hiện trong tháng theo từng nhóm: KHCN, ĐMST, CĐS", "Văn bản đã tham mưu ban hành (số, ngày, trích yếu)", "Nhiệm vụ tháng tới", "Khó khăn, đề xuất"],
    nguonSoLieu: "Văn bản đi đã phát hành tháng trước (có số, ngày, đã đóng dấu) trên qlvb",
    mau: "templates/bc-thang/",
  },
  {
    id: "bc-nq57",
    ten: "Báo cáo định kỳ kết quả thực hiện Nghị quyết 57",
    mang: "KHCN – ĐMST – CĐS",
    noiNhan: "Công an Thành phố",
    canCu: "6405/CQTT",
    chuKy: { loai: "quy", han: null },
    xacNhan: false,
    ghiChu: "Chưa rõ chu kỳ. Tờ trình gần nhất 2402/TTr-PVHXH ngày 07/10.",
    mau: "",
  },
  {
    id: "ra-soat-thu-dien-tu",
    ten: "Rà soát tình hình sử dụng thư điện tử Thành phố",
    mang: "KHCN – ĐMST – CĐS",
    noiNhan: "Sở Khoa học và Công nghệ",
    canCu: "10608/SKHCN-CĐS (quý III/2026)",
    chuKy: { loai: "quy", han: null },
    xacNhan: false,
    ghiChu: "Theo quý. Quý III gửi 954/PVHXH ngày 01/10.",
    mau: "",
  },
  {
    id: "bc-quy",
    ten: "Báo cáo quý",
    mang: "KHCN – ĐMST – CĐS",
    noiNhan: "Cần xác nhận",
    canCu: "",
    chuKy: { loai: "quy", han: null },
    xacNhan: false,
    ghiChu: "",
    mau: "templates/bc-quy/",
  },
  {
    id: "bc-6-thang",
    ten: "Báo cáo 6 tháng",
    mang: "KHCN – ĐMST – CĐS",
    noiNhan: "Cần xác nhận",
    canCu: "",
    chuKy: { loai: "nam", thang: 6, han: null },
    xacNhan: false,
    ghiChu: "",
    mau: "templates/bc-6-thang/",
  },
  {
    id: "bc-9-thang",
    ten: "Báo cáo 9 tháng",
    mang: "KHCN – ĐMST – CĐS",
    noiNhan: "Cần xác nhận",
    canCu: "",
    chuKy: { loai: "nam", thang: 9, han: null },
    xacNhan: false,
    ghiChu: "",
    mau: "templates/bc-9-thang/",
  },
  {
    id: "bc-nam",
    ten: "Báo cáo năm",
    mang: "KHCN – ĐMST – CĐS",
    noiNhan: "Cần xác nhận",
    canCu: "",
    chuKy: { loai: "nam", thang: 12, han: null },
    xacNhan: false,
    ghiChu: "",
    mau: "templates/bc-nam/",
  },
];
