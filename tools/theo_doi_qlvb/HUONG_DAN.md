# Theo dõi qlvb tự động, gửi mail văn bản mới

Script chạy trên máy tính của bạn, **không cần Claude hay AI**. Thứ Hai đến Thứ Sáu, script tự quét qlvb và gửi mail cho bạn và anh công chức (`gui_den_sang` trong `cau_hinh.ini`):

| Giờ | Mail | Nội dung |
| --- | --- | --- |
| 7:30 | **[Văn bản mới]** | Văn bản mới + báo cáo định kỳ trong 7 ngày tới |
| 13:30 | **[Văn bản mới]** | Văn bản mới từ lần báo trước (không có thì không gửi) |
| 17:00 | **[Cuối ngày]** | Văn bản mới từ lần báo trước + số văn bản đã báo trong ngày |
| Thứ Sáu 17:00 | **[Cuối tuần]** | Như cuối ngày + bảng tổng hợp số văn bản từng ngày trong tuần |

**Văn bản đã báo thì không báo lại.** Văn bản trước ngày bắt đầu theo dõi (`bat_dau`) không đưa vào mail.

Mỗi mail gồm các mục (mục nào không có thì bỏ):
1. **Văn bản cần xử lý**: Số, Trích yếu, Đề xuất cần làm gì (tham mưu công văn, báo cáo, kế hoạch…), Hạn (ghi ngày khi qlvb có hạn, kể cả hạn ghi trong trích yếu).
2. **Văn bản xem để biết**: lấy từ mục Văn bản xem để biết trên qlvb; Số, Trích yếu, Đề xuất cần làm gì.
3. **Văn bản đã phát hành**: Số, Ngày văn bản, Trích yếu.
4. **Báo cáo định kỳ trong 7 ngày tới** (chỉ mail 7:30).

Mỗi lần quét, script:
1. Mở qlvb bằng Chrome chạy ẩn, tự đăng nhập lại nếu phiên đã hết.
2. Đọc **Văn bản đến chờ xử lý**, **Văn bản xem để biết**, **Văn bản đi đã phát hành**.
3. **Bỏ qua văn bản mật**: không lưu, không gửi.
4. Ghi `du_lieu/qlvb_*_moi_nhat.json`: bấm **Nhập dữ liệu qlvb** trên Bàn làm việc rồi chọn các tệp này là cập nhật web.

Script chỉ đọc trên qlvb: không bấm xử lý, không sửa, không tải văn bản.

Xem trước mail (không quét, không gửi): `py theo_doi_qlvb.py --mau-mail`, mở các tệp `du_lieu/mail_mau_*.html`.

## Note việc cần làm trên màn hình

`6_bat_note.bat`: mở một note nhỏ màu vàng ở góc phải màn hình, luôn nằm trên cùng, và tự mở mỗi khi bật máy.
- Hiện (chỉ trên máy bạn): số việc cần ưu tiên, hạn hôm nay, báo cáo sắp đến hạn, văn bản mới trong ngày; danh sách việc kèm cần làm gì và hạn.
- Bấm một văn bản: chép số văn bản để dán vào ô tìm kiếm trên qlvb.
- Nút `–` thu gọn còn một dòng, `📌` bật/tắt luôn trên cùng, `⟳` cập nhật ngay. Kéo thanh tiêu đề để di chuyển, vị trí được nhớ.
- Note tự cập nhật sau mỗi lần script quét (7:30, 13:30, 17:00). Tắt tự mở: `7_tat_note.bat`.

## Cài đặt (khoảng 10 phút, làm một lần)

### Bước 0. Chuẩn bị
- **Python**: tải tại python.org/downloads, khi cài nhớ tick **Add python.exe to PATH**.
- **Google Chrome** đã có sẵn trên máy.
- **Mật khẩu ứng dụng Gmail** (Gmail không cho script dùng mật khẩu thường):
  1. Vào myaccount.google.com → **Bảo mật** → bật **Xác minh 2 bước**.
  2. Tìm "Mật khẩu ứng dụng" (App passwords) → đặt tên "Ban lam viec" → **Tạo** → chép dãy 16 ký tự.

### Bước 1. `1_cai_dat.bat`
Nhấp đúp. Script cài thư viện và tạo `cau_hinh.ini`. Mở `cau_hinh.ini`, kiểm tra **tên truy cập qlvb** và **mail nhận**.

### Bước 2. `2_luu_mat_khau.bat`
Gõ mật khẩu qlvb, rồi mật khẩu ứng dụng Gmail (gõ không hiện chữ, gõ xong Enter). Mật khẩu được cất vào **Windows Credential Manager** của máy, **không nằm trong thư mục dự án**, không lên GitHub. Sau đó script gửi một mail thử: kiểm tra hộp thư.

### Bước 3. `3_chay_thu.bat`
Chrome mở ra để bạn xem script đăng nhập, mở Văn bản đến, Văn bản xem để biết, Văn bản đi, rồi gửi mail văn bản mới (chỉ văn bản từ ngày `bat_dau`).
Nếu báo lỗi "Không tìm thấy menu…", chụp màn hình gửi lại để sửa tên menu trong `theo_doi_qlvb.py` (biến `MENU`).

### Bước 4. `4_bat_tu_dong.bat`
Tạo lịch trong Windows Task Scheduler: Thứ Hai đến Thứ Sáu, chạy ẩn lúc 7:30, 13:30, 17:00.
Tắt: `5_tat_tu_dong.bat`.

## Lưu ý
- **Máy phải bật và có mạng** thì script mới chạy; giờ nào máy tắt thì bỏ qua giờ đó (văn bản chưa báo sẽ vào mail lần sau).
- **Đổi mật khẩu qlvb hoặc Gmail**: chạy lại `2_luu_mat_khau.bat`.
- Lỗi gì cũng gửi **mail báo lỗi** (tối đa 1 mail mỗi ngày). Chi tiết ở `du_lieu/nhat_ky.log`.
- Muốn theo dõi lại từ đầu: `py theo_doi_qlvb.py --lam-lai-moc` (xóa danh sách văn bản đã báo).
- Thư mục `du_lieu/` (hồ sơ Chrome đã đăng nhập, danh sách văn bản) **không đưa lên GitHub**, đã có trong `.gitignore`.
- Nội dung mail là trích yếu văn bản nhà nước: chỉ gửi đến hộp thư của người được giao xử lý, nên dùng mail công vụ nếu có.
