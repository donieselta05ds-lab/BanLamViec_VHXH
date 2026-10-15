"""
THEO DÕI QLVB TỰ ĐỘNG – gửi mail văn bản mới theo lịch
-------------------------------------------------------------------------------
Chạy trên máy tính của bạn (không cần Claude, không cần AI). Thứ Hai đến Thứ Sáu:
  7:30 và 13:30  quét qlvb, gửi mail các văn bản MỚI (văn bản đã báo thì không báo lại)
  17:00          gửi mail cuối ngày: văn bản mới từ lần trước + số văn bản đã báo trong ngày
  Thứ Sáu 17:00  thêm phần tổng hợp số văn bản trong tuần (không liệt kê lại văn bản đã báo)
Mỗi lần quét:
  1. Mở qlvb bằng Chrome (chạy ẩn), tự đăng nhập nếu phiên đã hết.
  2. Đọc "Văn bản đến chờ xử lý", "Văn bản xem để biết", "Văn bản đi đã phát hành".
  3. Chỉ lấy văn bản của ngày hôm nay; văn bản cũ không lấy, không đưa vào mail.
  4. BỎ QUA văn bản mật: không lưu, không gửi.
  5. Ghi tệp qlvb_*_moi_nhat.json để nhập vào Bàn làm việc.

Chỉ ĐỌC trên qlvb: không bấm xử lý, không sửa, không tải văn bản.

Cách dùng (xem HUONG_DAN.md):
  python theo_doi_qlvb.py --luu-mat-khau   lưu mật khẩu vào Windows Credential Manager (làm 1 lần)
  python theo_doi_qlvb.py --thu            chạy thử, hiện cửa sổ Chrome để xem
  python theo_doi_qlvb.py                  chạy ẩn (Task Scheduler gọi lúc 7:30, 13:30, 17:00)
  python theo_doi_qlvb.py --mau-mail       soạn mail mẫu từ dữ liệu minh họa (không quét, không gửi)
  python theo_doi_qlvb.py --gui-thu-mail   gửi 1 mail thử
"""
import argparse
import configparser
import datetime as dt
import getpass
import html
import json
import re
import smtplib
import sys
import traceback
from email.message import EmailMessage
from pathlib import Path

GOC = Path(__file__).resolve().parent
DU_LIEU = GOC / "du_lieu"
DU_LIEU.mkdir(exist_ok=True)
TRANG_THAI = DU_LIEU / "trang_thai.json"
NHAT_KY = DU_LIEU / "nhat_ky.log"
HO_SO_CHROME = DU_LIEU / "chrome_profile"
KEYRING_QLVB = "BanLamViec-qlvb"
KEYRING_MAIL = "BanLamViec-gmail"
URL_QLVB = "https://qlvb.tphcm.gov.vn/qlvbdh/main?lang=vi"

# Menu trên qlvb: (nhóm, mục, chữ phải có trong tiêu đề trang)
MENU = {
    "den": (["Văn bản đến"], ["Văn bản đến cần xử lý", "Văn bản đến chờ xử lý", "Văn bản chờ xử lý", "Văn bản cần xử lý", "Chờ xử lý"], "đến"),
    "xemBiet": (["Văn bản đến"], ["Văn bản đến xem để biết", "Văn bản xem để biết", "Văn bản để biết", "Xem để biết"], "biết"),
    "di": (["Văn bản đi"], ["Văn bản đi đã phát hành", "Văn bản đã phát hành", "Đã phát hành"], "đi"),
}
# Hạn ghi trong trích yếu, ví dụ "(hạn xử lý 15/07/2026)"
RE_HAN_TY = re.compile(r"\s*\((?:hạn|hạn xử lý)[^)]*?(\d{1,2})/(\d{1,2})/(\d{4})[^)]*\)", re.I)
RE_HAN_BO = re.compile(r"\s*\((?:hạn|hạn xử lý)[^)]*\)", re.I)


def tach_han(r):
    """Lấy hạn từ trích yếu (nếu cột hạn trống) và bỏ phần "(hạn …)" khỏi trích yếu."""
    m = RE_HAN_TY.search(r.get("ty", ""))
    if m and not r.get("han"):
        r["han"] = f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
    r["ty"] = RE_HAN_BO.sub("", r.get("ty", "")).strip()
    return r
MAT = ("mật", "tối mật", "tuyệt mật")


def ghi(msg):
    dong = f"{dt.datetime.now():%Y-%m-%d %H:%M:%S}  {msg}"
    print(dong)
    with NHAT_KY.open("a", encoding="utf-8") as f:
        f.write(dong + "\n")


def doc_cau_hinh():
    p = GOC / "cau_hinh.ini"
    if not p.exists():
        sys.exit("Chưa có cau_hinh.ini: chép cau_hinh.mau.ini thành cau_hinh.ini rồi điền.")
    c = configparser.ConfigParser()
    c.read(p, encoding="utf-8")
    return c


def mat_khau(dich_vu, ten):
    import keyring
    mk = keyring.get_password(dich_vu, ten)
    if not mk:
        raise RuntimeError(f"Chưa lưu mật khẩu cho {ten}. Chạy: python theo_doi_qlvb.py --luu-mat-khau")
    return mk


