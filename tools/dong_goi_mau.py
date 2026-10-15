"""
Đóng gói mẫu Word vào web
-------------------------------------------------------------------------------
Web mở bằng nhấp đúp (file://) nên không đọc được tệp .docx bên cạnh; mẫu được
nhúng vào templates/mau-word.js. Sau khi sửa một mẫu trong templates/mau-word/,
chạy:   python tools/dong_goi_mau.py

Chỗ web tự điền trong mẫu (gõ đúng nguyên chữ, không tô màu giữa chừng):
  {{TY_VB}}        trích yếu văn bản của phường (sau "V/v")
  {{KINH_GUI}}     nơi nhận ở "Kính gửi" (nhiều dòng thì tự tách đoạn)
  {{CAN_CU}}       "Công văn số ... của ... về việc ..."
  {{NOI_DUNG}}     phần thân (nhiều dòng)
  {{KET}}          câu kết
  {{TY_TRINH}}     trích yếu dưới chữ TỜ TRÌNH / PHIẾU TRÌNH
  {{VB_THAM_MUU}}  "công văn về việc ..." trong tờ trình
  {{VE_VIEC}}      "ban hành Công văn về việc ..." trong phiếu trình
  {{LOAI_VB}}      Công văn / Kế hoạch / Quyết định
  {{DO_KHAN}}      Thường / Khẩn / Hỏa tốc
"""
import base64
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
MAU = GOC / "templates" / "mau-word"
dong = ["/* MẪU WORD (tạo từ templates/mau-word/*.docx). Không sửa tay: sửa tệp .docx rồi chạy  python tools/dong_goi_mau.py */",
        "window.MAU_WORD = {"]
for k in ("cv", "ttr", "ptr", "ptr5"):
    dong.append(f'  {k}: "{base64.b64encode((MAU / f"mau_{k}.docx").read_bytes()).decode()}",')
dong.append("};")
(GOC / "templates" / "mau-word.js").write_text("\n".join(dong) + "\n", encoding="utf-8")
print("Đã đóng gói 4 mẫu vào templates/mau-word.js")
