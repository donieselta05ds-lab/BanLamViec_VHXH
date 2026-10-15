/*
 * NÚT "QUÉT QLVB" (bookmarklet), bản 3
 * ----------------------------------------------------------------------------
 * Trang cai-dat-nut-quet.html dựng nút từ hàm dưới đây. Không cần cài phần mềm,
 * không lưu mật khẩu: nút chạy trên trang qlvb bạn đang mở và đã đăng nhập.
 *
 * Bấm nút trên trang qlvb:
 *   1. Mở tab Bàn làm việc (ngay lúc bấm, để trình duyệt không chặn cửa sổ mới).
 *   2. Mở các danh sách trong một KHUNG ẨN (trang qlvb đang xem không bị chuyển đi):
 *      Văn bản đến chờ xử lý, Văn bản xem để biết, Văn bản đi đã phát hành.
 *   3. Đọc bảng theo tên cột (Số ký hiệu, Trích yếu, Ngày đến, Hạn xử lý, Độ khẩn…).
 *   4. CHỈ GIỮ VĂN BẢN CỦA NGÀY HÔM NAY; bỏ qua văn bản có độ mật.
 *   5. Đọc chữ trong tệp PDF (bằng trình xem PDF có sẵn của qlvb) để Bàn làm việc tóm tắt:
 *      văn bản đến chờ xử lý: đọc kỹ (tối đa 8 trang); văn bản đi đã phát hành: đọc sơ
 *      (2 trang đầu); văn bản xem để biết: không đọc nội dung.
 *   6. Chuyển dữ liệu sang tab Bàn làm việc bằng postMessage (chỉ trong trình duyệt).
 * Chỉ ĐỌC: không bấm xử lý, không chuyển, không kết thúc văn bản trên qlvb.
 * WEB rỗng: tải về tệp .json (nhập bằng nút "Nhập dữ liệu qlvb").
 * WEB === "?thu" (hoặc "?thu:yyyy-mm-dd"): chạy thử, không mở tab, kết quả ở window.__blvKetQua.
 */
