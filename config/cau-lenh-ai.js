/* CÂU LỆNH MẪU CHO AI (dùng trong khung Trợ lý)
 * ----------------------------------------------------------------------------
 * Trợ lý điền sẵn thông tin văn bản vào các mẫu dưới đây, bạn bấm "Sao chép"
 * rồi dán vào công cụ AI bạn dùng (ChatGPT, Gemini, Claude…).
 * Chỗ {ten} sẽ được thay bằng dữ liệu thật; chỗ [ ] là phần bạn tự điền.
 * Sửa câu chữ ngay trong tệp này, lưu lại, tải lại web là dùng được.
 *
 * NHẮC: không dán văn bản mật, nội dung tôn giáo - dân tộc, thông tin cá nhân
 * của người dân vào công cụ AI.
 */
window.CAU_LENH = {
  vanPhong: [
    "QUY ƯỚC VĂN PHONG PHƯỜNG GIA ĐỊNH",
    "- Thể thức theo Nghị định 30/2020/NĐ-CP.",
    "- Mở đầu: \"Thực hiện [loại văn bản] số … ngày … của … về việc …\" hoặc chuỗi \"Căn cứ …;\" (kế hoạch, quyết định).",
    "- Viết đủ tên cơ quan trong thân bài (Ủy ban nhân dân phường Gia Định, Sở Khoa học và Công nghệ); chỉ viết tắt ở Nơi nhận.",
    "- Viết \"Ủy\", không viết \"Uỷ\"; \"Nhân dân\" viết hoa.",
    "- Đoạn cuối kết thúc bằng \"./.\".",
    "- Ngày tháng đầu văn bản để trống: \"Gia Định, ngày   tháng   năm 2026\".",
    "- Không bịa số liệu, số văn bản, điều luật; chỗ chưa có thì để [ ].",
  ].join("\n"),

  mau: {
    "tom-tat": {
      ten: "Đọc văn bản đến: cần làm gì",
      noiDung: `Bạn là chuyên viên Phòng Văn hóa - Xã hội, Ủy ban nhân dân phường Gia Định.
Văn bản đến: {so}, ngày đến {den}, của {noi}, độ khẩn: {khan}.
Trích yếu: {ty}
Nội dung yêu cầu (dán phần yêu cầu, đã bỏ thông tin cá nhân): [ ]
Hãy trả lời ngắn:
1. Văn bản yêu cầu phường làm gì (báo cáo, trả lời, góp ý, ban hành kế hoạch, triển khai, cử người tham dự, để biết)?
2. Hạn chót, nơi nhận kết quả, hình thức gửi.
3. Việc cần chuẩn bị, xếp theo thứ tự.
4. Đơn vị nào của phường cần phối hợp.
Chỉ dựa vào nội dung đã dán, không suy đoán.`,
    },
    "tra-loi": {
      ten: "Công văn báo cáo, trả lời cấp trên",
      noiDung: `Bạn là chuyên viên Phòng Văn hóa - Xã hội, Ủy ban nhân dân phường Gia Định.
Soạn công văn của Ủy ban nhân dân phường (Số: /UBND-VHXH) gửi {noi}.
Căn cứ: Công văn số {so} ngày {den} của {noi} về {ty}.
Kết quả cần báo cáo: [gạch đầu dòng các kết quả, số liệu]
Bố cục: "Thực hiện …" → "Ủy ban nhân dân phường Gia Định báo cáo kết quả … như sau:" → các mục đánh số → "Ủy ban nhân dân phường Gia Định kính báo cáo {noi} tổng hợp./."
Số liệu nhiều thì đưa ra Phụ lục. Trả về trích yếu "V/v …", thân văn bản và Nơi nhận.

{vanPhong}`,
    },
    "trien-khai": {
      ten: "Công văn triển khai xuống đơn vị, khu phố",
      noiDung: `Bạn là chuyên viên Phòng Văn hóa - Xã hội, Ủy ban nhân dân phường Gia Định.
Soạn công văn của Ủy ban nhân dân phường Gia Định triển khai văn bản số {so} ngày {den} của {noi} về {ty} đến [các cơ quan, đơn vị, khu phố].
Nội dung cần triển khai: [tóm tắt]
Bố cục: tóm tắt văn bản cấp trên → "Ủy ban nhân dân phường Gia Định đề nghị các cơ quan, đơn vị …" (giao việc cụ thể, có hạn) → "Trong quá trình thực hiện, nếu có khó khăn, vướng mắc, đề nghị các cơ quan, đơn vị phản ánh về Ủy ban nhân dân phường (thông qua Phòng Văn hóa - Xã hội) để tổng hợp, báo cáo." → "… đề nghị các cơ quan, đơn vị nghiêm túc triển khai thực hiện./."

{vanPhong}`,
    },
    "ke-hoach": {
      ten: "Kế hoạch",
      noiDung: `Bạn là chuyên viên Phòng Văn hóa - Xã hội, Ủy ban nhân dân phường Gia Định.
Soạn Kế hoạch của Ủy ban nhân dân phường Gia Định (Số: /KH-UBND) thực hiện văn bản số {so} của {noi} về {ty}.
Căn cứ thêm: [ ]
Thông tin: thời gian [ ], địa điểm [ ], đối tượng [ ], chỉ tiêu [ ], kinh phí [ ].
Bố cục: "Căn cứ …;" → "Ủy ban nhân dân phường Gia Định ban hành Kế hoạch …, cụ thể như sau:" → I. MỤC ĐÍCH, YÊU CẦU → II. NỘI DUNG → III. TỔ CHỨC THỰC HIỆN ("Giao" cho các phòng thuộc Ủy ban; "Đề nghị" cho Công an, Mặt trận, đoàn thể; giao Trưởng 50 khu phố) → "Trên đây là Kế hoạch …./."

{vanPhong}`,
    },
    "gop-y": {
      ten: "Góp ý dự thảo",
      noiDung: `Bạn là chuyên viên Phòng Văn hóa - Xã hội, Ủy ban nhân dân phường Gia Định.
Đọc dự thảo kèm văn bản số {so} của {noi} về {ty}.
Dự thảo (phần cần góp ý): [dán]
1. Nêu tối đa 5 điểm chưa rõ, chồng chéo hoặc khó thực hiện ở cấp phường; mỗi điểm ghi điều, khoản và đề xuất sửa.
2. Nếu không có điểm đáng kể, soạn công văn: "Qua nghiên cứu, Ủy ban nhân dân phường Gia Định thống nhất với nội dung dự thảo […]." và kết "Ủy ban nhân dân phường Gia Định kính báo cáo đến {noi}./."

{vanPhong}`,
    },
    "giay-moi": {
      ten: "Giấy mời",
      noiDung: `Soạn Giấy mời của Ủy ban nhân dân phường Gia Định (Số: /GM-UBND).
Liên quan: văn bản số {so} của {noi} về {ty}.
Thành phần mời: [danh sách theo chức danh]
Nội dung: [ ]. Thời gian: [giờ, ngày, sáng/chiều thứ mấy]. Địa điểm: [ ].
Bố cục: "Ủy ban nhân dân phường Gia Định trân trọng kính mời:" → danh sách → Nội dung / Thời gian (dạng "08 giờ 00 ngày … (Sáng thứ …)") / Địa điểm → "… trân trọng kính mời các đồng chí sắp xếp thời gian tham dự./."`,
    },
    "trinh-ky": {
      ten: "Bộ trình ký: Tờ trình, Phiếu trình",
      noiDung: `Từ văn bản chính dưới đây, soạn 3 văn bản kèm, trích yếu cả bộ phải khớp từng chữ:
1. Tờ trình của Phòng Văn hóa - Xã hội (Số: /TTr-VHXH) kính gửi [lãnh đạo Ủy ban phụ trách]: "Thực hiện …" → "Phòng Văn hóa - Xã hội nghiên cứu và tham mưu văn bản […]" → "kính trình … xem xét và chấp thuận./."
2. Phiếu trình 2 ô gửi lãnh đạo phòng: mục 1 tóm tắt nội dung cần trình; mục 2 "Bộ phận phụ trách tham mưu đề xuất … xem xét, ký Tờ trình về việc […]."
3. Phiếu trình 5 ô kính gửi Thường trực Ủy ban nhân dân phường: "Bộ phận phụ trách đã nghiên cứu, tham mưu [loại văn bản] trình Thường trực Ủy ban nhân dân phường về việc […]."
Người ký, người trình: [điền theo phân công].
Căn cứ: văn bản số {so} của {noi} về {ty}.
Văn bản chính: [dán trích yếu và đoạn mở đầu]`,
    },
    "bao-cao-ky": {
      ten: "Báo cáo định kỳ",
      noiDung: `Bạn là chuyên viên Phòng Văn hóa - Xã hội, Ủy ban nhân dân phường Gia Định.
Soạn {tenBC} gửi {noiNhan}, kỳ số liệu từ {tu} đến {den}, hạn gửi {han}.
Căn cứ chỉ đạo: {canCu}
Đề cương bắt buộc:
{deCuong}
Văn bản đã ban hành trong kỳ (lấy từ qlvb):
{dsVanBan}
Hoạt động, số liệu khác: [ ]
Yêu cầu: mỗi văn bản nêu đủ số, ngày, trích yếu; không thêm việc không có trong danh sách; chỗ thiếu số liệu để [ ].
Bố cục: I. CÔNG TÁC CHỈ ĐẠO, TỔ CHỨC THỰC HIỆN → II. KẾT QUẢ ĐẠT ĐƯỢC → III. NHẬN XÉT, ĐÁNH GIÁ → IV. NHIỆM VỤ TRỌNG TÂM KỲ TỚI, KIẾN NGHỊ.

{vanPhong}`,
    },
    "soat-loi": {
      ten: "Soát lỗi trước khi trình",
      noiDung: `Soát văn bản dưới đây, KHÔNG viết lại, chỉ liệt kê lỗi dạng bảng (vị trí | lỗi | sửa thành):
- Chính tả, lặp chữ ("đồng chí Đồng chí", "về việc về việc", "Ủy ban nhân nhân", "các bộ" thay vì "cán bộ").
- Tên cơ quan viết sai hoặc viết tắt trong thân bài; "Uỷ" thay vì "Ủy".
- Trích yếu giữa văn bản chính, tờ trình, phiếu trình không khớp.
- Thiếu "./." cuối đoạn; ngày tháng, số hiệu không thống nhất.
- Còn sót tên phường khác, năm cũ khi dùng lại mẫu.
Văn bản: [dán]`,
    },
  },

  // Hướng xử lý (config/huong-xu-ly.js) → mẫu câu lệnh tương ứng
  theoHuong: {
    "bao-cao": "tra-loi", "tra-loi": "tra-loi", "gop-y": "gop-y", "ke-hoach": "ke-hoach",
    "trien-khai": "trien-khai", "chuyen": "trien-khai", "quyet-dinh": "trinh-ky",
    "tham-du": "tra-loi", "de-biet": "tom-tat", "cho-xem-xet": "tom-tat",
  },
};
