"""
Nhập danh sách văn bản xuất từ qlvb vào data/local.js.

Cách dùng (chạy trong thư mục dự án):
    python tools/nhap_qlvb.py --den van_ban_den.xlsx --di van_ban_di.xlsx

- --den: file Excel/CSV danh sách "Văn bản đến chờ xử lý"
- --di : file Excel/CSV danh sách "Văn bản đi đã phát hành"
Có thể chỉ truyền một trong hai. Phần "viec" (việc cần làm) và "doso"
(thư mục làm dở) đang có trong data/local.js được giữ nguyên.

Công cụ tự nhận cột theo tên tiêu đề (Số ký hiệu, Trích yếu, Ngày đến,
Ngày ban hành, Độ khẩn, Đơn vị ban hành, Loại văn bản), không cần đúng thứ tự cột.
"""
import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    sys.exit("Thiếu thư viện pandas. Chạy: pip install -r tools/requirements.txt")

ROOT = Path(__file__).resolve().parent.parent
LOCAL = ROOT / "data" / "local.js"

COLS = {
    "so": ["số ký hiệu", "so ky hieu", "số, ký hiệu"],
    "ty": ["trích yếu", "trich yeu"],
    "den": ["ngày đến", "ngay den"],
    "ngay": ["ngày ban hành", "ngay ban hanh", "ngày văn bản"],
    "khan": ["độ khẩn", "do khan"],
    "noi": ["đơn vị ban hành", "don vi ban hanh", "nơi ban hành"],
    "loai": ["loại văn bản", "loai van ban"],
}


def read_table(path):
    p = Path(path)
    if p.suffix.lower() in (".xlsx", ".xls"):
        raw = pd.read_excel(p, header=None, dtype=str)
    else:
        sep = "\t" if p.suffix.lower() in (".tsv", ".txt") else ","
        raw = pd.read_csv(p, header=None, dtype=str, sep=sep)
    raw = raw.fillna("")
    # tìm dòng tiêu đề trong 10 dòng đầu
    for i in range(min(10, len(raw))):
        cells = [str(c).strip().lower() for c in raw.iloc[i]]
        if any("trích yếu" in c or "trich yeu" in c for c in cells):
            df = raw.iloc[i + 1:].copy()
            df.columns = cells
            return df
    sys.exit(f"Không tìm thấy dòng tiêu đề có cột 'Trích yếu' trong {path}")


def pick(df, key):
    names = COLS[key]
    # lấy cột cuối cùng khớp tên và có dữ liệu (qlvb có cột trùng tên bị ẩn)
    cands = [c for c in df.columns if any(n in c for n in names)]
    for c in reversed(cands):
        col = df[c] if not isinstance(df[c], pd.DataFrame) else df[c].iloc[:, -1]
        if col.astype(str).str.strip().ne("").any():
            return col.astype(str).str.strip().tolist()
    return [""] * len(df)


def to_iso(s):
    s = str(s).strip()
    m = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})", s)
    if m:
        return f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", s)
    return m.group(0) if m else ""


def clean_so(s):
    return re.sub(r"[_-]UBNDP_GIADINH", "", s).strip()


def nhap_den(path, di_list):
    df = read_table(path)
    so, ty, den, khan, noi = (pick(df, k) for k in ("so", "ty", "den", "khan", "noi"))
    out = []
    di_text = " ".join(d["ty"] for d in di_list)
    for i in range(len(df)):
        if not so[i] and not ty[i]:
            continue
        k = khan[i] or "Thường"
        so_goc = so[i].split("/")[0]
        nhac = so_goc and so_goc in di_text
        mau = "green" if nhac else ("red" if k.lower() in ("khẩn", "hỏa tốc", "hoả tốc", "thượng khẩn") else "amber")
        out.append(dict(so=clean_so(so[i]), den=to_iso(den[i]), khan=k, noi=noi[i], ty=ty[i],
                        dc="Có văn bản đi nhắc số " + so_goc if nhac else "Chưa đối chiếu", mau=mau))
    return out


def nhap_di(path):
    df = read_table(path)
    so, ty, ngay, loai = (pick(df, k) for k in ("so", "ty", "ngay", "loai"))
    out = []
    for i in range(len(df)):
        if not so[i] and not ty[i]:
            continue
        s = clean_so(so[i])
        is_ttr = "/TTr" in s or loai[i] == "Tờ trình"
        out.append(dict(so=s, ngay=to_iso(ngay[i]), loai=loai[i] or ("Tờ trình" if is_ttr else ""), ty=ty[i],
                        tt="Tờ trình, kiểm tra văn bản chính" if is_ttr else "Hoàn thành",
                        mau="amber" if is_ttr else "green", tm=""))
    return out


def load_local():
    if not LOCAL.exists():
        return {"den": [], "di": [], "doso": [], "viec": []}
    txt = LOCAL.read_text(encoding="utf-8")
    body = txt.split("window.QLVB =", 1)[1].rsplit(";", 1)[0]
    return json.loads(body)


def main():
    ap = argparse.ArgumentParser(description="Nhập danh sách văn bản từ qlvb vào data/local.js")
    ap.add_argument("--den", help="file văn bản đến chờ xử lý (.xlsx, .xls, .csv)")
    ap.add_argument("--di", help="file văn bản đi đã phát hành (.xlsx, .xls, .csv)")
    a = ap.parse_args()
    if not a.den and not a.di:
        ap.error("cần ít nhất --den hoặc --di")

    data = load_local()
    if a.di:
        data["di"] = nhap_di(a.di)
    if a.den:
        data["den"] = nhap_den(a.den, data.get("di", []))
        data["tongDen"] = len(data["den"])
    data["nguon"] = "that"
    data["quet"] = datetime.now().strftime("%H:%M, %d/%m/%Y")

    LOCAL.parent.mkdir(exist_ok=True)
    LOCAL.write_text(
        "/* DỮ LIỆU THẬT – KHÔNG ĐƯA LÊN GITHUB (đã có trong .gitignore) */\n"
        "window.QLVB = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n",
        encoding="utf-8",
    )
    print(f"Đã ghi {LOCAL}: {len(data.get('den', []))} văn bản đến, {len(data.get('di', []))} văn bản đi.")


if __name__ == "__main__":
    main()
