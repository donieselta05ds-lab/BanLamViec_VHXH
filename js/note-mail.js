/* NOTE GHIM TRÊN MÀN HÌNH + GỬI TÓM TẮT VIỆC CẦN LÀM QUA MAIL
 * ----------------------------------------------------------------------------
 * Không cần cài phần mềm, dùng được trên mọi máy có Chrome/Edge.
 *  - "Ghim note": mở cửa sổ nổi luôn nằm trên cùng màn hình (Document Picture-in-Picture
 *    của Chrome/Edge); trình duyệt không hỗ trợ thì mở cửa sổ nhỏ. Tự cập nhật khi quét.
 *  - "Gửi tóm tắt": soạn bảng "Việc cần làm" ghi chung (văn bản cần xử lý, báo cáo sắp tới;
 *    không ghi hạn, không phân loại trễ/sớm), chép vào bộ nhớ tạm và mở Gmail soạn thư
 *    có sẵn người nhận, tiêu đề: bấm Ctrl+V rồi Gửi.
 */
(function () {
  "use strict";
  const A = window.BLV_APP;
  if (!A) return;
  const { esc, dm, dmy, addDays, parse, diff, load, save } = window.BLV;
  const $ = (s) => document.querySelector(s);
  const THU = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const THU_NGAN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const homNay = () => window.BLV.today;

  // ---------- dữ liệu dùng chung ----------
  function duLieu() {
    const D = A.D, xl = A.xuLy();
    const den = A.denHomNay().map((d) => {
      const x = xl[d.so];
      const h = x ? A.HUONG.find((k) => k.id === x.huong) : A.goiY(d).h;
      return Object.assign({}, d, { lam: h ? h.ten : "", sanPham: h && !h.choXem ? h.sanPham : "", daPhanLoai: !!x });
    }).sort((a, b) => (a.khan === "Thường") - (b.khan === "Thường"));
    const bc = A.allBC().map((b) => ({ b, h: window.BLV.kyToi(b, homNay()) }))
      .filter((x) => x.h && x.h <= addDays(homNay(), 7)).sort((a, b) => a.h.localeCompare(b.h));
    const viec = A.tasks().filter((t) => t.date === homNay() && !window.STORE.isDone(t.id));
    return { den, bc, viec, khan: den.filter((d) => d.khan !== "Thường"), moi: den.filter((d) => !d.daPhanLoai) };
  }

  // ---------- NOTE ----------
  const CSS_NOTE = `
    *{box-sizing:border-box} body{margin:0;background:#fffbea;color:#1f2933;font:14px/1.45 "Segoe UI",Arial,sans-serif}
    header{position:sticky;top:0;background:#f3e3a0;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px}
    header b{font-size:14px} header button{border:0;background:transparent;cursor:pointer;font-size:14px;color:#1f2933}
    .tom{padding:8px 12px 0;font-weight:600} .tom span{white-space:nowrap}
    .do{color:#b3261e} .cam{color:#925600} .lam{color:#1f5f99} .xanh{color:#2f6b3a} .phu{color:#6b7280;font-size:12.5px}
    h3{margin:10px 12px 4px;font-size:13.5px}
    ul{list-style:none;margin:0;padding:0 12px} li{padding:5px 0;border-bottom:1px dashed #ecdca0;cursor:pointer}
    li:hover{background:#fff4c4} li b{font-weight:600}
    footer{padding:8px 12px 10px;font-size:12px;color:#6b7280}`;
  let noteWin = null;

  function noteHtml() {
    const d = duLieu(), t = parse(homNay());
    const tom = [`<span>${d.den.length} văn bản đến hôm nay</span>`];
    if (d.khan.length) tom.push(`<span class="do">${d.khan.length} khẩn</span>`);
    if (d.bc.length) tom.push(`<span class="lam">${d.bc.length} báo cáo trong 7 ngày</span>`);
    if (d.moi.length) tom.push(`<span class="cam">${d.moi.length} chưa phân loại</span>`);
    const li = (so, dong1, dong2, cls) => `<li data-so="${esc(so || "")}"><b class="${cls || ""}">${esc(dong1)}</b>${dong2 ? `<div class="phu">${esc(dong2)}</div>` : ""}</li>`;
    let h = `<header><b>Việc cần làm · ${THU_NGAN[t.getDay()]} ${dm(homNay())}</b><button id="nCapNhat" title="Cập nhật">⟳</button></header>
      <div class="tom">${tom.join(" · ")}</div>`;
    if (d.viec.length) h += `<h3 class="cam">Việc hôm nay (${d.viec.length})</h3><ul>${d.viec.slice(0, 8).map((v) => li("", v.title, v.note || "")).join("")}</ul>`;
    if (d.khan.length) h += `<h3 class="do">Văn bản khẩn (${d.khan.length})</h3><ul>${d.khan.slice(0, 8).map((v) => li(v.so, v.so + " · " + v.lam, v.ty, "do")).join("")}</ul>`;
    if (d.bc.length) h += `<h3 class="lam">Báo cáo sắp đến (${d.bc.length})</h3><ul>${d.bc.map((x) => { const con = diff(x.h, homNay()); return li("", x.b.ten, `${THU_NGAN[parse(x.h).getDay()]} ${dm(x.h)} · ${con === 0 ? "hôm nay" : "còn " + con + " ngày"} · gửi ${x.b.noiNhan}`); }).join("")}</ul>`;
    const thuong = d.moi.filter((v) => v.khan === "Thường");
    if (thuong.length) h += `<h3>Văn bản mới cần phân loại (${thuong.length})</h3><ul>${thuong.slice(0, 6).map((v) => li(v.so, v.so + " · " + v.lam, v.ty)).join("")}</ul>`;
    h += `<footer>Quét qlvb lúc ${esc(A.D.quet || "chưa có")} · bấm một văn bản để chép số</footer>`;
    return h;
  }
  function veNote() {
    if (!noteWin || noteWin.closed) return;
    const body = noteWin.document.body;
    body.innerHTML = noteHtml();
    const nut = body.querySelector("#nCapNhat");
    if (nut) nut.onclick = veNote;
  }
  async function ghimNote() {
    if (noteWin && !noteWin.closed) { veNote(); noteWin.focus && noteWin.focus(); return; }
    try {
      if ("documentPictureInPicture" in window) {
        noteWin = await window.documentPictureInPicture.requestWindow({ width: 360, height: 520 });
      } else {
        noteWin = window.open("", "blv-note", "width=380,height=560");
      }
    } catch (e) {
      noteWin = window.open("", "blv-note", "width=380,height=560");
    }
    if (!noteWin) { A.toast("Trình duyệt chặn cửa sổ note: cho phép cửa sổ bật lên rồi bấm lại"); return; }
    const doc = noteWin.document;
    doc.title = "Việc cần làm";
    const st = doc.createElement("style"); st.textContent = CSS_NOTE; doc.head.appendChild(st);
    doc.addEventListener("click", (e) => {
      const li = e.target.closest && e.target.closest("li[data-so]");
      if (!li || !li.dataset.so) return;
      const so = li.dataset.so;
      (noteWin.navigator.clipboard ? noteWin.navigator.clipboard.writeText(so) : Promise.reject()).then(
        () => { const f = doc.querySelector("footer"); if (f) f.textContent = "Đã chép " + so + ": dán vào ô tìm kiếm trên qlvb"; }, () => {});
    });
    veNote();
  }
  window.addEventListener("blv-capnhat", veNote);
  window.addEventListener("blv-tomtat", veNote);
  document.addEventListener("change", () => setTimeout(veNote, 50));   // đánh dấu xong việc
  setInterval(veNote, 60000);

  // ---------- MAIL TÓM TẮT ----------
  // Viết đủ tên cơ quan (văn phong phường)
  const tenDu = (x) => String(x || "").replace(/^PC\d+\s*-\s*/i, "").replace(/\bTPHCM\b|TP\.HCM/g, "Thành phố Hồ Chí Minh").replace(/\bTP\b/g, "Thành phố")
    .replace(/\bUBND\b/g, "Ủy ban nhân dân").replace(/\bKHCN\b/g, "Khoa học và Công nghệ").replace(/\bVPĐU\b/g, "Văn phòng Đảng ủy");
  // Đề xuất cần làm gì: nêu người làm (chủ tài khoản qlvb) + loại văn bản cần soạn
  function deXuat(v, id) {
    const noi = tenDu(v.noi) || "cơ quan ban hành";
    return ({
      "bao-cao": `Tham mưu Báo cáo của Ủy ban nhân dân phường gửi ${noi}`,
      "tra-loi": `Tham mưu Công văn trả lời, cung cấp thông tin gửi ${noi}`,
      "gop-y": `Nghiên cứu dự thảo, tham mưu Công văn góp ý gửi ${noi}`,
      "ke-hoach": `Tham mưu Kế hoạch của Ủy ban nhân dân phường triển khai thực hiện`,
      "trien-khai": `Tham mưu Công văn triển khai đến các phòng, đơn vị, khu phố`,
      "quyet-dinh": `Tham mưu Quyết định của Ủy ban nhân dân phường`,
      "tham-du": `Trình lãnh đạo cử người tham dự; tham mưu Công văn cử nhân sự (nếu có yêu cầu)`,
      "cho-xem-xet": `Trao đổi lãnh đạo phòng để xác định hướng xử lý`,
      "chuyen": `Báo văn thư chuyển đúng bộ phận xử lý`,
      "de-biet": `Nghiên cứu, nắm nội dung; lưu hồ sơ và kết thúc trên hệ thống`,
    })[id] || `Nghiên cứu, đề xuất hướng xử lý`;
  }
  function mailNoiDung() {
    const t = parse(homNay()), xl = A.xuLy();
    // Chỉ lấy văn bản đến trong ngày hôm nay; văn bản cũ không đưa vào mail
    const ds = A.denHomNay().map((d) => {
      const id = xl[d.so] ? xl[d.so].huong : A.goiY(d).h.id;
      return Object.assign({}, d, { id, deXuat: deXuat(d, id), hanGhi: d.han && d.han >= homNay() ? dmy(d.han) : "" });
    }).sort((a, b) => (a.khan === "Thường") - (b.khan === "Thường"));
    const canXuLy = ds.filter((v) => v.id !== "de-biet");
    // Mục "Văn bản xem để biết" lấy từ danh sách cùng tên trên qlvb (cộng văn bản đến hôm nay được phân loại "để biết")
    const daCo = new Set();
    const deBiet = A.xemBietHomNay().map((d) => Object.assign({}, d, { id: "de-biet", deXuat: deXuat(d, "de-biet") }))
      .concat(ds.filter((v) => v.id === "de-biet")).filter((v) => !daCo.has(v.so) && daCo.add(v.so));
    const diGan = A.diHomNay();
    const bc = A.allBC().map((b) => ({ b, h: window.BLV.kyToi(b, homNay()) })).filter((x) => x.h && x.h <= addDays(homNay(), 7)).sort((a, b) => a.h.localeCompare(b.h));

    const phan = [];
    if (canXuLy.length) phan.push(`${canXuLy.length} văn bản cần xử lý`);
    if (deBiet.length) phan.push(`${deBiet.length} văn bản để biết`);
    if (diGan.length) phan.push(`${diGan.length} văn bản đã phát hành`);
    if (bc.length) phan.push(`${bc.length} báo cáo`);
    const tieuDe = `[Việc cần làm] ${THU[t.getDay()]} ${dm(homNay())}: ` + (phan.length ? phan.join(", ") : "chưa có văn bản mới");
    const td = 'style="border:1px solid #ccc;padding:6px;vertical-align:top"';
    const tdn = 'style="border:1px solid #ccc;padding:6px;vertical-align:top;white-space:nowrap"';
    const bang = (dau, dong) => `<table cellspacing="0" style="border-collapse:collapse;font-size:14px;width:100%"><tr style="background:#eef2f6">${dau.map((x) => `<th ${td}>${x}</th>`).join("")}</tr>${dong.join("")}</table>`;
    const tomTatAi = (so) => (window.BLV_AI && window.BLV_AI.layTomTat(so)) || "";
    const tyNoi = (v) => `${esc(String(v.ty).replace(/\s*\((hạn|hạn xử lý)[^)]*\)/gi, ""))}${v.noi ? `<br><span style="color:#666">${esc(tenDu(v.noi))}</span>` : ""}`
      + (tomTatAi(v.so) ? `<div style="margin-top:6px;padding:6px 8px;background:#f3f7fb;border-left:3px solid #1f4e79;white-space:pre-line;font-size:13px"><b>Việc phường cần làm (AI):</b>\n${esc(tomTatAi(v.so))}</div>` : "");
    const soKhan = (v) => `<b>${esc(v.so)}</b>${v.khan && v.khan !== "Thường" ? `<br><span style="color:#b3261e">${esc(v.khan)}</span>` : ""}`;

    let muc = 0;
    let h = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#17212c"><p>Việc cần làm ${THU[t.getDay()]}, ngày ${dmy(homNay())} (văn bản đến và văn bản phát hành trong ngày).</p>`;
    if (!ds.length && !deBiet.length) h += `<p>Hôm nay chưa có văn bản đến mới.</p>`;
    if (canXuLy.length) {
      h += `<h3>${++muc}. Văn bản cần xử lý (${canXuLy.length})</h3>` + bang(["Số", "Trích yếu", "Đề xuất cần làm gì", "Hạn"],
        canXuLy.map((v) => `<tr><td ${td}>${soKhan(v)}</td><td ${td}>${tyNoi(v)}</td><td ${td}>${esc(v.deXuat)}</td><td ${tdn}>${v.hanGhi}</td></tr>`));
    }
    if (deBiet.length) {
      h += `<h3>${++muc}. Văn bản xem để biết (${deBiet.length})</h3>` + bang(["Số", "Trích yếu", "Đề xuất cần làm gì"],
        deBiet.map((v) => `<tr><td ${td}>${soKhan(v)}</td><td ${td}>${tyNoi(v)}</td><td ${td}>${esc(v.deXuat)}</td></tr>`));
    }
    if (diGan.length) {
      h += `<h3>${++muc}. Văn bản đã phát hành hôm nay (${diGan.length})</h3>` + bang(["Số", "Ngày văn bản", "Trích yếu"],
        diGan.map((v) => `<tr><td ${td}><b>${esc(v.so)}</b></td><td ${tdn}>${dmy(v.ngay)}</td><td ${td}>${esc(v.ty)}${tomTatAi(v.so) ? `<br><span style="color:#1f4e79;font-size:13px">${esc(tomTatAi(v.so))}</span>` : ""}</td></tr>`));
    }
    if (bc.length) {
      h += `<h3>${++muc}. Báo cáo định kỳ trong 7 ngày tới (${bc.length})</h3>` + bang(["Báo cáo", "Gửi", "Ngày gửi"],
        bc.map((x) => `<tr><td ${td}><b>${esc(x.b.ten)}</b></td><td ${td}>${esc(x.b.noiNhan)}</td><td ${td}>${dmy(x.h)}</td></tr>`));
    }
    h += `<p style="color:#666;font-size:12px">"Đề xuất cần làm gì" là gợi ý theo trích yếu, xác nhận khi mở văn bản. Văn bản mật không đưa vào mail.</p></div>`;
    return { tieuDe, html: h };
  }
  function moMail() {
    $("#mlNhan").value = load("blv-mail-nhan", "");
    const m = mailNoiDung();
    $("#mlTieuDe").textContent = m.tieuDe;
    $("#mlXem").innerHTML = m.html;
    $("#mlStatus").textContent = "";
    $("#dlgMail").hidden = false;
  }
  function chepHtml(el) {
    const r = document.createRange(); r.selectNodeContents(el);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    let ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    sel.removeAllRanges();
    return ok;
  }
  function guiMail() {
    const nhan = $("#mlNhan").value.split(/[,;\s]+/).filter(Boolean).join(",");
    save("blv-mail-nhan", nhan);
    const ok = chepHtml($("#mlXem"));
    const url = "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(nhan) + "&su=" + encodeURIComponent($("#mlTieuDe").textContent);
    window.open(url, "_blank");
    $("#mlStatus").textContent = ok ? "Đã chép bảng tóm tắt. Trong Gmail, bấm vào ô nội dung, Ctrl+V rồi Gửi." : "Chưa chép được: bôi đen bảng bên dưới, Ctrl+C, rồi dán vào Gmail.";
  }

  // ---------- giao diện ----------
  const hang = $(".scan .row");
  if (hang) {
    hang.insertAdjacentHTML("beforeend", `<button class="btn" type="button" id="btnNote">📌 Ghim note</button><button class="btn" type="button" id="btnMail">✉ Gửi tóm tắt</button>`);
    $("#btnNote").addEventListener("click", ghimNote);
    $("#btnMail").addEventListener("click", moMail);
  }
  document.body.insertAdjacentHTML("beforeend", `
  <div class="overlay" id="dlgMail" hidden>
    <div class="dialog wide" role="dialog" aria-modal="true" aria-labelledby="mlH">
      <h2 id="mlH">Gửi tóm tắt việc cần làm</h2>
      <label class="field">Gửi đến (nhiều địa chỉ ngăn bằng dấu phẩy)<input id="mlNhan" type="text" placeholder="ten@gmail.com, ..."></label>
      <p><b>Tiêu đề:</b> <span id="mlTieuDe"></span></p>
      <div id="mlXem" style="max-height:320px;overflow:auto;border:1px solid var(--line);border-radius:6px;padding:8px;background:#fff;color:#17212c"></div>
      <p class="status" id="mlStatus" role="status"></p>
      <div class="row end"><button class="btn" type="button" data-close>Đóng</button><button class="btn btn-primary" type="button" id="mlGui">Chép bảng và mở Gmail</button></div>
    </div>
  </div>`);
  $("#mlGui").addEventListener("click", guiMail);
  $("#dlgMail").addEventListener("click", (e) => { if (e.target.id === "dlgMail" || e.target.closest("[data-close]")) $("#dlgMail").hidden = true; });

  window.BLV_NOTE = { ghimNote, moMail, mailNoiDung };
})();
