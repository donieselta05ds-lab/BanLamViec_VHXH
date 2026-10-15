"""
NOTE VIỆC CẦN LÀM – dán trên màn hình
-------------------------------------------------------------------------------
Cửa sổ nhỏ luôn nằm trên cùng, đọc du_lieu/tom_tat.json (do theo_doi_qlvb.py ghi
sau mỗi lần quét) và tự cập nhật mỗi 2 phút.
  - Bấm vào một dòng: chép số văn bản để dán vào ô tìm kiếm trên qlvb.
  - Nút "–": thu gọn còn một dòng; "📌": bật/tắt luôn nằm trên cùng; "⟳": cập nhật ngay.
  - Kéo thanh tiêu đề để di chuyển; vị trí được nhớ cho lần sau.
Chỉ dùng thư viện có sẵn của Python, không cần cài thêm.
"""
import datetime as dt
import json
import tkinter as tk
import webbrowser
from pathlib import Path

GOC = Path(__file__).resolve().parent
TOM_TAT = GOC / "du_lieu" / "tom_tat.json"
VI_TRI = GOC / "du_lieu" / "note_vi_tri.json"
WEB = GOC.parent.parent / "index.html"
THU = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

NEN, CHU, PHU, VIEN = "#fffbea", "#1f2933", "#6b7280", "#e8d48a"
DO, CAM, XANH, LAM = "#b3261e", "#925600", "#2f6b3a", "#1f5f99"
FONT = "Segoe UI"


def dm(iso):
    return f"{iso[8:10]}/{iso[5:7]}" if iso and len(iso) >= 10 else ""