window.NUT_QUET = function (WEB) {
  var MAT = ["Mật", "Tối mật", "Tuyệt mật"];
  var reDate = /(\d{2})\/(\d{2})\/(\d{4})/;
  var iso = function (s) { var m = reDate.exec(s || ""); return m ? m[3] + "-" + m[2] + "-" + m[1] : ""; };
  var clean = function (s) { return (s || "").replace(/\s+/g, " ").trim(); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var THU = /^\?thu/.test(WEB || "");
  var n0 = new Date();
  var HOM_NAY = n0.getFullYear() + "-" + ("0" + (n0.getMonth() + 1)).slice(-2) + "-" + ("0" + n0.getDate()).slice(-2);
  if (THU && /\d{4}-\d{2}-\d{2}/.test(WEB)) HOM_NAY = WEB.match(/\d{4}-\d{2}-\d{2}/)[0];   // chạy thử với ngày khác
  var TOI_DA_DOC = 20;          // số văn bản tối đa đọc nội dung mỗi lần quét
  var TOI_DA_CHU = 15000;       // số ký tự tối đa lấy từ mỗi văn bản

  function note(msg, ok, giu) {
    var d = document.getElementById("__blv_note") || document.createElement("div");
    d.id = "__blv_note";
    d.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647;max-width:460px;padding:12px 16px;border-radius:8px;font:14px/1.45 Arial,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.25);color:#fff;background:" + (ok ? "#1f4e79" : "#9a3412");
    d.textContent = msg;
    document.body.appendChild(d);
    clearTimeout(note.h);
    if (!giu) note.h = setTimeout(function () { d.remove(); }, 12000);
  }

  if (!/qlvb\.tphcm\.gov\.vn$/i.test(location.hostname)) { alert("Mở trang qlvb.tphcm.gov.vn (đã đăng nhập) rồi bấm nút Quét qlvb."); return; }
  // (trang qlvb luôn có 1 ô mật khẩu ẩn trong hộp đổi mật khẩu: chỉ xét ô đang hiện)
  if ([].slice.call(document.querySelectorAll("input[type=password]")).some(function (x) { return x.offsetParent !== null; })) { note("Đăng nhập qlvb trước rồi bấm lại."); return; }
  if (window.__blvDangQuet) return;
  window.__blvDangQuet = true;

  // Mở tab Bàn làm việc ngay lúc bấm (sau khi chờ quét, trình duyệt sẽ chặn cửa sổ mới)
  var tab = WEB && !THU ? window.open(WEB + "#dang-quet", "ban-lam-viec") : null;
  var webSanSang = false;
  window.addEventListener("message", function (e) { if (e.data === "blv-san-sang") webSanSang = true; });

  // ---------- khung ẩn ----------
  var khung = document.createElement("iframe");
  khung.style.cssText = "position:fixed;left:-10000px;top:0;width:1400px;height:900px;border:0";
  document.body.appendChild(khung);
  function choTai() { return new Promise(function (r) { khung.addEventListener("load", function () { r(); }, { once: true }); }); }
  function kd() { return khung.contentDocument; }
  async function cho(dk, ms) {
    for (var t = 0; t < ms; t += 300) { try { if (dk()) return true; } catch (e) { /* đang tải */ } await sleep(300); }
    return false;
  }
  var chuan = function (s) { return clean(s).replace(/\s*\(\d+\)\s*$/, "").toLowerCase(); };
  function timMenu(d, cacChu) {
    var els = [].slice.call(d.querySelectorAll("a"));
    for (var i = 0; i < cacChu.length; i++) {
      for (var j = 0; j < els.length; j++) {
        var a = els[j];
        var t = chuan([].slice.call(a.childNodes).filter(function (x) { return x.nodeType === 3 || (x.tagName === "SPAN" && !/count/.test(x.className)); }).map(function (x) { return x.textContent; }).join(" "));
        if (t === cacChu[i].toLowerCase()) return a;
      }
    }
    return null;
  }
  function bang(d) {
    var t = d.getElementById("dt_basic");
    if (t && t.rows.length) return t;
    t = [].slice.call(d.querySelectorAll("table")).filter(function (x) { return x.rows.length && /Trích yếu/i.test(x.rows[0].innerText || ""); });
    return t.sort(function (a, b) { return b.rows.length - a.rows.length; })[0] || null;
  }
  function trong(d) { return /Không tìm thấy dữ liệu/i.test((d.body && d.body.innerText) || ""); }
  function dauVet(d) { var b = bang(d); return b ? b.rows.length + "|" + clean(b.rows[1] && b.rows[1].innerText).slice(0, 80) : ""; }

  var daThay = [];
  async function moDanhSach(cacChu) {
    var p = choTai();
    khung.src = "/qlvbdh/main?lang=vi";
    await p; await sleep(800);
    var a = timMenu(kd(), cacChu);
    if (!a) {
      daThay = daThay.concat([].slice.call(kd().querySelectorAll("li li a")).map(function (x) { return chuan(x.textContent); }).filter(function (t) { return /^văn bản/.test(t); }));
      return false;
    }
    p = choTai(); a.click(); await p;
    var co = await cho(function () { return (bang(kd()) && bang(kd()).rows.length > 1) || trong(kd()); }, 15000);
    if (!co) return false;
    // hiện 50 bản ghi
    var d = kd(), sel = d.getElementById("selectPageRec"), w = khung.contentWindow;
    if (sel && sel.value !== "50" && bang(d) && bang(d).rows.length > 1) {
      var v = dauVet(d);
      if (w.jQuery) w.jQuery(sel).val("50").trigger("change"); else { sel.value = "50"; sel.dispatchEvent(new Event("change", { bubbles: true })); }
      await cho(function () { return dauVet(kd()) !== v; }, 8000);
      await sleep(500);
    }
    return true;
  }

  // Đọc bảng theo tên cột (bảng có nhiều cột ẩn trùng tên: lấy ô đầu tiên có chữ)
  function docBang(kieu) {
    var d = kd(), t = bang(d), rows = [], boQuaMat = 0;
    if (!t || t.rows.length < 2) return { rows: [], boQuaMat: 0 };
    var hien = function (x) { return x.offsetParent !== null; };
    var th = [].slice.call(t.rows[0].cells);
    var dau = th.map(function (c) { return clean(c.innerText); });
    [].slice.call(t.rows).slice(1).forEach(function (tr, idx) {
      var td = [].slice.call(tr.cells);
      if (td.length < 3) return;
      // Số ô bằng số cột: ghép theo vị trí. Lệch (bảng văn bản đi có thêm ô ẩn): ghép các cột ĐANG HIỆN theo thứ tự
      var c = td;
      if (td.length !== th.length) {
        var tdHien = td.filter(hien);
        c = th.map(function (h) { return null; });
        th.forEach(function (h, i) { if (hien(h)) { var k = th.slice(0, i).filter(hien).length; c[i] = tdHien[k] || null; } });
      }
      var o = function () {
        for (var k = 0; k < arguments.length; k++) {
          for (var i = 0; i < dau.length; i++) if (dau[i] === arguments[k]) { var x = clean(c[i] && c[i].innerText); if (x) return x; }
        }
        return "";
      };
      var so = o("Số ký hiệu").replace(/[_-]UBNDP_GIADINH/, "");
      var ty = o("Trích yếu");
      if (!so && !ty) return;
      var mat = o("Độ mật");
      if (MAT.indexOf(mat) >= 0 || /^\(?\s*(tuyệt mật|tối mật|mật)\s*[)\-:]/i.test(ty)) { boQuaMat++; return; }
      var khan = o("Độ khẩn") || "Thường";
      if (kieu === "di") {
        rows.push({ so: so, ngay: iso(o("Ngày ban hành", "Ngày phát hành", "Ngày văn bản")), loai: o("Loại văn bản") || (/\/TTr/.test(so) ? "Tờ trình" : ""), ty: ty, _dong: idx + 1 });
      } else {
        rows.push({ so: so, den: iso(o("Ngày đến", "Ngày nhận")), han: iso(o("Hạn xử lý")), khan: khan === "Hoả tốc" ? "Hỏa tốc" : khan,
          noi: o("Đơn vị ban hành").replace(/\s*-\s*(TPHCM|TUTPHCM)$/, ""), ty: ty, loaiVb: o("Loại văn bản"), vaiTro: o("Vai trò"), _dong: idx + 1 });
      }
    });
    return { rows: rows, boQuaMat: boQuaMat };
  }

  // Mở chi tiết 1 văn bản trong khung ẩn và đọc chữ trong tệp PDF bằng trình xem PDF của qlvb
  async function docNoiDung(dong, ty, soTrang) {
    var d = kd(), t = bang(d);
    if (!t || !t.rows[dong]) return "";
    var tr = t.rows[dong];
    var oTy = tr.querySelector(".trichyeu_vbden") || [].slice.call(tr.cells).filter(function (td) { return td.offsetParent !== null && clean(td.innerText) === ty; })[0] || tr;
    var cu = [].slice.call(d.querySelectorAll("iframe")).filter(function (f) { return /viewer\.jsp/.test(f.src || ""); }).map(function (f) { return f.src; }).join("|");
    oTy.click();
    var vw = null;
    await cho(function () {
      var f = [].slice.call(kd().querySelectorAll("iframe")).filter(function (x) { return /viewer\.jsp/.test(x.src || ""); });
      if (f.length && f.map(function (x) { return x.src; }).join("|") !== cu) { vw = f[0]; return true; }
      return false;
    }, 10000);
    if (!vw) return "";
    var app = null;
    await cho(function () { app = vw.contentWindow && vw.contentWindow.PDFViewerApplication; return app && app.pdfDocument; }, 12000);
    if (!app || !app.pdfDocument) return "";
    var doc = app.pdfDocument, s = "";
    for (var p = 1; p <= Math.min(doc.numPages, soTrang || 8) && s.length < TOI_DA_CHU; p++) {
      var tc = await (await doc.getPage(p)).getTextContent();
      s += tc.items.map(function (i) { return i.str; }).join(" ") + "\n";
    }
    return s.replace(/[ \t]+/g, " ").slice(0, TOI_DA_CHU);
  }

  // soTrang: số trang PDF cần đọc (0 = không đọc nội dung)
  async function quet(cacChu, kieu, nhan, truongNgay, soTrang) {
    note("Đang quét " + nhan + "… (đừng đóng trang này)", true, true);
    if (!(await moDanhSach(cacChu))) return null;
    var kq = docBang(kieu);
    kq.rows = kq.rows.filter(function (r) { return r[truongNgay] === HOM_NAY; });
    var can = soTrang ? kq.rows.slice(0, TOI_DA_DOC) : [];
    for (var i = 0; i < can.length; i++) {
      note("Đang đọc nội dung " + nhan + " " + (i + 1) + "/" + can.length + ": " + can[i].so, true, true);
      try { can[i].nd = await docNoiDung(can[i]._dong, can[i].ty, soTrang); } catch (e) { can[i].nd = ""; }
    }
    kq.rows.forEach(function (r) { delete r._dong; });
    return kq;
  }

  (async function () {
    try {
      var den = await quet(["Văn bản đến chờ xử lý", "Văn bản đến cần xử lý", "Văn bản chờ xử lý"], "den", "văn bản đến", "den", 8);
      var xemBiet = await quet(["Văn bản xem để biết", "Văn bản đến xem để biết"], "xemBiet", "văn bản xem để biết", "den", 0);
      var di = await quet(["Văn bản đi đã phát hành", "Văn bản đã phát hành"], "di", "văn bản đi", "ngay", 2);
      khung.remove();
      if (!den && !di) {
        var thay = daThay.filter(function (t, i, a) { return a.indexOf(t) === i; }).slice(0, 12);
        note("Không tự mở được danh sách. Chụp màn hình này gửi người hỗ trợ." + (thay.length ? " Các mục thấy được: " + thay.join("; ") : ""), false, true);
        if (tab) tab.close();
        return;
      }
      var goi = { nguon: "qlvb", ban: 3, ngay: HOM_NAY, quet: new Date().toISOString(), den: den, xemBiet: xemBiet, di: di };
      var tom = "hôm nay: " + [den ? den.rows.length + " văn bản đến" : "", xemBiet ? xemBiet.rows.length + " văn bản để biết" : "", di ? di.rows.length + " văn bản đi" : ""].filter(Boolean).join(", ")
        + ((den && den.boQuaMat) ? " (bỏ qua " + den.boQuaMat + " văn bản mật)" : "");
      if (THU) { window.__blvKetQua = goi; note("Chạy thử xong, " + tom + ".", true); return; }
      if (tab && !tab.closed) {
        // chờ Bàn làm việc báo sẵn sàng rồi gửi dữ liệu (postMessage chỉ đi giữa 2 tab trên máy)
        await cho(function () { return webSanSang; }, 15000);
        var dich = new URL(WEB, location.href).origin;
        tab.postMessage({ loai: "blv-qlvb", goi: goi }, dich);
        try { tab.focus(); } catch (e) { /* bỏ qua */ }
        note("Đã quét " + tom + ". Đã chuyển sang Bàn làm việc.", true);
      } else {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([JSON.stringify(goi)], { type: "application/json" }));
        a.download = "qlvb_" + new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "") + ".json";
        document.body.appendChild(a); a.click(); a.remove();
        note("Đã quét " + tom + ", đã tải tệp " + a.download + ". Mở Bàn làm việc → Nhập dữ liệu qlvb." + (WEB ? " (Trình duyệt chặn mở tab: cho phép cửa sổ bật lên cho qlvb.)" : ""), true);
      }
    } catch (e) {
      note("Quét bị lỗi: " + (e && e.message ? e.message : e), false, true);
    } finally {
      window.__blvDangQuet = false;
      if (khung.parentNode) khung.remove();
    }
  })();
};
