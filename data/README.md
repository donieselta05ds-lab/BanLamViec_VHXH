# Dữ liệu

- `sample.js`: dữ liệu mẫu, có trên GitHub, không chứa văn bản thật.
- `local.js`: dữ liệu thật quét từ qlvb. Tệp này nằm trong `.gitignore`. Nếu có, web dùng tệp này thay cho dữ liệu mẫu.

Cấu trúc `window.QLVB`:

| Khóa | Nội dung |
| --- | --- |
| `den` | văn bản đến: `so`, `den` (YYYY-MM-DD), `khan`, `noi`, `ty`, `dc` (đối chiếu), `mau` |
| `di` | văn bản đi: `so`, `ngay`, `loai`, `ty`, `tt` (trạng thái), `mau`, `tm` (thư mục trên máy) |
| `viec` | việc cần làm: `id`, `date`, `kind` (red, amber, blue), `title`, `note` |
| `doso` | thư mục đang làm dở: `tm`, `sua`, `co`, `dc`, `viec`, `mau` |

`mau`: red = gấp, amber = cần làm, blue = liên quan một phần, green = hoàn thành, grey = để biết.
