# Bàn làm việc Phòng VHXH

Web nội bộ giúp theo dõi văn bản trên qlvb, việc cần làm và lịch báo cáo của Phòng Văn hóa – Xã hội, UBND phường Gia Định. Bắt đầu với mảng KHCN – ĐMST – CĐS, sau này thêm các mảng khác của phòng.

## Có gì trong web

| Tab | Nội dung |
| --- | --- |
| Hôm nay | Việc hôm nay, việc quá hạn, 7 ngày tới, 4 bước quét đầu ngày |
| Lịch | Lịch tháng: ngày nào làm gì, văn bản đi đã phát hành, văn bản đến |
| Báo cáo | Danh mục mọi báo cáo (tuần, tháng, quý, 6 tháng, 9 tháng, năm, đột xuất) và kỳ tới |
| Văn bản đến | Văn bản chờ xử lý, đối chiếu đã trả lời chưa |
| Văn bản đi | Văn bản đã phát hành, tờ trình đang chờ văn bản chính |
| 📌 Ghim note, ✉ Gửi tóm tắt | Note việc cần làm nổi trên màn hình; soạn mail tóm tắt gửi lãnh đạo, công chức phụ trách |
| Trợ lý (nút góc dưới) | Hỏi việc hôm nay, văn bản khẩn, báo cáo sắp đến hạn; gõ số văn bản để có câu lệnh soạn dán vào công cụ AI bạn dùng |

## Cấu trúc thư mục

```
BanLamViec_VHXH/
├── index.html              trang chính
├── css/styles.css          giao diện
├── js/
│   ├── utils.js            hàm dùng chung (ngày tháng, lưu trình duyệt)
│   ├── lich-bao-cao.js     sinh các kỳ báo cáo lên lịch
│   ├── store.js            dữ liệu tự thêm trên web, sao lưu
│   ├── app.js              điều khiển các tab
│   └── tro-ly.js           khung Trợ lý (chat mini)
├── config/
│   ├── bao-cao.js          danh mục báo cáo cố định
│   ├── huong-xu-ly.js      hướng xử lý văn bản đến, từ khóa gợi ý, loại lịch
│   └── cau-lenh-ai.js      câu lệnh mẫu cho AI (khung Trợ lý)
├── data/
│   ├── sample.js           dữ liệu mẫu (có trên GitHub)
│   └── local.js            dữ liệu thật (KHÔNG lên GitHub)
├── templates/              mẫu Word của từng loại báo cáo
├── cai-dat-nut-quet.html   trang cài nút Quét qlvb
└── tools/
    ├── quet-qlvb.js        mã nguồn nút Quét qlvb
    └── nhap_qlvb.py        nhập tệp Excel xuất từ qlvb vào data/local.js
```

## Mở web

- Cách nhanh: nhấp đúp `index.html`.
- Trong VS Code: mở tệp `BanLamViec_VHXH.code-workspace`, cài tiện ích **Live Server** (VS Code sẽ gợi ý), bấm chuột phải vào `index.html` → **Open with Live Server**.

## Cách dùng hằng ngày

### 1. Văn bản đến: cần làm gì
Tab **Văn bản đến** (hoặc khung "Văn bản chưa phân loại" ở tab Hôm nay) → bấm **Xử lý**.
- Web đọc trích yếu và gợi ý một trong các hướng: làm báo cáo, trả lời/cung cấp thông tin, góp ý dự thảo, ban hành kế hoạch, công văn triển khai, ban hành quyết định, cử người tham dự, để biết, chuyển đơn vị khác.
- Chọn lại nếu gợi ý chưa đúng. Web hiện văn bản phải soạn, bộ hồ sơ trình ký (TTr, PTr, PTr 5 ô) và tên thư mục gợi ý để sao chép.
- Hạn tự tính theo độ khẩn; sửa lại theo hạn ghi trong văn bản.
- Nếu là tập huấn, họp: nhập ngày, giờ, địa điểm để đưa lên lịch.
- Nếu văn bản yêu cầu báo cáo định kỳ: đánh dấu ô cuối để thêm luôn vào danh mục báo cáo.
- Bấm **Lưu, đưa lên lịch**.
Muốn sửa từ khóa gợi ý hoặc thêm hướng xử lý: `config/huong-xu-ly.js`.