# ---------------------------------------------------------------------------
# DÙNG CHUNG CẤU HÌNH VỚI WEB (config/huong-xu-ly.js, config/bao-cao.js)
# ---------------------------------------------------------------------------
CONFIG = GOC.parent.parent / "config"


def doc_js(ten_tep, bien):
    """Đọc mảng window.<bien> = [ ... ]; trong tệp cấu hình của web."""
    try:
        t = (CONFIG / ten_tep).read_text(encoding="utf-8")
        t = re.sub(r"/\*.*?\*/", "", t, flags=re.S)
        t = re.sub(r"^\s*//.*$", "", t, flags=re.M)
        m = re.search(r"window\." + bien + r"\s*=\s*(\[.*?\n\]);", t, re.S)
        a = m.group(1)
        a = re.sub(r"//[^\n\"]*$", "", a, flags=re.M)                       # chú thích cuối dòng
        a = re.sub(r"([{,]\s*)([A-Za-z_]\w*)\s*:", r'\1"\2":', a)           # khóa không ngoặc kép
        a = re.sub(r",(\s*[}\]])", r"\1", a)                                  # dấu phẩy thừa
        return json.loads(a)
    except Exception as e:
        ghi(f"Không đọc được {ten_tep}: {e}")
        return []


def goi_y(doc, huong):
    """Giống hàm goiY trong js/app.js: đoán cần làm gì từ trích yếu và số ký hiệu."""
    text = (doc["ty"] + " " + doc["so"]).lower()
    uu = {"gop-y": 6, "tham-du": 5, "bao-cao": 4, "tra-loi": 3, "quyet-dinh": 2, "ke-hoach": 1}
    best, wbest = None, -1
    for h in huong:
        hit = [k for k in h.get("tuKhoa", []) if k in text]
        w = len(hit) * 10 + uu.get(h["id"], 0)
        if hit and w > wbest:
            best, wbest = h, w
    by = {h["id"]: h for h in huong}
    bid = best["id"] if best else None
    if "/TB-" in doc["so"] and bid not in ("tham-du", "bao-cao", "tra-loi"):
        return by.get("de-biet", best)
    if "/QĐ-" in doc["so"] and bid in (None, "trien-khai"):
        return by.get("de-biet", best)
    if "/KH-" in doc["so"] and bid in (None, "trien-khai"):
        return by.get("ke-hoach", best)
    return best or by.get("cho-xem-xet") or {"ten": "Chưa rõ, để công chức xem", "sanPham": "", "han": 2, "choXem": True}


def han_de_xuat(doc, h):
    if doc.get("han"):
        return doc["han"]
    n = h.get("han", 5)
    k = doc.get("khan", "").lower()
    if "hỏa" in k or "hoả" in k:
        n = min(n, 1)
    elif "khẩn" in k:
        n = min(n, 3)
    goc = dt.date.fromisoformat(doc["den"]) if doc.get("den") else dt.date.today()
    return max(goc + dt.timedelta(days=n), dt.date.today()).isoformat()


def han_ke_tiep(bc, tu):
    """Hạn gần nhất >= ngày tu của một báo cáo định kỳ (giống js/lich-bao-cao.js)."""
    c = bc.get("chuKy") or {}
    loai, han = c.get("loai"), c.get("han")
    if han is None:
        return None
    for i in range(0, 400):
        d = tu + dt.timedelta(days=i)
        if loai == "tuan" and (d.isoweekday() % 7) == han:
            return d
        if loai == "thang" and d.day == han:
            return d
        if loai == "quy" and d.month in (1, 4, 7, 10) and d.day == han:
            return d
        if loai == "nam" and d.month == c.get("thang") and d.day == han:
            return d
    return None


def bao_cao_sap_han(so_ngay=3):
    hom_nay = dt.date.today()
    out = []
    for bc in doc_js("bao-cao.js", "BAO_CAO"):
        h = han_ke_tiep(bc, hom_nay)
        if h and (h - hom_nay).days <= so_ngay:
            out.append({"ten": bc["ten"], "noiNhan": bc.get("noiNhan", ""), "han": h.isoformat(), "con": (h - hom_nay).days})
    return sorted(out, key=lambda x: x["han"])