class Note:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Việc cần làm")
        self.root.configure(bg=VIEN)
        self.root.attributes("-topmost", True)
        try:
            self.root.attributes("-toolwindow", True)  # không chiếm chỗ trên thanh taskbar
        except tk.TclError:
            pass
        self.ghim, self.gon, self.mtime, self.data = True, False, None, None
        self.dong_so = {}

        w, h, x, y = 360, 480, self.root.winfo_screenwidth() - 380, 40
        if VI_TRI.exists():
            try:
                v = json.loads(VI_TRI.read_text(encoding="utf-8"))
                w, h, x, y = v["w"], v["h"], v["x"], v["y"]
            except Exception:
                pass
        self.size = (w, h)
        self.root.geometry(f"{w}x{h}+{x}+{y}")
        self.root.minsize(260, 44)

        # thanh tiêu đề
        top = tk.Frame(self.root, bg=VIEN)
        top.pack(fill="x")
        self.tieu_de = tk.Label(top, text="Việc cần làm", bg=VIEN, fg=CHU, font=(FONT, 10, "bold"), anchor="w", padx=8, pady=4)
        self.tieu_de.pack(side="left", fill="x", expand=True)
        for txt, cmd, tip in (("✕", self.dong, "Đóng"), ("–", self.thu_gon, "Thu gọn"), ("📌", self.doi_ghim, "Luôn trên cùng"), ("⟳", self.nap, "Cập nhật")):
            b = tk.Label(top, text=txt, bg=VIEN, fg=CHU, font=(FONT, 10), padx=6, cursor="hand2")
            b.pack(side="right")
            b.bind("<Button-1>", lambda e, c=cmd: c())
        self.nut_ghim = top.winfo_children()[-2]
        for wdg in (top, self.tieu_de):
            wdg.bind("<ButtonPress-1>", self._bat_dau_keo)
            wdg.bind("<B1-Motion>", self._keo)

        # nội dung
        self.than = tk.Frame(self.root, bg=NEN)
        self.than.pack(fill="both", expand=True, padx=1, pady=(0, 1))
        self.txt = tk.Text(self.than, bg=NEN, fg=CHU, font=(FONT, 10), wrap="word", bd=0, padx=10, pady=8,
                           cursor="arrow", spacing1=2, spacing3=2, highlightthickness=0)
        sb = tk.Scrollbar(self.than, command=self.txt.yview)
        self.txt.configure(yscrollcommand=sb.set)
        sb.pack(side="right", fill="y")
        self.txt.pack(side="left", fill="both", expand=True)
        t = self.txt
        t.tag_configure("h", font=(FONT, 10, "bold"), spacing1=8)
        t.tag_configure("do", foreground=DO)
        t.tag_configure("cam", foreground=CAM)
        t.tag_configure("lam", foreground=LAM)
        t.tag_configure("xanh", foreground=XANH)
        t.tag_configure("so", font=(FONT, 10, "bold"))
        t.tag_configure("phu", foreground=PHU, font=(FONT, 9))
        t.tag_configure("link", foreground=LAM, underline=True)
        t.tag_bind("link", "<Button-1>", lambda e: webbrowser.open(WEB.as_uri()))
        t.bind("<Button-1>", self._bam_dong)

        self.chan = tk.Label(self.root, text="", bg=VIEN, fg=PHU, font=(FONT, 8), anchor="w", padx=8)
        self.chan.pack(fill="x")
        self.root.protocol("WM_DELETE_WINDOW", self.dong)
        self.nap()
        self.root.after(120000, self._tu_nap)

    # ---------- dữ liệu ----------
    def _tu_nap(self):
        try:
            if TOM_TAT.exists() and TOM_TAT.stat().st_mtime != self.mtime:
                self.nap()
            else:
                self.ve()  # đổi ngày thì nhãn "hôm nay" vẫn đúng
        finally:
            self.root.after(120000, self._tu_nap)

    def nap(self):
        if TOM_TAT.exists():
            try:
                self.mtime = TOM_TAT.stat().st_mtime
                self.data = json.loads(TOM_TAT.read_text(encoding="utf-8"))
            except Exception:
                pass
        self.ve()

    def ve(self):
        t = self.txt
        t.configure(state="normal")
        t.delete("1.0", "end")
        self.dong_so = {}
        hn = dt.date.today()
        self.tieu_de.configure(text=f"Việc cần làm · {THU[hn.weekday()]} {hn:%d/%m}")
        d = self.data
        if not d:
            t.insert("end", "Chưa có dữ liệu.\n", "h")
            t.insert("end", "Note lấy dữ liệu từ lần quét qlvb tự động (theo_doi_qlvb.py). Chạy 3_chay_thu.bat một lần là có.", "phu")
            t.configure(state="disabled")
            self.chan.configure(text="")
            return
        viec, bc = d.get("viec", []), d.get("baoCao", [])
        # tính lại mức theo ngày hiện tại (note mở qua ngày vẫn đúng)
        for v in viec:
            con = (dt.date.fromisoformat(v["han"]) - hn).days
            v["_muc"] = "ton" if v["muc"] == "ton" else "qua-han" if con < 0 else "hom-nay" if con == 0 else "ngay-mai" if con == 1 else "sap-toi"
        nhom = {k: [v for v in viec if v["_muc"] == k] for k in ("qua-han", "hom-nay", "ngay-mai", "sap-toi", "ton")}

        tom = [(f"{len(nhom['qua-han'])} cần ưu tiên", "do") if nhom["qua-han"] else None,
               (f"{len(nhom['hom-nay'])} hạn hôm nay", "cam") if nhom["hom-nay"] else None,
               (f"{len(bc)} báo cáo", "lam") if bc else None,
               (f"{d.get('moiTrongNgay', 0)} văn bản mới hôm nay", "xanh") if d.get("moiTrongNgay") else None]
        tom = [x for x in tom if x] or [(f"{len(viec)} văn bản chờ xử lý, chưa có gì gấp", "xanh")]
        for i, (s, tag) in enumerate(tom):
            t.insert("end", ("  ·  " if i else "") + s, (tag, "so"))
        t.insert("end", "\n")

        if not self.gon:
            def muc(ten, rows, tag, toi_da=None):
                if not rows:
                    return
                t.insert("end", f"{ten} ({len(rows)})\n", ("h", tag))
                for v in rows[:toi_da] if toi_da else rows:
                    start = t.index("end-1c")
                    t.insert("end", v["so"], ("so", tag))
                    t.insert("end", f"  {v['lam']} · hạn {dm(v['han'])}" + (f" · {v['khan']}" if v["khan"] != "Thường" else "") + "\n")
                    t.insert("end", (v["ty"][:110] + ("…" if len(v["ty"]) > 110 else "")) + "\n", "phu")
                    self.dong_so[int(start.split(".")[0])] = v["so"]
                    self.dong_so[int(start.split(".")[0]) + 1] = v["so"]
                if toi_da and len(rows) > toi_da:
                    t.insert("end", f"… và {len(rows) - toi_da} văn bản nữa\n", "phu")

            muc("Cần ưu tiên", nhom["qua-han"], "do")
            muc("Hạn hôm nay", nhom["hom-nay"], "cam")
            if bc:
                t.insert("end", f"Báo cáo sắp đến hạn ({len(bc)})\n", ("h", "lam"))
                for b in bc:
                    con = (dt.date.fromisoformat(b["han"]) - hn).days
                    t.insert("end", f"{b['ten']}\n", "so")
                    t.insert("end", f"hạn {dm(b['han'])} · {'hôm nay' if con == 0 else ('đã qua' if con < 0 else 'còn ' + str(con) + ' ngày')} · gửi {b['noiNhan']}\n", "do" if con <= 1 else "phu")
            muc("Hạn ngày mai", nhom["ngay-mai"], "")
            muc("Sắp tới", nhom["sap-toi"], "", toi_da=8)
            if nhom["ton"]:
                t.insert("end", f"Chờ kết thúc trên qlvb ({len(nhom['ton'])})\n", "h")
                t.insert("end", "Đến hơn 7 ngày, chưa kết thúc trên qlvb. Xong rồi thì kết thúc để danh sách gọn lại.\n", "phu")
            t.insert("end", "\n")
            t.insert("end", "Mở Bàn làm việc", "link")
        t.configure(state="disabled")
        cn = d.get("capNhat", "")
        self.chan.configure(text=f"Quét lúc {cn[11:16]} {dm(cn)} · bấm một dòng để chép số văn bản")

    # ---------- thao tác ----------
    def _bam_dong(self, e):
        dong = int(self.txt.index(f"@{e.x},{e.y}").split(".")[0])
        so = self.dong_so.get(dong)
        if so:
            self.root.clipboard_clear()
            self.root.clipboard_append(so)
            self.chan.configure(text=f"Đã chép {so}: dán vào ô tìm kiếm trên qlvb")

    def thu_gon(self):
        self.gon = not self.gon
        if self.gon:
            self.size = (self.root.winfo_width(), self.root.winfo_height())
            self.root.geometry(f"{self.size[0]}x86")
        else:
            self.root.geometry(f"{self.size[0]}x{self.size[1]}")
        self.ve()

    def doi_ghim(self):
        self.ghim = not self.ghim
        self.root.attributes("-topmost", self.ghim)
        self.nut_ghim.configure(fg=CHU if self.ghim else PHU)

    def _bat_dau_keo(self, e):
        self._dx, self._dy = e.x_root - self.root.winfo_x(), e.y_root - self.root.winfo_y()

    def _keo(self, e):
        self.root.geometry(f"+{e.x_root - self._dx}+{e.y_root - self._dy}")

    def dong(self):
        try:
            VI_TRI.parent.mkdir(exist_ok=True)
            w, h = (self.size if self.gon else (self.root.winfo_width(), self.root.winfo_height()))
            VI_TRI.write_text(json.dumps({"w": w, "h": h, "x": self.root.winfo_x(), "y": self.root.winfo_y()}), encoding="utf-8")
        except Exception:
            pass
        self.root.destroy()


if __name__ == "__main__":
    Note().root.mainloop()