### 1a. Tự tạo thư mục công việc và tệp mẫu
Trong hộp **Xử lý**, sau khi chọn hướng, bấm **Tạo thư mục và tệp mẫu**:
- Lần đầu: chọn thư mục gốc `congviec\2026 P.Gia Định\2026 P.Gia Định` và bấm **Cho phép** (Chrome hoặc Edge). Lần sau web nhớ, chỉ hỏi lại quyền khi mở trình duyệt mới.
- Web tạo `<LOẠI>\NN. CV số-ký-hiệu - Ten khong dau\` (NN tự đếm tiếp), thư mục con `File dinh kem`, và các tệp Word theo mẫu của phường, điền sẵn trích yếu, căn cứ, độ khẩn:

| Hướng xử lý | Tệp tạo sẵn |
| --- | --- |
| Báo cáo, trả lời, góp ý, triển khai | CV_, TTr_, PTr_, PTr_5o_ |
| Kế hoạch, quyết định | TTr_, PTr_, PTr_5o_ (văn bản chính tự soạn) |
| Cử người tham dự | CV_ (cử người), PTr_ |
| Để biết | Chỉ thư mục |

- Đã có thư mục cho số văn bản đó thì dùng lại; tệp đã có thì **không ghi đè**.
- Chỗ "ngày … tháng …" và [ ] trong tệp cần điền; tải văn bản của nơi gửi từ qlvb vào `File dinh kem`.
- Tên người ký, người trình điền ở `config/nguoi-ky.local.js` (chép từ `config/nguoi-ky.js`, tệp này không lên GitHub). Phường, phòng khác dùng thì điền tên của mình.
- Mẫu Word nằm ở `templates/mau-word/` (lấy từ bộ mẫu thật của phòng, tên người được thay bằng chỗ điền). Sửa mẫu xong chạy `python tools/dong_goi_mau.py`.

### 1b. Văn bản chưa biết làm gì → mục "Chờ xem xét"
- Ở tab **Văn bản đến**, bấm **Chưa rõ** cạnh văn bản; hoặc trong hộp Xử lý chọn "Chưa rõ cần làm gì, để công chức xem" và ghi vướng ở đâu.
- Văn bản chuyển sang tab **Chờ xem xét** (và khung "Chờ công chức xem" ở tab Hôm nay), không lên lịch.
- Công chức phụ trách mở tab này, bấm **Chọn hướng xử lý**; văn bản rời mục chờ và lên lịch.
- Văn bản mà web không đoán được từ trích yếu sẽ được gợi ý sẵn là "Chờ xem xét".

### 2. Thêm báo cáo
Tab **Báo cáo** → **+ Thêm báo cáo**, điền theo văn bản chỉ đạo:
tên báo cáo, mảng, gửi cho ai, số văn bản căn cứ, chu kỳ và hạn, **các mục báo cáo cần có**, lấy số liệu ở đâu, mẫu.
Bấm vào một báo cáo để xem đề cương và danh sách văn bản đi trong kỳ số liệu, rồi bấm **Tạo việc soạn kỳ này**.

### 3. Lịch ngoài văn bản (tập huấn, họp, hội nghị, kiểm tra…)
Nút **+ Thêm lịch** → chọn loại, nhập ngày giờ, địa điểm, thành phần, những việc cần chuẩn bị.

### 3b. Trợ lý (khung chat ở góc dưới)
- Hỏi: "hôm nay làm gì", "7 ngày tới", "văn bản khẩn", "chờ xem xét", "báo cáo sắp đến hạn", "báo cáo tuần Sở KHCN", hoặc gõ vài chữ trong trích yếu để tìm.
- Gõ **số văn bản** (ví dụ `7226/SKHCN-CĐS`): trợ lý điền sẵn số, ngày, nơi gửi, trích yếu vào câu lệnh phù hợp với hướng xử lý → bấm **Sao chép** → dán vào công cụ AI bạn dùng.
- Hỏi một báo cáo: câu lệnh có sẵn đề cương và danh sách văn bản đi trong kỳ số liệu.
- Trợ lý chạy trên máy, chỉ đọc dữ liệu trong web, không gửi gì ra Internet. Câu lệnh mẫu sửa ở `config/cau-lenh-ai.js`.
- Không dán văn bản mật, nội dung tôn giáo - dân tộc, thông tin cá nhân của người dân vào công cụ AI.

### 3c. Note ghim trên màn hình và mail tóm tắt (không cần cài gì)
- **📌 Ghim note**: mở note "Việc cần làm" trong cửa sổ nổi **luôn nằm trên cùng màn hình** (Chrome/Edge), kéo đi đâu cũng được. Note tự cập nhật sau mỗi lần bấm Quét qlvb; bấm một văn bản để chép số.
- **✉ Gửi tóm tắt**: web soạn bảng "Việc cần làm" (văn bản cần xử lý kèm cần làm gì, báo cáo định kỳ 7 ngày tới; ghi chung, không ghi hạn), chép vào bộ nhớ tạm và mở Gmail với sẵn người nhận, tiêu đề → bấm vào ô nội dung, **Ctrl+V**, **Gửi**. Người nhận được nhớ cho lần sau.
- Mỗi sáng: **Quét qlvb → Ghim note → Gửi tóm tắt** (dưới 1 phút).
- Muốn tự động hoàn toàn (tự quét và gửi mail lúc 7:30, 13:30, 17:00, không cần mở web) thì dùng thêm `tools/theo_doi_qlvb/` trên một máy.

### 4. Sao lưu
Những gì thêm trên web lưu trong trình duyệt. Bấm **Sao lưu** → tải tệp `.json` để giữ hoặc chép sang máy khác (Khôi phục từ tệp).

## Thêm báo cáo cố định bằng tệp cấu hình

Mở `config/bao-cao.js`, chép một mục có sẵn rồi sửa. Ví dụ báo cáo tháng của mảng văn hóa, hạn ngày 20 hằng tháng:

```js
{
  id: "bc-thang-van-hoa",
  ten: "Báo cáo tháng công tác văn hóa",
  mang: "Văn hóa – Thể thao",
  noiNhan: "Sở Văn hóa và Thể thao",
  canCu: "số văn bản chỉ đạo",
  chuKy: { loai: "thang", han: 20 },
  xacNhan: true,
  ghiChu: "",
  mau: "templates/bc-thang-van-hoa/",
},
```

Lưu tệp, tải lại web: báo cáo hiện ở tab Báo cáo và tự lên lịch. Chưa biết hạn thì để `han: null`.

## Cập nhật dữ liệu từ qlvb (nút Quét qlvb)

**Không cần cài phần mềm, không lưu mật khẩu** nên nhân rộng sang máy khác chỉ mất 30 giây.

Cài một lần trên mỗi máy: mở trang `cai-dat-nut-quet.html` **từ địa chỉ web của Bàn làm việc** (GitHub Pages, xem mục "Đưa lên GitHub"), kéo nút **Quét qlvb** lên thanh dấu trang của Chrome hoặc Edge.

Mỗi lần cập nhật (khoảng 20 giây): đăng nhập qlvb, bấm **Quét qlvb**. Nút tự mở **Văn bản đến chờ xử lý** và **Văn bản đi đã phát hành**, đọc hai danh sách (bỏ qua văn bản mật), rồi mở Bàn làm việc và tự cập nhật. Lần đầu Chrome hỏi thì chọn **luôn cho phép cửa sổ bật lên** từ qlvb.

Dữ liệu chuyển sang Bàn làm việc qua phần sau dấu `#` của địa chỉ: phần này chỉ nằm trong trình duyệt, không gửi lên máy chủ nào (kể cả GitHub). Mỗi máy giữ dữ liệu của mình trên trình duyệt.