# ---------------------------------------------------------------------------
# ĐỌC BẢNG TRÊN QLVB (cùng cách với nút Quét qlvb, tools/quet-qlvb.js)
# ---------------------------------------------------------------------------
JS_DOC_BANG = r"""
(kieu) => {
  const MAT = ["Mật", "Tối mật", "Tuyệt mật"];
  const reDate = /(\d{2})\/(\d{2})\/(\d{4})/;
  const iso = (s) => { const m = reDate.exec(s || ""); return m ? m[3] + "-" + m[2] + "-" + m[1] : ""; };
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const hien = (x) => x.offsetParent !== null;
  let t = document.getElementById("dt_basic");
  if (!t || t.rows.length < 2) t = [...document.querySelectorAll("table")].filter((x) => x.rows.length > 1 && /Trích yếu/i.test(x.rows[0].innerText || "")).sort((a, b) => b.rows.length - a.rows.length)[0];
  if (!t) return /Không tìm thấy dữ liệu/i.test(document.body.innerText) ? { rows: [], boQuaMat: 0, tong: 0 } : { loi: "khong-thay-bang" };
  const th = [...t.rows[0].cells], dau = th.map((c) => clean(c.innerText));
  const rows = []; let boQuaMat = 0;
  [...t.rows].slice(1).forEach((tr) => {
    const td = [...tr.cells]; if (td.length < 3) return;
    // số ô bằng số cột: ghép theo vị trí; lệch (bảng văn bản đi có ô ẩn thừa): ghép các cột đang hiện theo thứ tự
    let c = td;
    if (td.length !== th.length) { const tdH = td.filter(hien); c = th.map((h, i) => hien(h) ? (tdH[th.slice(0, i).filter(hien).length] || null) : null); }
    const o = (...ns) => { for (const n of ns) for (let i = 0; i < dau.length; i++) if (dau[i] === n) { const x = clean(c[i] && c[i].innerText); if (x) return x; } return ""; };
    const so = o("Số ký hiệu").replace(/[_-]UBNDP_GIADINH/, ""), ty = o("Trích yếu");
    if (!so && !ty) return;
    if (MAT.includes(o("Độ mật")) || /^\(?\s*(tuyệt mật|tối mật|mật)\s*[)\-:]/i.test(ty)) { boQuaMat++; return; }
    const khan = o("Độ khẩn") || "Thường";
    if (kieu === "di") rows.push({ so, ngay: iso(o("Ngày ban hành", "Ngày phát hành", "Ngày văn bản")), loai: o("Loại văn bản") || (/\/TTr/.test(so) ? "Tờ trình" : ""), ty });
    else rows.push({ so, den: iso(o("Ngày đến", "Ngày nhận")), han: iso(o("Hạn xử lý")), khan: khan === "Hoả tốc" ? "Hỏa tốc" : khan,
      noi: o("Đơn vị ban hành").replace(/\s*-\s*(TPHCM|TUTPHCM)$/, ""), ty, loaiVb: o("Loại văn bản"), vaiTro: o("Vai trò") });
  });
  const tong = (document.body.innerText.match(/Tổng số bản ghi\s*:?\s*(\d+)/) || [])[1];
  return { rows, boQuaMat, tong: tong ? Number(tong) : null, tieuDe: document.title };
}
"""


def dang_nhap_neu_can(page, cfg):
    page.goto(URL_QLVB, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(2500)
    # trang qlvb luôn có 1 ô mật khẩu ẩn (hộp đổi mật khẩu): chỉ xét ô đang hiện
    if not page.locator("input[type=password]:visible").count():
        return
    ghi("Phiên đã hết, đăng nhập lại")
    ten = cfg["qlvb"]["ten_truy_cap"].strip()
    o_mk = page.locator("input[type=password]:visible").first
    o_ten = page.locator("input[type=text]:visible, input:not([type]):visible").first
    o_ten.fill(ten)
    o_mk.fill(mat_khau(KEYRING_QLVB, ten))
    page.get_by_role("button", name=re.compile("đăng nhập", re.I)).first.click()
    page.wait_for_timeout(5000)
    if page.locator("input[type=password]:visible").count():
        raise RuntimeError("Đăng nhập qlvb không được (sai mật khẩu, đổi mật khẩu, hoặc hệ thống yêu cầu xác thực thêm).")


def bam_chu(page, cac_chu):
    for chu in cac_chu:
        # chấp nhận số đếm ở cuối menu, ví dụ "Văn bản đến (36)"
        loc = page.get_by_text(re.compile(r"^\s*" + re.escape(chu) + r"(\s*\(\d+\))?\s*$", re.I))
        for i in range(loc.count()):
            el = loc.nth(i)
            if el.is_visible():
                el.click()
                page.wait_for_timeout(1200)
                return chu
    return None


def mo_danh_sach(page, kieu, trang_thai):
    nhom, muc, chu_tieu_de = MENU[kieu]
    da_bam = bam_chu(page, muc)          # mục con đang hiện thì bấm luôn
    if not da_bam:
        bam_chu(page, nhom)              # chưa hiện thì mở nhóm menu trước
        da_bam = bam_chu(page, muc)
    if not da_bam:
        if kieu == "xemBiet":
            return False
        raise RuntimeError(f"Không tìm thấy menu {muc[0]} trên qlvb (giao diện có thể đã đổi).")
    page.wait_for_load_state("domcontentloaded")
    page.wait_for_timeout(3000)
    # hiện 50 bản ghi mỗi trang nếu có ô chọn
    try:
        if page.locator("#selectPageRec").count():
            page.select_option("#selectPageRec", "50")
            page.wait_for_timeout(2500)
    except Exception:
        pass
    return True


def quet(cfg, hien=False):
    from playwright.sync_api import sync_playwright
    ket_qua = {}
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            str(HO_SO_CHROME), channel="chrome", headless=not hien,
            viewport={"width": 1500, "height": 900}, locale="vi-VN")
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        try:
            dang_nhap_neu_can(page, cfg)
            for kieu in ("den", "xemBiet", "di"):
                if not mo_danh_sach(page, kieu, None):
                    ghi("Không thấy menu Văn bản xem để biết, bỏ qua mục này.")
                    ket_qua[kieu] = {"rows": [], "boQuaMat": 0, "tong": 0}
                    bam_chu(page, ["Trang chủ"])
                    continue
                r = page.evaluate(JS_DOC_BANG, kieu)
                if r.get("loi") and kieu == "xemBiet":
                    ghi("Danh sách Văn bản xem để biết trống hoặc không đọc được.")
                    ket_qua[kieu] = {"rows": [], "boQuaMat": 0, "tong": 0}
                    bam_chu(page, ["Trang chủ"])
                    continue
                if r.get("loi"):
                    raise RuntimeError(f"Không đọc được bảng {kieu} (trang chưa tải xong hoặc giao diện đổi).")
                r["rows"] = [tach_han(x) for x in r["rows"]]
                ket_qua[kieu] = r
                ghi(f"Đọc {kieu}: {len(r['rows'])} dòng, bỏ qua {r['boQuaMat']} văn bản mật, tổng trên qlvb {r['tong']}")
                bam_chu(page, ["Trang chủ"])  # về trang chủ trước khi mở menu kia
        finally:
            if hien:
                page.wait_for_timeout(3000)
            ctx.close()
    return ket_qua


