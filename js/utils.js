/* Hàm dùng chung: ngày tháng, chuỗi, lưu trên trình duyệt */
(function () {
  "use strict";
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const dm = (s) => s.slice(8, 10) + "/" + s.slice(5, 7);
  const dmy = (s) => dm(s) + "/" + s.slice(0, 4);
  const diff = (a, b) => Math.round((parse(a) - parse(b)) / 86400000);
  const WD = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const longDate = (s) => WD[parse(s).getDay()] + ", " + dmy(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const load = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* trình duyệt chặn lưu: bỏ qua */ } };

  window.BLV = { pad, iso, parse, addDays, dm, dmy, diff, WD, longDate, esc, load, save, today: iso(new Date()) };
})();