Nếu web mở bằng tệp trên máy (không qua địa chỉ web), nút tải về một tệp `qlvb_….json`; bấm **Nhập dữ liệu qlvb** trên web và chọn tệp đó.

Mã nguồn nút: `js/nut-quet.js` (chỉ đọc, không bấm xử lý, không sửa gì trên qlvb).

Về sau văn bản nhiều hơn:
- **Văn bản đi được cộng dồn**: mỗi lần nhập, văn bản mới thêm vào kho, văn bản cũ vẫn giữ (trùng số thì lấy bản mới). Kho này dùng để liệt kê văn bản trong kỳ khi làm báo cáo. Nên quét Văn bản đi ít nhất mỗi tuần một lần, trước ngày chốt báo cáo tuần.
- **Văn bản đến chờ xử lý được làm mới**: quét đủ hết các trang thì danh sách thay bằng lần quét mới (văn bản đã xử lý xong trên qlvb tự rời danh sách); quét thiếu trang thì cộng thêm vào danh sách cũ.
- Hơn 50 văn bản: sang trang 2, 3 trên qlvb, bấm Quét qlvb ở mỗi trang, rồi chọn tất cả các tệp cùng lúc khi nhập.
- Dữ liệu nhập lưu trong trình duyệt; bấm **Sao lưu** định kỳ để giữ một bản.
Tệp `qlvb_*.json` chứa văn bản thật: không đưa lên GitHub (đã có trong `.gitignore`).