# ---------------------------------------------------------------------------
# MAIL
# ---------------------------------------------------------------------------
def gui_mail(cfg, tieu_de, noi_dung_html, noi_dung_text, nguoi_nhan=None):
    m = cfg["mail"]
    gui_tu = m["gui_tu"].strip()
    nhan = [x.strip() for x in (nguoi_nhan or m["gui_den"]).split(",") if x.strip()]
    msg = EmailMessage()
    msg["Subject"] = tieu_de
    msg["From"] = gui_tu
    msg["To"] = ", ".join(nhan)
    msg.set_content(noi_dung_text)
    msg.add_alternative(noi_dung_html, subtype="html")
    with smtplib.SMTP_SSL(m.get("smtp", "smtp.gmail.com"), int(m.get("cong", "465")), timeout=30) as s:
        s.login(gui_tu, mat_khau(KEYRING_MAIL, gui_tu))
        s.send_message(msg)
    ghi(f"Đã gửi mail: {tieu_de}")


def dmy(iso):
    return f"{iso[8:10]}/{iso[5:7]}/{iso[0:4]}" if iso and len(iso) == 10 else ""


THU = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"]


def ten_du(x):
    """Viết đầy đủ tên cơ quan (giống tenDu trong js/note-mail.js)."""
    x = re.sub(r"^PC\d+\s*-\s*", "", x or "", flags=re.I)
    x = re.sub(r"\bTPHCM\b|TP\.HCM", "Thành phố Hồ Chí Minh", x)
    x = re.sub(r"\bTP\b", "Thành phố", x)
    x = re.sub(r"\bUBND\b", "Ủy ban nhân dân", x)
    x = re.sub(r"\bKHCN\b", "Khoa học và Công nghệ", x)
    return re.sub(r"\bVPĐU\b", "Văn phòng Đảng ủy", x)


def de_xuat(r, hid):
    """Đề xuất cần làm gì (giống deXuat trong js/note-mail.js)."""
    noi = ten_du(r.get("noi", "")) or "cơ quan ban hành"
    return {
        "bao-cao": f"Tham mưu Báo cáo của Ủy ban nhân dân phường gửi {noi}",
        "tra-loi": f"Tham mưu Công văn trả lời, cung cấp thông tin gửi {noi}",
        "gop-y": f"Nghiên cứu dự thảo, tham mưu Công văn góp ý gửi {noi}",
        "ke-hoach": "Tham mưu Kế hoạch của Ủy ban nhân dân phường triển khai thực hiện",
        "trien-khai": "Tham mưu Công văn triển khai đến các phòng, đơn vị, khu phố",
        "quyet-dinh": "Tham mưu Quyết định của Ủy ban nhân dân phường",
        "tham-du": "Trình lãnh đạo cử người tham dự; tham mưu Công văn cử nhân sự (nếu có yêu cầu)",
        "cho-xem-xet": "Trao đổi lãnh đạo phòng để xác định hướng xử lý",
        "chuyen": "Báo văn thư chuyển đúng bộ phận xử lý",
        "de-biet": "Nghiên cứu, nắm nội dung; lưu hồ sơ và kết thúc trên hệ thống",
    }.get(hid, "Nghiên cứu, đề xuất hướng xử lý")


