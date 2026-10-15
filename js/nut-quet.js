/*
 * NÚT "QUÉT QLVB" (bookmarklet), bản 2: bấm 1 lần quét cả văn bản đến và văn bản đi
 * ----------------------------------------------------------------------------
 * Trang cai-dat-nut-quet.html dựng nút từ hàm dưới đây. Không cần cài phần mềm,
 * không lưu mật khẩu: nút chạy ngay trên trang qlvb bạn đang mở và đã đăng nhập.
 *
 * Bấm nút trên trang qlvb:
 *   1. Mở tab Bàn làm việc (ngay lúc bấm, để trình duyệt không chặn cửa sổ mới).
 *   2. Tự bấm menu Văn bản đến → cần xử lý, xem để biết; chọn 50 bản ghi, đọc bảng.
 *   3. Tự bấm menu Văn bản đi → Văn bản đi đã phát hành, đọc bảng.
 *   Chỉ giữ văn bản của NGÀY HÔM NAY; văn bản cũ không lấy.
 *   4. Bỏ qua văn bản có độ mật; chỉ đọc, không bấm xử lý, không sửa gì trên qlvb.
 *   5. Chuyển dữ liệu sang tab Bàn làm việc qua phần "#" của địa chỉ (phần này chỉ
 *      nằm trong trình duyệt, không gửi lên máy chủ nào). Web tự nhập.
 * Không có địa chỉ Bàn làm việc (web mở bằng tệp trên máy): nút tải về 1 tệp .json,
 * nhập bằng nút "Nhập dữ liệu qlvb".
 */