## Tự động theo dõi qlvb, gửi mail khi có văn bản mới

Thư mục `tools/theo_doi_qlvb/` (**tùy chọn, chỉ cho một máy**, không cần khi nhân rộng): script chạy ẩn trên máy (không cần Claude), Thứ Hai đến Thứ Sáu lúc 7:30 và 13:30 gửi mail văn bản mới (văn bản đã báo thì không báo lại), 17:00 gửi mail cuối ngày, Thứ Sáu 17:00 thêm tổng hợp tuần; kèm note việc cần làm dán trên màn hình, bỏ qua văn bản mật, đồng thời ghi tệp để nhập vào Bàn làm việc. Cài theo `tools/theo_doi_qlvb/HUONG_DAN.md` (các tệp .bat đánh số 1–7, bấm lần lượt).

## Cập nhật dữ liệu thật (cách khác)

Cách 1: nhờ Claude mở qlvb trên Chrome, quét văn bản đến, văn bản đi và ghi vào `data/local.js`.

Cách 2: tự xuất danh sách từ qlvb ra Excel rồi chạy:

```
pip install -r tools/requirements.txt
python tools/nhap_qlvb.py --den van_ban_den.xlsx --di van_ban_di.xlsx
```

## Bảo mật

- `data/local.js` chứa số, trích yếu văn bản thật nên đã nằm trong `.gitignore`, không đưa lên GitHub.
- Nếu bật GitHub Pages, trang công khai chỉ có dữ liệu mẫu.
- Không đưa văn bản mật, thông tin cá nhân hay tệp Word đã điền số liệu vào thư mục `templates/` hoặc `data/sample.js`.
- Việc tự thêm và ô đánh dấu đã xong lưu trên trình duyệt đang dùng.

## Đưa lên GitHub

Mở Terminal trong VS Code (Ctrl + `) rồi chạy:

```
git init
git add .
git commit -m "Khởi tạo Bàn làm việc Phòng VHXH"
git branch -M main
git remote add origin https://github.com/donieselta05ds-lab/BanLamViec_VHXH.git
git push -u origin main
```

Bật GitHub Pages để mọi máy dùng chung một địa chỉ: trên GitHub mở kho → **Settings → Pages → Build and deployment: Deploy from a branch → main / (root) → Save**. Sau vài phút web chạy tại `https://<tên-tài-khoản>.github.io/BanLamViec_VHXH/`, trang cài nút ở `…/cai-dat-nut-quet.html`. Trên GitHub chỉ có mã và dữ liệu mẫu: `data/local.js` và các tệp quét đã nằm trong `.gitignore`.

Trước khi push, chạy `git status` và kiểm tra **không có** `data/local.js` trong danh sách.

## Hướng phát triển

1. Nút "Quét lại qlvb" chạy thật, tự ghép tờ trình với văn bản chính.
2. Xuất báo cáo ra Word theo mẫu trong `templates/`.
3. Thêm các mảng khác của phòng (mỗi mảng một nhóm báo cáo trong `config/bao-cao.js`).
4. Lưu dữ liệu dùng chung để cả phòng cùng xem.