def soan_mail(loai, den, xem_biet, di, bc=(), da_bao_ngay=None, tong_tuan=None, gio=None, mau=False, ngay=None):
    """loai: 'sang' | 'trua' | 'chieu' | 'tuan'. Chỉ ghi văn bản mới; không dùng chữ quá hạn/tồn/trễ."""
    huong = doc_js("huong-xu-ly.js", "HUONG_XU_LY")
    hom_nay = ngay or dt.date.today()
    hn = hom_nay.isoformat()
    can, biet = [], list(xem_biet)
    for r in den:
        hid = goi_y(r, huong).get("id", "")
        (biet if hid == "de-biet" else can).append(dict(r, _hid=hid))
    can.sort(key=lambda r: r.get("khan", "Thường") == "Thường")
    gio = gio or dt.datetime.now().strftime("%H:%M")

    phan = []
    if can:
        phan.append(f"{len(can)} văn bản cần xử lý")
    if biet:
        phan.append(f"{len(biet)} văn bản để biết")
    if di:
        phan.append(f"{len(di)} văn bản đã phát hành")
    if bc:
        phan.append(f"{len(bc)} báo cáo trong 7 ngày tới")
    nhan = {"sang": "Văn bản mới", "trua": "Văn bản mới", "chieu": "Cuối ngày", "tuan": "Cuối tuần"}[loai]
    tieu_de = f"[{nhan}] {THU[hom_nay.weekday()]} {hom_nay:%d/%m}, {gio}: " + (", ".join(phan) or "không có văn bản mới")
    if mau:
        tieu_de += " (mail mẫu)"

    td = 'style="border:1px solid #ccc;padding:6px;vertical-align:top"'
    tdn = 'style="border:1px solid #ccc;padding:6px;vertical-align:top;white-space:nowrap"'

    def bang(dau, dong):
        return (f'<table cellspacing="0" style="border-collapse:collapse;font-size:14px;width:100%">'
                f'<tr style="background:#eef2f6">{"".join(f"<th {td}>{x}</th>" for x in dau)}</tr>{"".join(dong)}</table>')

    def so_khan(r):
        k = r.get("khan", "Thường")
        return f"<b>{html.escape(r['so'])}</b>" + (f"<br><span style='color:#b3261e'>{html.escape(k)}</span>" if k and k != "Thường" else "")

    def ty_noi(r):
        return html.escape(r["ty"]) + (f"<br><span style='color:#666'>{html.escape(ten_du(r.get('noi', '')))}</span>" if r.get("noi") else "")

    def han_ghi(r):
        return dmy(r["han"]) if r.get("han") and r["han"] >= hn else ""

    mo_dau = {"sang": f"Văn bản mới trên qlvb, cập nhật lúc {gio}.",
              "trua": f"Văn bản mới trên qlvb từ lần báo trước, cập nhật lúc {gio}.",
              "chieu": f"Cuối ngày: văn bản mới từ lần báo trước, cập nhật lúc {gio}.",
              "tuan": f"Cuối tuần: văn bản mới từ lần báo trước, cập nhật lúc {gio}."}[loai]
    h = ['<div style="font-family:Arial,sans-serif;font-size:14px;color:#17212c">', f"<p>{mo_dau}</p>"]
    if not (can or biet or di):
        h.append("<p>Không có văn bản mới.</p>")
    muc = 0
    if can:
        muc += 1
        h.append(f"<h3>{muc}. Văn bản cần xử lý ({len(can)})</h3>" + bang(["Số", "Trích yếu", "Đề xuất cần làm gì", "Hạn"], [
            f"<tr><td {td}>{so_khan(r)}</td><td {td}>{ty_noi(r)}</td><td {td}>{html.escape(de_xuat(r, r['_hid']))}</td><td {tdn}>{han_ghi(r)}</td></tr>" for r in can]))
    if biet:
        muc += 1
        h.append(f"<h3>{muc}. Văn bản xem để biết ({len(biet)})</h3>" + bang(["Số", "Trích yếu", "Đề xuất cần làm gì"], [
            f"<tr><td {td}>{so_khan(r)}</td><td {td}>{ty_noi(r)}</td><td {td}>{html.escape(de_xuat(r, 'de-biet'))}</td></tr>" for r in biet]))
    if di:
        muc += 1
        h.append(f"<h3>{muc}. Văn bản đã phát hành ({len(di)})</h3>" + bang(["Số", "Ngày văn bản", "Trích yếu"], [
            f"<tr><td {td}><b>{html.escape(r['so'])}</b></td><td {tdn}>{dmy(r.get('ngay', ''))}</td><td {td}>{html.escape(r['ty'])}</td></tr>"
            for r in sorted(di, key=lambda x: x.get("ngay", ""), reverse=True)]))
    if bc:
        muc += 1
        h.append(f"<h3>{muc}. Báo cáo định kỳ trong 7 ngày tới ({len(bc)})</h3>" + bang(["Báo cáo", "Gửi", "Ngày gửi"], [
            f"<tr><td {td}><b>{html.escape(b['ten'])}</b></td><td {td}>{html.escape(b['noiNhan'])}</td><td {tdn}>{dmy(b['han'])}</td></tr>" for b in bc]))
    if da_bao_ngay:
        d = da_bao_ngay
        h.append(f"<p>Trong ngày {hom_nay:%d/%m/%Y} đã báo: <b>{d['den']}</b> văn bản cần xử lý, <b>{d['xb']}</b> văn bản để biết, "
                 f"<b>{d['di']}</b> văn bản đã phát hành (tính cả mail này).</p>")
    if tong_tuan:
        dong = [f"<tr><td {td}>{THU[dt.date.fromisoformat(n).weekday()]} {dt.date.fromisoformat(n):%d/%m}</td>"
                f"<td {td} align='center'>{v['den']}</td><td {td} align='center'>{v['xb']}</td><td {td} align='center'>{v['di']}</td></tr>"
                for n, v in tong_tuan.items()]
        cong = {k: sum(v[k] for v in tong_tuan.values()) for k in ("den", "xb", "di")}
        dong.append(f"<tr style='background:#f6f8fa'><td {td}><b>Cả tuần</b></td><td {td} align='center'><b>{cong['den']}</b></td>"
                    f"<td {td} align='center'><b>{cong['xb']}</b></td><td {td} align='center'><b>{cong['di']}</b></td></tr>")
        h.append("<h3>Tổng hợp trong tuần</h3>" + bang(["Ngày", "Văn bản cần xử lý", "Văn bản để biết", "Văn bản đã phát hành"], dong)
                 + "<p style='color:#666'>Các văn bản đã báo trong tuần không liệt kê lại.</p>")
    h.append("<p style='color:#666;font-size:12px'>\"Đề xuất cần làm gì\" là gợi ý theo trích yếu, xác nhận khi mở văn bản. "
             "Văn bản mật không đưa vào mail.</p></div>")

    t = [mo_dau]
    t += [f"[CẦN XỬ LÝ] {r['so']}: {r['ty']} -> {de_xuat(r, r['_hid'])}" + (f", hạn {han_ghi(r)}" if han_ghi(r) else "") for r in can]
    t += [f"[ĐỂ BIẾT] {r['so']}: {r['ty']}" for r in biet]
    t += [f"[ĐÃ PHÁT HÀNH] {r['so']} ngày {dmy(r.get('ngay', ''))}: {r['ty']}" for r in di]
    t += [f"[BÁO CÁO] {b['ten']}: gửi {b['noiNhan']} ngày {dmy(b['han'])}" for b in bc]
    return tieu_de, "".join(h), "\n".join(t)