window.NUT_QUET = function (WEB) {
  var KHAN = ["Thường", "Khẩn", "Hỏa tốc", "Hoả tốc", "Thượng khẩn"];
  var LOAI = ["Công văn", "Kế hoạch", "Quyết định", "Tờ trình", "Báo cáo", "Thông báo", "Giấy mời", "Thư mời", "Nghị quyết", "Chỉ thị", "Hướng dẫn", "Khác"];
  var MAT = ["Mật", "Tối mật", "Tuyệt mật"];
  var reSo = /^\d[\d.]*\/[A-Za-zĐđ0-9&.\-\/_]+$/;
  var reDate = /(\d{2})\/(\d{2})\/(\d{4})/;
  var iso = function (s) { var m = reDate.exec(s || ""); return m ? m[3] + "-" + m[2] + "-" + m[1] : ""; };
  var clean = function (s) { return (s || "").replace(/\s+/g, " ").trim(); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  function note(msg, ok, giu) {
    var d = document.getElementById("__blv_note") || document.createElement("div");
    d.id = "__blv_note";
    d.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647;max-width:440px;padding:12px 16px;border-radius:8px;font:14px/1.45 Arial,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.25);color:#fff;background:" + (ok ? "#1f4e79" : "#9a3412");
    d.textContent = msg;
    document.body.appendChild(d);
    clearTimeout(note.h);
    if (!giu) note.h = setTimeout(function () { d.remove(); }, 10000);
  }

  if (!/qlvb\.tphcm\.gov\.vn$/i.test(location.hostname)) { alert("Mở trang qlvb.tphcm.gov.vn (đã đăng nhập) rồi bấm nút Quét qlvb."); return; }
  if (document.querySelector("input[type=password]")) { note("Đăng nhập qlvb trước rồi bấm lại."); return; }
  if (window.__blvDangQuet) return;
  window.__blvDangQuet = true;

  // Mở tab Bàn làm việc ngay lúc bấm (sau khi chờ quét, trình duyệt sẽ chặn cửa sổ mới)
  var tab = WEB ? window.open(WEB + "#dang-quet", "ban-lam-viec") : null;

  function hien(el) { return el && el.offsetParent !== null; }
  // Trang chính và các khung (iframe) cùng trang: bảng danh sách có thể nằm trong khung
  function cacTrang() {
    var ds = [document];
    [].slice.call(document.querySelectorAll("iframe, frame")).forEach(function (f) { try { if (f.contentDocument) ds.push(f.contentDocument); } catch (e) { /* khác tên miền */ } });
    return ds;
  }
  // Bỏ số đếm ở cuối menu, ví dụ "Văn bản đến (36)" -> "văn bản đến"
  var chuan = function (s) { return clean(s).replace(/\s*\(\d+\)\s*$/, "").toLowerCase(); };
  function timChu(cacChu) {
    var els = [].slice.call(document.querySelectorAll("a, span, li, div, button, td"));
    for (var i = 0; i < cacChu.length; i++) {
      var c = cacChu[i].toLowerCase();
      for (var j = 0; j < els.length; j++) {
        var e = els[j];
        if (hien(e) && e.children.length <= 3 && chuan(e.textContent) === c) return e.querySelector("a") || e;
      }
    }
    return null;
  }
  // Các mục con đang hiện dưới một nhóm menu (để báo lại khi không tìm thấy tên mục)
  function mucDangHien() {
    return [].slice.call(document.querySelectorAll("li a, li span")).filter(hien).map(function (e) { return clean(e.textContent); })
      .filter(function (t) { return /^Văn bản|xử lý|phát hành|để biết/i.test(t) && t.length < 60; })
      .filter(function (t, i, a) { return a.indexOf(t) === i; }).slice(0, 14);
  }
  function bang() {
    var t = [];
    cacTrang().forEach(function (d) {
      [].slice.call(d.querySelectorAll("table")).forEach(function (x) { if (hien(x) && x.rows.length > 1 && /Trích yếu/i.test(x.rows[0].innerText || "")) t.push(x); });
    });
    return t.sort(function (a, b) { return b.rows.length - a.rows.length; })[0] || null;
  }
  function tongBanGhi() {
    for (var i = 0, ds = cacTrang(); i < ds.length; i++) {
      var m = ((ds[i].body && ds[i].body.innerText) || "").match(/Tổng số bản ghi\s*:?\s*(\d+)/);
      if (m) return Number(m[1]);
    }
    return null;
  }
  function oChonSoDong() {
    for (var i = 0, ds = cacTrang(); i < ds.length; i++) { var x = ds[i].getElementById("selectPageRec"); if (x) return x; }
    return null;
  }
  function dauVet() { var b = bang(); return b ? b.rows.length + "|" + clean(b.rows[1] && b.rows[1].innerText).slice(0, 80) : ""; }

  async function cho(dk, ms) {
    for (var t = 0; t < ms; t += 300) { if (dk()) return true; await sleep(300); }
    return false;
  }
  var daThay = [];   // tên các mục menu thấy được, để báo lại khi lỗi
  async function moDanhSach(nhom, muc) {
    var truoc = dauVet();
    var m = timChu(muc);
    if (!m) { var g = timChu(nhom); if (g) { g.click(); await sleep(900); } m = timChu(muc); }
    if (!m) { daThay = daThay.concat(mucDangHien()); return false; }
    m.click();
    // chờ bảng danh sách mới hiện ra (khác bảng trước đó)
    var co = await cho(function () { return bang() && dauVet() !== truoc; }, 15000);
    if (!co && !(bang() && !truoc)) return false;
    // hiện 50 bản ghi nếu trang có ô chọn số bản ghi
    var sel = oChonSoDong();
    if (sel && sel.value !== "50") {
      var v = dauVet(), w = sel.ownerDocument.defaultView;
      if (w.jQuery) w.jQuery(sel).val("50").trigger("change");
      else { sel.value = "50"; sel.dispatchEvent(new Event("change", { bubbles: true })); }
      await cho(function () { return dauVet() !== v; }, 8000);
    }
    await sleep(800);
    return !!bang();
  }
  function docBang(kieu) {
    var table = bang(), rows = [], boQuaMat = 0;
    if (!table) return null;
    [].slice.call(table.rows).slice(1).forEach(function (tr) {
      var cells = [].slice.call(tr.cells).map(function (td) { return clean(td.innerText); }).filter(Boolean);
      var so = cells.filter(function (x) { return reSo.test(x); })[0];
      if (!so) return;
      var ty = cells.slice().sort(function (a, b) { return b.length - a.length; })[0] || "";
      if (cells.some(function (x) { return MAT.indexOf(x) >= 0; }) || /^\(?\s*(tuyệt mật|tối mật|mật)\s*[)\-:]/i.test(ty)) { boQuaMat++; return; }
      var dates = cells.filter(function (x) { return reDate.test(x) && x.length <= 20; });
      var khan = cells.filter(function (x) { return KHAN.indexOf(x) >= 0; })[0] || "Thường";
      var loai = cells.filter(function (x) { return LOAI.indexOf(x) >= 0; })[0] || "";
      so = so.replace(/[_-]UBNDP_GIADINH/, "");
      if (kieu !== "di") {
        var noi = cells.filter(function (x) { return x !== ty && /^(Sở|Ủy ban|Uỷ ban|Công an|PC0|PA0|Văn phòng|Đảng ủy|Đảng uỷ|Trung tâm|Ban |Bộ |Hội đồng|Thành ủy|Thành uỷ)/.test(x); })[0] || "";
        var den = dates.filter(function (x) { return /\d{2}:\d{2}/.test(x); })[0] || dates[1] || dates[0] || "";
        var han = dates.length > 2 ? iso(dates[dates.length - 1]) : "";
        rows.push({ so: so, den: iso(den), han: han, khan: khan === "Hoả tốc" ? "Hỏa tốc" : khan, noi: noi.replace(/ - TPHCM$/, ""), ty: ty, loaiVb: loai });
      } else {
        rows.push({ so: so, ngay: iso(dates[0]), loai: loai || (/\/TTr/.test(so) ? "Tờ trình" : ""), ty: ty });
      }
    });
    return { rows: rows, boQuaMat: boQuaMat, tong: tongBanGhi() };
  }

  (async function () {
    try {
      note("Đang quét văn bản đến… (đừng bấm gì trên trang này)", true, true);
      var okDen = await moDanhSach(["Văn bản đến"], ["Văn bản đến cần xử lý", "Văn bản đến chờ xử lý", "Văn bản chờ xử lý", "Văn bản cần xử lý", "Chờ xử lý"]);
      var den = okDen ? docBang("den") : null;
      note("Đang quét văn bản xem để biết…", true, true);
      var okXb = await moDanhSach(["Văn bản đến"], ["Văn bản đến xem để biết", "Văn bản xem để biết", "Văn bản để biết", "Xem để biết"]);
      var xemBiet = okXb ? docBang("xemBiet") : null;
      note("Đang quét văn bản đi…", true, true);
      var okDi = await moDanhSach(["Văn bản đi"], ["Văn bản đi đã phát hành", "Văn bản đã phát hành", "Đã phát hành"]);
      var di = okDi ? docBang("di") : null;
      if (!den && !di) {
        var thay = daThay.filter(function (t, i, a) { return a.indexOf(t) === i; });
        note("Không tự mở được danh sách. Chụp màn hình này gửi người hỗ trợ." + (thay.length ? " Các mục thấy được: " + thay.join("; ") : ""), false, true);
        if (tab) tab.close();
        return;
      }
      // Chỉ giữ văn bản của NGÀY HÔM NAY (văn bản cũ không lấy)
      var n = new Date(), homNay = n.getFullYear() + "-" + ("0" + (n.getMonth() + 1)).slice(-2) + "-" + ("0" + n.getDate()).slice(-2);
      var chiHomNay = function (x, truong) { if (!x) return null; x.rows = x.rows.filter(function (r) { return r[truong] === homNay; }); x.tong = null; return x; };
      den = chiHomNay(den, "den"); xemBiet = chiHomNay(xemBiet, "den"); di = chiHomNay(di, "ngay");
      var goi = { nguon: "qlvb", ban: 2, quet: new Date().toISOString(), den: den, xemBiet: xemBiet, di: di };
      var json = JSON.stringify(goi);
      var tom = "hôm nay: " + [den ? den.rows.length + " văn bản đến" : "", xemBiet ? xemBiet.rows.length + " văn bản để biết" : "", di ? di.rows.length + " văn bản đi" : ""].filter(Boolean).join(", ")
        + ((den && den.boQuaMat) ? " (bỏ qua " + den.boQuaMat + " văn bản mật)" : "");
      if (tab && !tab.closed) {
        var b64 = btoa(unescape(encodeURIComponent(json)));
        tab.location.href = WEB + "#qlvb=" + b64;
        try { tab.focus(); } catch (e) { /* bỏ qua */ }
        note("Đã quét " + tom + ". Đã chuyển sang Bàn làm việc.", true);
      } else {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
        a.download = "qlvb_" + new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "") + ".json";
        document.body.appendChild(a); a.click(); a.remove();
        note("Đã quét " + tom + ", đã tải tệp " + a.download + ". Mở Bàn làm việc → Nhập dữ liệu qlvb." + (WEB ? " (Trình duyệt chặn mở tab: cho phép cửa sổ bật lên cho qlvb.)" : ""), true);
      }
    } catch (e) {
      note("Quét bị lỗi: " + (e && e.message ? e.message : e));
    } finally {
      window.__blvDangQuet = false;
    }
  })();
};
