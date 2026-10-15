/* Sinh các kỳ báo cáo từ danh mục config/bao-cao.js */
(function () {
  "use strict";
  const { iso, parse, addDays, dm, WD } = window.BLV;
  const lastDay = (y, m) => new Date(y, m + 1, 0).getDate();
  const dateIn = (y, m, d) => iso(new Date(y, m, Math.min(d, lastDay(y, m))));

  function chuKyText(bc) {
    const c = bc.chuKy || {};
    switch (c.loai) {
      case "tuan": return "Hằng tuần" + (c.han != null ? ", hạn " + WD[c.han] : "");
      case "thang": return "Hằng tháng" + (c.han ? ", ngày " + c.han : "");
      case "quy": return "Hằng quý" + (c.han ? ", ngày " + c.han + " tháng đầu quý sau" : "");
      case "nam": return (c.thang === 6 ? "6 tháng" : c.thang === 9 ? "9 tháng" : c.thang === 12 ? "Hằng năm" : "Tháng " + c.thang) + (c.han ? ", ngày " + c.han + "/" + c.thang : "");
      case "dot-xuat": return "Đột xuất";
      default: return "Chưa rõ";
    }
  }

  // Trả về các mục lịch của một báo cáo trong khoảng [from, to]
  function kyBaoCao(bc, from, to) {
    const c = bc.chuKy || {};
    const out = [];
    const ev = (date, title, note) => out.push({ id: bc.id + "@" + date + "@" + title.slice(0, 4), date, kind: "blue", title, note, recurring: true, bcId: bc.id });
    const nguon = (bc.canCu ? "Theo " + bc.canCu + " · " : "") + "gửi " + bc.noiNhan + (bc.xacNhan ? "" : " · lịch gợi ý");
    if (c.loai === "tuan" && c.han != null) {
      for (let d = from; d <= to; d = addDays(d, 1)) {
        const w = parse(d).getDay();
        if (c.chot != null && c.chot !== c.han && w === c.chot) ev(d, "Chốt số liệu: " + bc.ten, "Kỳ " + dm(addDays(d, -7)) + "–" + dm(d));
        if (w === c.han) ev(d, "Hạn: " + bc.ten, nguon);
      }
    } else if (c.loai === "thang" && c.han) {
      const s = parse(from), e = parse(to);
      for (let y = s.getFullYear(), m = s.getMonth(); y < e.getFullYear() || (y === e.getFullYear() && m <= e.getMonth()); m++, (m > 11 && (m = 0, y++))) {
        const d = dateIn(y, m, c.han);
        if (d >= from && d <= to) ev(d, "Hạn: " + bc.ten + " tháng " + (m + 1), nguon);
      }
    } else if (c.loai === "quy" && c.han) {
      const s = parse(from), e = parse(to);
      for (let y = s.getFullYear(); y <= e.getFullYear(); y++) {
        [0, 3, 6, 9].forEach((m, q) => {
          const d = dateIn(y, m, c.han);
          if (d >= from && d <= to) ev(d, "Hạn: " + bc.ten + " quý " + (q === 0 ? "IV/" + (y - 1) : ["I", "II", "III"][q - 1] + "/" + y), nguon);
        });
      }
    } else if (c.loai === "nam" && c.han && c.thang) {
      const s = parse(from), e = parse(to);
      for (let y = s.getFullYear(); y <= e.getFullYear(); y++) {
        const d = dateIn(y, c.thang - 1, c.han);
        if (d >= from && d <= to) ev(d, "Hạn: " + bc.ten + " năm " + y, nguon);
      }
    }
    return out;
  }

  // Kỳ hạn gần nhất từ hôm nay (trong 400 ngày tới)
  function kyToi(bc, today) {
    const evs = kyBaoCao(bc, today, addDays(today, 400)).filter((e) => e.title.startsWith("Hạn"));
    return evs.length ? evs[0].date : null;
  }

  // Khoảng số liệu của kỳ báo cáo sắp tới: { from, to, han }
  function kyGanNhat(bc, today) {
    const c = bc.chuKy || {};
    const han = kyToi(bc, today);
    if (!han) return { from: addDays(today, -30), to: today, han: null };
    const h = parse(han);
    if (c.loai === "tuan") {
      const chot = addDays(han, -(((c.han - (c.chot ?? c.han)) + 7) % 7));
      return { from: addDays(chot, -7), to: chot, han };
    }
    if (c.loai === "thang") return { from: iso(new Date(h.getFullYear(), h.getMonth() - 1, 1)), to: iso(new Date(h.getFullYear(), h.getMonth(), 0)), han };
    if (c.loai === "quy") { const q = Math.floor(h.getMonth() / 3); return { from: iso(new Date(h.getFullYear(), q * 3 - 3, 1)), to: iso(new Date(h.getFullYear(), q * 3, 0)), han }; }
    if (c.loai === "nam") return { from: h.getFullYear() + "-01-01", to: iso(new Date(h.getFullYear(), c.thang, 0)), han };
    return { from: addDays(today, -30), to: today, han };
  }

  window.BLV.kyGanNhat = kyGanNhat;
  window.BLV.chuKyText = chuKyText;
  window.BLV.kyBaoCao = kyBaoCao;
  window.BLV.kyToi = kyToi;
})();