# ---------------------------------------------------------------------------
# TÓM TẮT VIỆC CẦN LÀM (mail buổi sáng + note trên màn hình)
# ---------------------------------------------------------------------------


def tom_tat_viec(rows_den, so_ngay_bc=7):
    """Mọi văn bản đến chờ xử lý, kèm cần làm gì và hạn, xếp theo mức gấp."""
    huong = doc_js("huong-xu-ly.js", "HUONG_XU_LY")
    hom_nay = dt.date.today()
    viec = []
    for r in rows_den:
        h = goi_y(r, huong)
        if r.get("han"):
            han = dt.date.fromisoformat(r["han"])
        else:  # hạn gợi ý tính từ ngày đến, KHÔNG dồn về hôm nay
            n = h.get("han", 5)
            k = r.get("khan", "").lower()
            n = min(n, 1) if ("hỏa" in k or "hoả" in k) else min(n, 3) if "khẩn" in k else n
            han = (dt.date.fromisoformat(r["den"]) if r.get("den") else hom_nay) + dt.timedelta(days=n)
        con = (han - hom_nay).days
        tuoi = (hom_nay - dt.date.fromisoformat(r["den"])).days if r.get("den") else 0
        if con < 0 and not r.get("han") and tuoi > 7:
            muc = "ton"        # đến lâu, chưa kết thúc trên qlvb
        elif con < 0:
            muc = "qua-han"
        elif con == 0:
            muc = "hom-nay"
        elif con == 1:
            muc = "ngay-mai"
        else:
            muc = "sap-toi"
        viec.append({"so": r["so"], "ty": r["ty"], "noi": r.get("noi", ""), "khan": r.get("khan", "Thường"),
                     "lam": h.get("ten", ""), "sanPham": "" if h.get("choXem") else h.get("sanPham", ""),
                     "han": han.isoformat(), "con": con, "muc": muc})
    thu_tu = {"qua-han": 0, "hom-nay": 1, "ngay-mai": 2, "sap-toi": 3, "ton": 4}
    viec.sort(key=lambda v: (thu_tu[v["muc"]], v["khan"] == "Thường", v["han"]))
    return {"capNhat": dt.datetime.now().isoformat(timespec="minutes"), "viec": viec,
            "baoCao": bao_cao_sap_han(so_ngay_bc)}


def luu_tom_tat(tt_viec, so_moi):
    out = dict(tt_viec, moiTrongNgay=so_moi)
    (DU_LIEU / "tom_tat.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")


# ---------------------------------------------------------------------------
def luu_json(kieu, r):
    out = {"nguon": "qlvb", "kieu": kieu, "quet": dt.datetime.now(dt.timezone.utc).isoformat(),
           "tongTrenQlvb": r["tong"], "rows": r["rows"]}
    (DU_LIEU / f"qlvb_{kieu}_moi_nhat.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")


def loai_lan_chay(now=None):
    """7:30 -> sang, 13:30 -> trua, 17:00 -> chieu (Thứ Sáu -> tuan)."""
    now = now or dt.datetime.now()
    if now.hour < 11:
        return "sang"
    if now.hour < 16:
        return "trua"
    return "tuan" if now.isoweekday() == 5 else "chieu"


def chay(cfg, hien=False, loai=None):
    tt = json.loads(TRANG_THAI.read_text(encoding="utf-8")) if TRANG_THAI.exists() else {}
    hom_nay = dt.date.today()
    hn = hom_nay.isoformat()
    # Ngày bắt đầu theo dõi: văn bản trước ngày này không đưa vào mail
    bat_dau = tt.setdefault("bat_dau", cfg["lich"].get("bat_dau", "").strip() or hn)
    da_gui = tt.setdefault("da_gui", {"den": [], "xemBiet": [], "di": []})
    loai = loai or loai_lan_chay()

    kq = quet(cfg, hien)
    # Chỉ lấy văn bản của NGÀY HÔM NAY; văn bản cũ không lấy
    truong_ngay = {"den": "den", "xemBiet": "den", "di": "ngay"}
    for kieu in ("den", "xemBiet", "di"):
        kq[kieu]["rows"] = [r for r in kq[kieu]["rows"] if (r.get(truong_ngay[kieu]) or hn) == hn]
        kq[kieu]["tong"] = None
        luu_json(kieu, kq[kieu])

    def moi(kieu, truong):
        daco = set(da_gui.get(kieu, []))
        return [r for r in kq[kieu]["rows"] if r["so"] not in daco and (r.get(truong) or hn) >= bat_dau]

    den, xb, di = moi("den", "den"), moi("xemBiet", "den"), moi("di", "ngay")
    # văn bản vừa có trong cả "chờ xử lý" và "xem để biết": giữ ở mục cần xử lý
    so_den = {r["so"] for r in den}
    xb = [r for r in xb if r["so"] not in so_den]

    # Ghi nhận số văn bản đã báo theo ngày (để báo cuối ngày, cuối tuần)
    m = cfg["mail"]
    bc = bao_cao_sap_han(int(cfg["lich"].get("bao_truoc_ngay", "7"))) if loai == "sang" else []
    huong = doc_js("huong-xu-ly.js", "HUONG_XU_LY")
    so_can = sum(1 for r in den if goi_y(r, huong).get("id") != "de-biet")
    so_biet = len(den) - so_can + len(xb)
    dem = tt.setdefault("dem", {})
    hom = dem.setdefault(hn, {"den": 0, "xb": 0, "di": 0})

    co_moi = bool(den or xb or di)
    gui = co_moi or loai in ("chieu", "tuan") or bool(bc)
    if gui:
        hom["den"] += so_can
        hom["xb"] += so_biet
        hom["di"] += len(di)
        da_bao = hom if loai in ("chieu", "tuan") else None
        tuan = None
        if loai == "tuan":
            thu_hai = hom_nay - dt.timedelta(days=hom_nay.weekday())
            tuan = {n: v for n, v in sorted(dem.items()) if thu_hai.isoformat() <= n <= hn}
        gui_mail(cfg, *soan_mail(loai, den, xb, di, bc, da_bao, tuan), nguoi_nhan=m.get("gui_den_sang", m["gui_den"]))
        for kieu, rows in (("den", den), ("xemBiet", xb), ("di", di)):
            da_gui[kieu] = (da_gui.get(kieu, []) + [r["so"] for r in rows])[-5000:]
    else:
        ghi("Không có văn bản mới, không gửi mail.")

    # giữ số đếm 31 ngày gần nhất
    tt["dem"] = {n: v for n, v in dem.items() if n >= (hom_nay - dt.timedelta(days=31)).isoformat()}
    luu_tom_tat(tom_tat_viec(kq["den"]["rows"]), hom["den"] + hom["xb"])
    tt["lan_cuoi"] = dt.datetime.now().isoformat(timespec="minutes")
    tt.pop("loi_gan_nhat", None)
    TRANG_THAI.write_text(json.dumps(tt, ensure_ascii=False, indent=1), encoding="utf-8")


def mau_mail():
    """Soạn mail mẫu từ dữ liệu minh họa, lưu ra du_lieu/mail_mau_*.html (không quét, không gửi)."""
    hn = dt.date.today()
    d = lambda n: (hn + dt.timedelta(days=n)).isoformat()
    den = [tach_han(x) for x in [
        {"so": "11215/SKHCN-CĐS", "den": d(0), "khan": "Khẩn", "noi": "Sở KHCN", "han": d(5),
         "ty": "Báo cáo kết quả thực hiện Chỉ số chuyển đổi số cấp phường quý III năm 2026"},
        {"so": "1532/UBND-VX", "den": d(0), "khan": "Thường", "noi": "UBND Thành phố",
         "ty": f"Triển khai Kế hoạch phát triển hạ tầng số trên địa bàn Thành phố năm 2027 (hạn xử lý {dt.date.fromisoformat(d(10)):%d/%m/%Y})"},
        {"so": "11230/SKHCN-KHTC", "den": d(0), "khan": "Thường", "noi": "Sở KHCN",
         "ty": "Cung cấp thông tin nhu cầu đặt hàng nhiệm vụ khoa học và công nghệ năm 2027"},
    ]]
    xb = [{"so": "6120/QĐ-UBND", "den": d(0), "khan": "Thường", "noi": "UBND Thành phố",
           "ty": "Ban hành Danh mục dịch vụ công trực tuyến toàn trình năm 2026"}]
    di = [{"so": "2440/UBND", "ngay": d(0), "ty": "Triển khai Ngày hội đổi mới sáng tạo quốc gia năm 2026"},
          {"so": "2441/BC-UBND", "ngay": d(0), "ty": "Báo cáo tuần kết quả chuyển đổi số theo Kế hoạch 40-KH/BCĐTP"}]
    bc = bao_cao_sap_han(7)
    ra = []
    for loai, gio, a in (("sang", "07:30", (den[:2], xb, [], bc)), ("trua", "13:30", (den[2:], [], di, ()))):
        tieu_de, h, _ = soan_mail(loai, *a, gio=gio, mau=True)
        p = DU_LIEU / f"mail_mau_{loai}.html"
        p.write_text(h, encoding="utf-8")
        ra.append((tieu_de, h))
    thu_hai = hn - dt.timedelta(days=hn.weekday())
    so = [(4, 2, 3), (2, 1, 5), (3, 0, 2), (3, 1, 2), (1, 1, 2)]
    tuan = {(thu_hai + dt.timedelta(days=i)).isoformat(): {"den": a, "xb": b, "di": c} for i, (a, b, c) in enumerate(so)}
    thu_sau = thu_hai + dt.timedelta(days=4)
    tieu_de, h, _ = soan_mail("tuan", [], [], [], (), tuan[thu_sau.isoformat()], tuan, gio="17:00", mau=True, ngay=thu_sau)
    (DU_LIEU / "mail_mau_tuan.html").write_text(h, encoding="utf-8")
    ra.append((tieu_de, h))
    for t, _ in ra:
        print(t)
    return ra


def bao_loi(cfg, err):
    """Gửi mail báo lỗi tối đa 1 lần mỗi ngày để khỏi spam."""
    tt = json.loads(TRANG_THAI.read_text(encoding="utf-8")) if TRANG_THAI.exists() else {}
    hom_nay = dt.date.today().isoformat()
    if tt.get("loi_gan_nhat") == hom_nay:
        return
    try:
        gui_mail(cfg, "[qlvb] Theo dõi tự động bị lỗi", f"<p>{html.escape(str(err))}</p><p>Xem nhat_ky.log. Thường do mật khẩu qlvb đã đổi hoặc giao diện qlvb thay đổi.</p>", str(err))
        tt["loi_gan_nhat"] = hom_nay
        TRANG_THAI.write_text(json.dumps(tt, ensure_ascii=False, indent=1), encoding="utf-8")
    except Exception as e2:
        ghi(f"Không gửi được mail báo lỗi: {e2}")


def main():
    ap = argparse.ArgumentParser(description="Theo dõi qlvb, gửi mail văn bản mới lúc 7:30, 13:30, 17:00")
    ap.add_argument("--luu-mat-khau", action="store_true", help="lưu mật khẩu qlvb và mật khẩu ứng dụng Gmail")
    ap.add_argument("--thu", action="store_true", help="chạy thử, hiện cửa sổ Chrome")
    ap.add_argument("--gui-thu-mail", action="store_true", help="gửi 1 mail thử")
    ap.add_argument("--lam-lai-moc", action="store_true", help="xóa mốc cũ, lần chạy tới coi như lần đầu")
    ap.add_argument("--mau-mail", action="store_true", help="soạn mail mẫu từ dữ liệu minh họa (không quét, không gửi)")
    ap.add_argument("--loai", choices=["sang", "trua", "chieu", "tuan"], help="ép loại mail (mặc định theo giờ chạy)")
    a = ap.parse_args()
    if a.mau_mail:
        mau_mail()
        return
    cfg = doc_cau_hinh()

    if a.luu_mat_khau:
        import keyring
        ten = cfg["qlvb"]["ten_truy_cap"].strip()
        keyring.set_password(KEYRING_QLVB, ten, getpass.getpass(f"Mật khẩu qlvb của {ten} (gõ không hiện chữ): "))
        gmail = cfg["mail"]["gui_tu"].strip()
        keyring.set_password(KEYRING_MAIL, gmail, getpass.getpass(f"Mật khẩu ỨNG DỤNG Gmail của {gmail} (16 ký tự): ").replace(" ", ""))
        print("Đã lưu vào Windows Credential Manager. Không có mật khẩu nào nằm trong thư mục dự án.")
        return
    if a.gui_thu_mail:
        gui_mail(cfg, "[qlvb] Mail thử", "<p>Gửi mail thử thành công.</p>", "Gửi mail thử thành công.")
        return
    if a.lam_lai_moc and TRANG_THAI.exists():
        TRANG_THAI.unlink()
        print("Đã xóa mốc.")
        return

    # chỉ chạy vào các ngày đã cấu hình (Task Scheduler gọi lúc 7:30, 13:30, 17:00)
    g = cfg["lich"]
    if not a.thu and not a.loai:
        ngay = [int(x) for x in g.get("thu_trong_tuan", "1,2,3,4,5").split(",")]
        if dt.datetime.now().isoweekday() not in ngay:
            return
    try:
        chay(cfg, hien=a.thu, loai=a.loai)
    except Exception as e:
        ghi("LỖI: " + str(e))
        ghi(traceback.format_exc())
        bao_loi(cfg, e)
        sys.exit(1)


if __name__ == "__main__":
    main()
