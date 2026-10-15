/* Bàn làm việc Phòng VHXH: giao diện chính */
(function () {
  "use strict";
  const { iso, parse, addDays, dm, dmy, diff, WD, longDate, esc } = window.BLV;
  // Dữ liệu văn bản: ưu tiên bản nhập từ nút "Quét qlvb" (lưu trong trình duyệt), sau đó data/local.js, cuối cùng dữ liệu mẫu
  const Q = window.STORE.get().qlvb;
  const D = Object.assign({ den: [], di: [], doso: [], viec: [] }, window.QLVB || {},
    Q ? { den: Q.den || (window.QLVB || {}).den || [], di: Q.di || (window.QLVB || {}).di || [], xemBiet: Q.xemBiet || [], quet: Q.quet, tongDen: Q.tongDen, nguon: "that" } : {});
  // Ghi chung chung, không dùng chữ "quá hạn", "chưa thấy..." (ảnh chụp web dùng làm minh chứng)
  const mem = (t) => String(t || "")
    .replace(/Đã quá hạn xử lý ghi trên qlvb/gi, "Đang xử lý")
    .replace(/Hạn xử lý ghi trên qlvb [\d\/]+, văn bản vẫn đang chờ xử lý/gi, "Đang xử lý trên qlvb")
    .replace(/[Cc]hưa thấy văn bản chính[^,.;·]*/g, "chờ văn bản chính")
    .replace(/[Cc]hưa thấy (văn bản đi|văn bản trả lời|công văn đi)[^,.;·]*/g, "đang xử lý")
    .replace(/[Cc]hưa thấy [^,.;·]*/g, "đang theo dõi")
    .replace(/^(đang|chờ)/, (m) => m.charAt(0).toUpperCase() + m.slice(1));
  const boHan = (t) => String(t || "").replace(/\s*\((hạn|hạn xử lý)[^)]*\)/gi, "");   // trích yếu không kèm "(hạn xử lý …)"
  // Hạn ghi trong trích yếu "(hạn xử lý 15/07/2026)" -> đưa vào cột hạn nếu qlvb chưa có cột hạn
  const layHan = (r) => {
    const m = /\((?:hạn|hạn xử lý)[^)]*?(\d{1,2})\/(\d{1,2})\/(\d{4})/i.exec(r.ty || "");
    if (m && !r.han) r.han = m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
    return r;
  };
  ["den", "di", "viec", "doso", "xemBiet"].forEach((k) => (D[k] || []).forEach((r) => { ["dc", "tt", "note", "viec"].forEach((f) => { if (r[f]) r[f] = mem(r[f]); }); if (r.ty) { layHan(r); r.ty = boHan(r.ty); } }));
  const HUONG = window.HUONG_XU_LY || [];
  const LOAI = window.LOAI_LICH || [];
  const S = window.STORE;
  const TODAY = window.BLV.today;
  if (!Array.isArray(D.xemBiet)) D.xemBiet = [];
  // Chỉ tính văn bản trong ngày hôm nay (văn bản cũ không đếm, không đưa vào danh sách)
  const denHomNay = () => D.den.filter((d) => d.den === TODAY);
  const diHomNay = () => D.di.filter((d) => d.ngay === TODAY);
  const xemBietHomNay = () => D.xemBiet.filter((d) => d.den === TODAY);
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const rank = (t) => ({ red: 0, violet: 1, blue: 2, amber: 3 }[t.kind] ?? 4);
  const lines = (s) => String(s || "").split("\n").map((x) => x.trim()).filter(Boolean);

  // ---------- TIỆN ÍCH ----------
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, 2600); }
  function open(id) { const d = $(id); d.hidden = false; const f = d.querySelector("input:not([type=hidden]):not([type=file]), select, textarea, button"); if (f) f.focus(); }
  function closeAll() { $$(".overlay").forEach((o) => { o.hidden = true; }); }
  $$(".overlay").forEach((o) => o.addEventListener("click", (e) => { if (e.target === o || e.target.closest("[data-close]")) o.hidden = true; }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
  const boDau = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
  const allBC = () => (window.BAO_CAO || []).concat(S.get().baoCao);

  // ---------- GỢI Ý HƯỚNG XỬ LÝ ----------
  function goiY(doc) {
    const text = (doc.ty + " " + doc.so).toLowerCase();
    let best = null, hit = [];
    HUONG.forEach((h) => {
      const m = h.tuKhoa.filter((k) => text.includes(k));
      // ưu tiên: góp ý > tham dự > báo cáo > trả lời > quyết định > kế hoạch > triển khai > để biết
      const w = m.length * 10 + ({ "gop-y": 6, "tham-du": 5, "bao-cao": 4, "tra-loi": 3, "quyet-dinh": 2, "ke-hoach": 1 }[h.id] || 0);
      if (m.length && (!best || w > best.w)) { best = { h, w }; hit = m; }
    });
    if (/\/TB-/.test(doc.so) && (!best || !["tham-du", "bao-cao", "tra-loi"].includes(best.h.id))) return { h: HUONG.find((x) => x.id === "de-biet"), hit: ["thông báo"] };
    if (/\/QĐ-/.test(doc.so) && (!best || best.h.id === "trien-khai")) return { h: HUONG.find((x) => x.id === "de-biet"), hit: ["quyết định của cấp trên"] };
    if (/\/KH-/.test(doc.so) && (!best || best.h.id === "trien-khai")) return { h: HUONG.find((x) => x.id === "ke-hoach"), hit: ["kế hoạch của cấp trên"] };
    return best ? { h: best.h, hit } : { h: HUONG.find((x) => x.id === "cho-xem-xet") || HUONG[0], hit: [] };
  }
  function hanMacDinh(doc, h) {
    const k = (doc.khan || "").toLowerCase();
    let n = h.han;
    if (k.includes("hỏa") || k.includes("hoả")) n = Math.min(n, 1);
    else if (k.includes("khẩn")) n = Math.min(n, 3);
    const d = addDays(doc.den || TODAY, n);
    return d < TODAY ? TODAY : d;
  }
  function tenThuMuc(doc, h) {
    const so = doc.so.replace(/\//g, "-");
    const words = boDau(doc.ty.replace(/^(V\/v|Về việc|Về)\s+/i, "")).replace(/[^\w\s-]/g, "").split(/\s+/).slice(0, 10).join(" ");
    const loai = /\/KH-/.test(doc.so) ? "KH" : /\/QĐ-/.test(doc.so) ? "QD" : /\/TB-/.test(doc.so) ? "TB" : "CV";
    return (h.thuMuc ? h.thuMuc + "/" : "") + "NN. " + loai + " " + so + " - " + words.charAt(0).toUpperCase() + words.slice(1);
  }

  // ---------- VIỆC TRÊN LỊCH ----------
  function tasks() {
    const u = S.get();
    const recurring = allBC().flatMap((b) => window.BLV.kyBaoCao(b, addDays(TODAY, -45), addDays(TODAY, 150)));
    return (D.viec || []).concat(recurring, u.lich).sort((a, b) => a.date.localeCompare(b.date) || (a.gio || "99").localeCompare(b.gio || "99") || rank(a) - rank(b));
  }
  const isEvent = (t) => t.kind === "violet";
  const isLate = (t) => !t.recurring && !isEvent(t) && !S.isDone(t.id) && t.date < TODAY;

  function taskLi(t, showDate, ctx) {
    const cid = ctx + "-" + t.id;
    const done = S.isDone(t.id), late = isLate(t);
    const when = t.date === TODAY ? "Hôm nay" : late ? "Cần làm" : WD[parse(t.date).getDay()].replace("Thứ ", "T") + " " + dm(t.date);
    const meta = [t.gio, t.diaDiem, t.thanhPhan].filter(Boolean).join(" · ");
    const prep = (t.chuanBi || []).length ? "Chuẩn bị: " + t.chuanBi.join("; ") : "";
    return `<li class="task k-${t.kind}${done ? " done" : ""}">
      <input type="checkbox" id="c-${esc(cid)}" data-id="${esc(t.id)}" ${done ? "checked" : ""}>
      <label class="t-title" for="c-${esc(cid)}">${t.loaiTen ? `<span class="pill ${t.kind}">${esc(t.loaiTen)}</span> ` : ""}${esc(t.title)}</label>
      ${showDate ? `<span class="t-date">${when}</span>` : `<span></span>`}
      ${meta ? `<span class="ev-meta">${esc(meta)}</span>` : ""}
      ${t.note || prep ? `<span class="t-note">${esc([t.note, prep].filter(Boolean).join(" · "))}</span>` : ""}
    </li>`;
  }

  // ---------- CHỜ XEM XÉT ----------
  const choXemList = () => D.den.filter((d) => xuLy()[d.so] && xuLy()[d.so].huong === "cho-xem-xet");
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-chuaro]"); if (!b) return;
    S.setXuLy(b.dataset.chuaro, { huong: "cho-xem-xet", han: addDays(TODAY, 2), nguoi: "", note: "", luc: TODAY });
    toast("Đã chuyển " + b.dataset.chuaro + " sang mục Chờ xem xét"); renderEverything();
  });
  function renderCho() {
    const list = choXemList().sort((a, b) => (b.mau === "red") - (a.mau === "red") || (a.den || "").localeCompare(b.den || ""));
    $("#tblCho").innerHTML = list.map((d) => {
      const x = xuLy()[d.so];
      return `<tr class="k-${d.mau === "red" ? "red" : "amber"}"><td class="mono">${esc(d.so)}</td><td class="nowrap">${d.den ? dm(d.den) : ""}</td>
        <td><span class="pill ${d.khan === "Thường" ? "grey" : "red"}">${esc(d.khan)}</span></td>
        <td>${esc(d.ty)}<br><span class="hint">${esc(d.noi)}</span></td>
        <td>${x.note ? esc(x.note) : '<span class="hint">Chưa ghi</span>'}<br><span class="hint">Chuyển ngày ${dm(x.luc || TODAY)} · hạn xem ${dm(x.han)}</span></td>
        <td><button class="btn btn-xl btn-primary" type="button" data-xuly="${esc(d.so)}">Chọn hướng xử lý</button></td></tr>`;
    }).join("") || `<tr><td colspan="6" class="empty">Không có văn bản nào chờ xem xét.</td></tr>`;
  }

  // ---------- HÔM NAY ----------
  let routine = window.BLV.load("blv-routine-" + TODAY, []);
  const xuLy = () => S.get().xuLy;
  function renderToday() {
    const all = tasks();
    const today = all.filter((t) => t.date === TODAY).sort((a, b) => (S.isDone(a.id) - S.isDone(b.id)) || rank(a) - rank(b));
    $("#todayTitle").textContent = "Việc hôm nay · " + longDate(TODAY);
    $("#todayList").innerHTML = today.length ? today.map((t) => taskLi(t, true, "td")).join("") : `<li class="empty">Không có việc nào hôm nay.</li>`;
    const week = all.filter((t) => t.date > TODAY && t.date <= addDays(TODAY, 7));
    $("#weekList").innerHTML = week.length ? week.map((t) => taskLi(t, true, "wk")).join("") : `<li class="empty">Chưa có việc nào.</li>`;

    const chua = denHomNay().filter((d) => !xuLy()[d.so]);
    const cho = choXemList();
    const gap = denHomNay().filter((d) => d.khan && d.khan !== "Thường").length;
    const bcSap = allBC().map((b) => ({ b, h: window.BLV.kyToi(b, TODAY) })).filter((x) => x.h && x.h <= addDays(TODAY, 7)).sort((a, b) => a.h.localeCompare(b.h));
    const left = today.filter((t) => !S.isDone(t.id)).length;
    const ev7 = all.filter((t) => isEvent(t) && t.date >= TODAY && t.date <= addDays(TODAY, 7)).length;
    $("#summary").innerHTML = [
      ["amber", left, "Việc hôm nay chưa xong"],
      ["red", gap, "Văn bản khẩn hôm nay"],
      ["", chua.length, "Văn bản đến hôm nay chưa phân loại"],
      ["blue", bcSap.length, "Báo cáo đến hạn trong 7 ngày"],
      ["violet", ev7, "Tập huấn, họp trong 7 ngày"],
    ].map(([k, n, l]) => `<div class="sum ${k}"><div class="sum-num">${n}</div><div class="sum-label">${l}</div></div>`).join("");
    $("#cntDen").textContent = chua.length || "";
    $("#cntCho").textContent = cho.length || "";
    $("#choBlockCount").textContent = cho.length ? "(" + cho.length + ")" : "";
    $("#choMini").innerHTML = cho.length ? cho.slice(0, 5).map((d) => `<li class="amber"><div class="row"><b class="mono">${esc(d.so)}</b><button class="btn btn-xl" type="button" data-xuly="${esc(d.so)}">Chọn hướng</button></div><span>${esc(d.ty)}</span>${xuLy()[d.so].note ? `<span class="q">Vướng: ${esc(xuLy()[d.so].note)}</span>` : ""}</li>`).join("") : `<li>Không có văn bản nào chờ xem xét.</li>`;

    const top = chua.slice().sort((a, b) => (b.mau === "red") - (a.mau === "red") || (b.den || "").localeCompare(a.den || "")).slice(0, 5);
    $("#unsortedList").innerHTML = top.length ? top.map((d) => {
      const g = goiY(d).h;
      const han = hanMacDinh(d, g);
      return `<li class="${d.mau === "red" ? "red" : "amber"}"><div class="row"><b class="mono">${esc(d.so)}</b><button class="btn btn-xl" type="button" data-xuly="${esc(d.so)}">Xử lý</button></div><span>${esc(d.ty)}</span>
        <span class="q"><b>Cần làm:</b> ${esc(g.ten)}${g.choXem ? "" : " · " + esc(g.sanPham)} · <b>hạn đề xuất ${dm(han)}</b></span></li>`;
    }).join("") : `<li>Hôm nay chưa có văn bản đến mới cần phân loại.</li>`;

    $("#bcSoon").innerHTML = bcSap.length ? bcSap.map((x) => {
      const con = diff(x.h, TODAY);
      return `<li class="${con <= 1 ? "red" : "blue"}"><div class="row"><b>${esc(x.b.ten)}</b><button class="btn btn-xl" type="button" data-bc-open="${esc(x.b.id)}">Xem</button></div><span>Hạn ${WD[parse(x.h).getDay()]} ${dm(x.h)} · ${con === 0 ? "hôm nay" : "còn " + con + " ngày"} · gửi ${esc(x.b.noiNhan)}</span></li>`;
    }).join("") : `<li>Không có báo cáo nào đến hạn trong 7 ngày.</li>`;
    const folders = (D.doso || []).filter((f) => ["red", "amber", "blue"].includes(f.mau)).slice(0, 5);
    $("#folderList").innerHTML = folders.length ? folders.map((f) => `<li class="${f.mau}"><b>${esc(f.tm)}</b><span>${esc(f.viec)}</span></li>`).join("") : `<li>Chưa có dữ liệu thư mục.</li>`;
  }
  document.addEventListener("change", (e) => {
    const id = e.target.dataset && e.target.dataset.id;
    if (id) { S.toggleDone(id, e.target.checked); renderAll(); return; }
    const st = e.target.dataset && e.target.dataset.step;
    if (st !== undefined) { const n = Number(st); routine = e.target.checked ? [...new Set([...routine, n])] : routine.filter((x) => x !== n); window.BLV.save("blv-routine-" + TODAY, routine); }
  });

  // ---------- LỊCH ----------
  const t0 = parse(TODAY);
  let view = { y: t0.getFullYear(), m: t0.getMonth() };
  let selected = TODAY;
  const dayEvents = (s, all) => ({ ts: all.filter((t) => t.date === s), out: D.di.filter((d) => d.ngay === s), inn: D.den.filter((d) => d.den === s) });
  function renderCal() {
    const all = tasks();
    const first = new Date(view.y, view.m, 1);
    $("#monthTitle").textContent = "Tháng " + (view.m + 1) + "/" + view.y;
    const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
    let html = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => `<div class="dow">${d}</div>`).join("");
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      if (i >= 35 && d.getMonth() !== view.m) break;
      const s = iso(d);
      const { ts, out, inn } = dayEvents(s, all);
      const chips = ts.map((t) => `<span class="ev ${t.kind}${S.isDone(t.id) ? " done" : ""}" title="${esc(t.title)}">${t.gio ? esc(t.gio) + " " : ""}${esc(t.title)}</span>`);
      if (out.length) chips.push(`<span class="ev green">${out.length} văn bản đi</span>`);
      if (inn.length) chips.push(`<span class="ev grey">${inn.length} văn bản đến</span>`);
      const shown = chips.slice(0, 4).join("") + (chips.length > 4 ? `<span class="more">+${chips.length - 4} mục</span>` : "");
      const cls = ["day", d.getMonth() !== view.m ? "out" : "", d.getDay() % 6 === 0 ? "weekend" : "", s === TODAY ? "today" : "", s === selected ? "sel" : ""].join(" ");
      html += `<button type="button" class="${cls}" data-day="${s}" aria-label="${longDate(s)}, ${ts.length} việc"><span class="d-num">${d.getDate()}</span>${shown}</button>`;
    }
    $("#calGrid").innerHTML = html;
    const { ts, out, inn } = dayEvents(selected, all);
    $("#dayTitle").textContent = longDate(selected) + (selected === TODAY ? " · Hôm nay" : "");
    let h = `<p class="dsec">Việc, lịch</p>` + (ts.length ? `<ul class="tasks compact">${ts.map((t) => taskLi(t, false, "dy")).join("")}</ul>` : `<p class="empty">Không có.</p>`);
    if (out.length) h += `<p class="dsec">Văn bản đi đã phát hành</p><ul class="dlist">${out.map((d) => `<li><span class="mono">${esc(d.so)}</span><span>${esc(d.ty)}</span></li>`).join("")}</ul>`;
    if (inn.length) h += `<p class="dsec">Văn bản đến</p><ul class="dlist">${inn.map((d) => `<li><span><span class="mono">${esc(d.so)}</span> <span class="pill ${d.khan === "Thường" ? "grey" : "red"}">${esc(d.khan)}</span> <button class="btn btn-xl" type="button" data-xuly="${esc(d.so)}">Xử lý</button></span><span>${esc(d.ty)}</span></li>`).join("")}</ul>`;
    $("#dayDetail").innerHTML = h;
  }
  $("#calGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-day]"); if (!b) return;
    selected = b.dataset.day; const d = parse(selected);
    if (d.getMonth() !== view.m) view = { y: d.getFullYear(), m: d.getMonth() };
    renderCal();
  });
  $("#prevMonth").addEventListener("click", () => { view.m--; if (view.m < 0) { view.m = 11; view.y--; } renderCal(); });
  $("#nextMonth").addEventListener("click", () => { view.m++; if (view.m > 11) { view.m = 0; view.y++; } renderCal(); });
  $("#goToday").addEventListener("click", () => { selected = TODAY; view = { y: t0.getFullYear(), m: t0.getMonth() }; renderCal(); });

  // ---------- VĂN BẢN ĐẾN ----------
  let fDen = "homnay";
  function renderDen() {
    const q = ($("#qDen").value || "").toLowerCase();
    const rows = D.den.filter((d) => {
      const x = xuLy()[d.so];
      const cx = x && x.huong === "cho-xem-xet";
      const ok = fDen === "all" || (fDen === "homnay" && d.den === TODAY) || (fDen === "chua" && !x) || (fDen === "cho" && cx) || (fDen === "xong" && x && !cx) || (fDen === "red" && d.mau === "red");
      return ok && (!q || (d.so + " " + d.ty).toLowerCase().includes(q));
    });
    $("#tblDen").innerHTML = rows.map((d) => {
      const x = xuLy()[d.so];
      const h = x ? HUONG.find((k) => k.id === x.huong) : goiY(d).h;
      const cx = x && x.huong === "cho-xem-xet";
      const can = cx
        ? `<div class="huong"><span class="pill amber">Chờ xem xét</span>${x.note ? `<span class="hint">Vướng: ${esc(x.note)}</span>` : ""}</div>`
        : x
        ? `<div class="huong"><span class="pill blue">${esc(h ? h.ngan : x.huong)}</span><span class="hint">Hạn ${dm(x.han)}</span></div>`
        : `<div class="huong"><span class="hint">Gợi ý: ${esc(h.ngan)}</span></div>`;
      return `<tr class="k-${cx ? "amber" : x ? "blue" : d.mau}"><td class="mono">${esc(d.so)}</td><td class="nowrap">${d.den ? dm(d.den) : ""}</td>
        <td><span class="pill ${d.khan === "Thường" ? "grey" : "red"}">${esc(d.khan)}</span></td>
        <td>${esc(d.ty)}<br><span class="hint">${esc(d.noi)}${d.dc ? " · " + esc(d.dc) : ""}</span></td>
        <td>${can}</td><td><div class="acts"><button class="btn btn-xl" type="button" data-xuly="${esc(d.so)}">${cx ? "Chọn hướng" : x ? "Sửa" : "Xử lý"}</button>${x ? "" : `<button class="btn btn-xl btn-ghost" type="button" data-chuaro="${esc(d.so)}" title="Chuyển sang mục Chờ xem xét">Chưa rõ</button>`}</div></td></tr>`;
    }).join("") || `<tr><td colspan="6" class="empty">Không có văn bản phù hợp.</td></tr>`;
  }
  $$("[data-fden]").forEach((c) => c.addEventListener("click", () => setDenFilter(c.dataset.fden)));
  function setDenFilter(f) { fDen = f; $$("[data-fden]").forEach((x) => x.classList.toggle("is-on", x.dataset.fden === f)); renderDen(); }
  $("#qDen").addEventListener("input", renderDen);
  $("#goUnsorted").addEventListener("click", () => { showTab("den"); setDenFilter("chua"); });
  $("#goBaoCao").addEventListener("click", () => showTab("baocao"));
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-bc-open]"); if (b) viewBC(b.dataset.bcOpen); });
  $("#goCho").addEventListener("click", () => showTab("cho"));

  // ---------- HỘP THOẠI XỬ LÝ ----------
  let curDoc = null;
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-xuly]"); if (b) openXuLy(b.dataset.xuly); });
  function openXuLy(so) {
    const doc = D.den.find((d) => d.so === so); if (!doc) return;
    curDoc = doc;
    const x = xuLy()[so];
    const g = goiY(doc);
    $("#xlDoc").innerHTML = `<span><span class="mono">${esc(doc.so)}</span> · ${esc(doc.noi)} · đến ${doc.den ? dmy(doc.den) : "?"} · <span class="pill ${doc.khan === "Thường" ? "grey" : "red"}">${esc(doc.khan)}</span></span><span>${esc(doc.ty)}</span>`;
    $("#xlSuggest").innerHTML = g.h.choXem
      ? `Web chưa đoán được cần làm gì từ trích yếu. Chọn một hướng, hoặc để <b>Chờ xem xét</b> cho công chức xem.`
      : `Web gợi ý: <b>${esc(g.h.ten)}</b>${g.hit.length ? ", vì trích yếu có “" + esc(g.hit.slice(0, 3).join("”, “")) + "”" : ""}. Bạn chọn lại nếu chưa đúng.`;
    const pick = x ? x.huong : g.h.id;
    $("#xlHuong").innerHTML = HUONG.map((h) => `<label><input type="radio" name="huong" value="${h.id}" ${h.id === pick ? "checked" : ""}><span>${esc(h.ten)}${h.id === g.h.id ? '<span class="sg">gợi ý</span>' : ""}</span></label>`).join("");
    $("#xlHan").value = x ? x.han : hanMacDinh(doc, HUONG.find((h) => h.id === pick));
    $("#xlNguoi").value = x ? x.nguoi || "" : "";
    $("#xlNote").value = x ? x.note || "" : "";
    $("#xlDinhKy").checked = false;
    $("#xlEvDate").value = x && x.ev ? x.ev.date : ""; $("#xlEvTime").value = x && x.ev ? x.ev.gio : ""; $("#xlEvPlace").value = x && x.ev ? x.ev.noi : "";
    $("#xlClear").hidden = !x;
    renderXuLyOut(!x);
    open("#dlgXuLy");
  }
  function renderXuLyOut(resetHan) {
    const h = HUONG.find((k) => k.id === ($("input[name=huong]:checked") || {}).value); if (!h) return;
    if (resetHan) $("#xlHan").value = hanMacDinh(curDoc, h);
    const path = h.thuMuc ? tenThuMuc(curDoc, h) : "";
    const T = window.BLV_THUMUC;
    $("#xlOut").innerHTML = `<div><b>Cần soạn:</b> ${esc(h.sanPham)}</div>
      ${h.hoSo.length ? `<div><b>Bộ hồ sơ trình ký:</b><ul>${h.hoSo.map((x) => `<li>${esc(x)}</li>`).join("")}<li>Thư mục con "File dinh kem": văn bản của nơi gửi</li></ul></div>` : ""}
      ${path ? `<div class="path"><b>Thư mục gợi ý:</b> <code id="xlPath">${esc(path)}</code><button class="btn btn-xl" type="button" id="xlCopy">Sao chép</button></div>` : ""}
      ${T && T.coTheTao(h) ? `<div class="mk"><div class="row"><button class="btn btn-sm btn-primary" type="button" id="xlMkdir">Tạo thư mục và tệp mẫu</button><button class="btn btn-sm btn-ghost" type="button" id="xlMkdirGoc">Chọn lại thư mục gốc</button></div>
        <p class="hint">Tạo thư mục trên máy${T.tepSeTao(h).length ? ", kèm " + esc(T.tepSeTao(h).join(", ")) + " điền sẵn trích yếu, căn cứ" : ""} và thư mục "File dinh kem". Lần đầu chọn thư mục gốc, ví dụ congviec\\2026 P.Gia Định\\2026 P.Gia Định.</p>
        <p class="status" id="xlMkRes"></p></div>` : ""}`;
    $("#xlEvent").hidden = !h.suKien;
    $("#xlHanLbl").textContent = h.choXem ? "Hạn xem xét" : "Hạn hoàn thành";
    $("#xlNoteLbl").textContent = h.choXem ? "Vướng ở đâu, cần hỏi gì" : "Ghi chú";
    $("#xlNote").placeholder = h.choXem ? "Ví dụ: không rõ phường có phải báo cáo không" : "Nội dung chính cần lưu ý";
    $("#xlDinhKy").closest("label").hidden = !!h.choXem;
  }
  $("#xlHuong").addEventListener("change", () => renderXuLyOut(true));
  $("#xlOut").addEventListener("click", (e) => {
    if (e.target.id === "xlMkdir" || e.target.id === "xlMkdirGoc") {
      const h = HUONG.find((k) => k.id === ($("input[name=huong]:checked") || {}).value);
      window.BLV_THUMUC.chay(curDoc, h, e.target.id === "xlMkdirGoc", $("#xlMkRes"));
      return;
    }
    if (e.target.id !== "xlCopy") return;
    const t = $("#xlPath").textContent;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast("Đã sao chép tên thư mục"), () => {
      const r = document.createRange(); r.selectNodeContents($("#xlPath")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Đã chọn sẵn, bấm Ctrl+C");
    });
  });
  $("#xlClear").addEventListener("click", () => { S.clearXuLy(curDoc.so); $("#dlgXuLy").hidden = true; toast("Đã bỏ phân loại"); renderEverything(); });
  $("#formXuLy").addEventListener("submit", (e) => {
    e.preventDefault();
    const h = HUONG.find((k) => k.id === $("input[name=huong]:checked").value);
    const so = curDoc.so;
    S.clearXuLy(so);
    const x = { huong: h.id, han: $("#xlHan").value, nguoi: $("#xlNguoi").value.trim(), note: $("#xlNote").value.trim(), luc: TODAY };
    const shortTy = curDoc.ty.length > 70 ? curDoc.ty.slice(0, 70) + "…" : curDoc.ty;
    if (!h.choXem) {
      S.addLich({ id: "x-" + so, tuVanBan: so, date: x.han, kind: curDoc.mau === "red" ? "red" : "amber", loai: "viec", loaiTen: h.ngan,
        title: so + ": " + shortTy, note: h.sanPham + (x.nguoi ? " · Phối hợp: " + x.nguoi : "") + (x.note ? " · " + x.note : "") });
    }
    if (h.suKien && $("#xlEvDate").value) {
      x.ev = { date: $("#xlEvDate").value, gio: $("#xlEvTime").value, noi: $("#xlEvPlace").value.trim() };
      S.addLich({ id: "e-" + so, tuVanBan: so, date: x.ev.date, gio: x.ev.gio, diaDiem: x.ev.noi, kind: "violet", loai: "tap-huan", loaiTen: "Tham dự", title: shortTy, note: "Theo " + so });
    }
    S.setXuLy(so, x);
    $("#dlgXuLy").hidden = true;
    toast(h.choXem ? "Đã chuyển sang mục Chờ xem xét" : "Đã lưu: " + h.ngan + ", hạn " + dm(x.han));
    if (!h.choXem && $("#xlDinhKy").checked) openBCForm({ ten: "Báo cáo " + curDoc.ty.replace(/^(V\/v|Về việc|Về)\s+/i, "").replace(/^báo cáo\s+/i, ""), canCu: so, noiNhan: curDoc.noi });
    renderEverything();
  });

  // ---------- BÁO CÁO ----------
  let curBC = null;
  function renderBaoCao() {
    const bcs = allBC();
    const mang = [...new Set(bcs.map((b) => b.mang))];
    $("#bcCount").textContent = "· " + bcs.length + " báo cáo, " + mang.length + " mảng";
    $("#tblBC").innerHTML = bcs.map((b) => {
      const next = window.BLV.kyToi(b, TODAY);
      const user = S.get().baoCao.some((x) => x.id === b.id);
      const st = next ? (b.xacNhan ? ["green", "Đã xác nhận"] : ["blue", "Lịch gợi ý"]) : (b.chuKy && b.chuKy.loai === "dot-xuat" ? ["grey", "Một lần"] : ["amber", "Cần xác nhận hạn"]);
      return `<tr class="k-${st[0]} click" data-bc="${esc(b.id)}" tabindex="0"><td><b>${esc(b.ten)}</b><br><span class="hint">${esc(b.mang)}${user ? " · tự thêm" : ""}</span></td>
        <td>${esc(window.BLV.chuKyText(b))}</td><td>${esc(b.noiNhan)}</td><td class="mono">${esc(b.canCu || "—")}</td>
        <td class="nowrap">${next ? dmy(next) : "—"}</td><td><span class="pill ${st[0]}">${st[1]}</span></td></tr>`;
    }).join("");
  }
  $("#tblBC").addEventListener("click", (e) => { const r = e.target.closest("[data-bc]"); if (r) viewBC(r.dataset.bc); });
  $("#tblBC").addEventListener("keydown", (e) => { const r = e.target.closest("[data-bc]"); if (r && e.key === "Enter") viewBC(r.dataset.bc); });
  function viewBC(id) {
    const b = allBC().find((x) => x.id === id); if (!b) return;
    curBC = b;
    const k = window.BLV.kyGanNhat(b, TODAY);
    const docs = D.di.filter((d) => d.ngay >= k.from && d.ngay <= k.to && d.mau !== "grey");
    $("#bvTitle").textContent = b.ten;
    $("#bvBody").innerHTML = `<dl class="bv-grid">
        <dt>Mảng</dt><dd>${esc(b.mang)}</dd>
        <dt>Gửi cho</dt><dd>${esc(b.noiNhan)}</dd>
        <dt>Căn cứ</dt><dd class="mono">${esc(b.canCu || "—")}</dd>
        <dt>Chu kỳ</dt><dd>${esc(window.BLV.chuKyText(b))}${b.xacNhan ? "" : " (gợi ý, cần xác nhận)"}</dd>
        <dt>Kỳ tới</dt><dd>${k.han ? "Hạn " + dmy(k.han) + " · số liệu " + dmy(k.from) + " – " + dmy(k.to) : "Chưa có hạn"}</dd>
        ${b.nguonSoLieu ? `<dt>Lấy số liệu</dt><dd>${esc(b.nguonSoLieu)}</dd>` : ""}
        ${b.mau ? `<dt>Mẫu</dt><dd class="mono">${esc(b.mau)}</dd>` : ""}
      </dl>
      <p class="label bv-sec">Báo cáo cần có</p>
      ${(b.deCuong || []).length ? `<ol class="bv-list">${b.deCuong.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>` : `<p class="hint">Chưa có đề cương. Thêm vào mục deCuong trong config/bao-cao.js hoặc tạo lại bằng "+ Thêm báo cáo".</p>`}
      <p class="label bv-sec">Văn bản đi trong kỳ số liệu (${docs.length})</p>
      ${docs.length ? `<ul class="bv-list">${docs.map((d) => `<li><span class="mono">${esc(d.so)}</span> ngày ${dm(d.ngay)}: ${esc(d.ty)}</li>`).join("")}</ul>` : `<p class="hint">Chưa có văn bản đi nào trong kỳ này.</p>`}`;
    $("#bvDelete").hidden = !S.get().baoCao.some((x) => x.id === id);
    $("#bvTask").hidden = !k.han;
    open("#dlgBCView");
  }
  $("#bvTask").addEventListener("click", () => {
    const k = window.BLV.kyGanNhat(curBC, TODAY);
    const d = addDays(k.han, -1) < TODAY ? TODAY : addDays(k.han, -1);
    S.addLich({ id: "bc-" + curBC.id + "-" + k.han, date: d, kind: "amber", loai: "viec", loaiTen: "Soạn báo cáo", title: curBC.ten + " (kỳ " + dm(k.from) + "–" + dm(k.to) + ")",
      note: "Hạn " + dm(k.han) + " · gửi " + curBC.noiNhan, chuanBi: curBC.deCuong || [] });
    $("#dlgBCView").hidden = true; toast("Đã thêm việc soạn báo cáo ngày " + dm(d)); renderEverything();
  });
  $("#bvDelete").addEventListener("click", () => { S.removeBaoCao(curBC.id); $("#dlgBCView").hidden = true; toast("Đã xóa báo cáo"); renderEverything(); });

  // Form thêm báo cáo
  $("#bcMang").innerHTML = (window.MANG || []).map((m) => `<option>${esc(m)}</option>`).join("");
  function renderHanField() {
    const l = $("#bcLoai").value;
    const thu = (id, lbl, v) => `<label class="field" for="${id}"><span>${lbl}</span><select id="${id}">${WD.map((w, i) => `<option value="${i}" ${i === v ? "selected" : ""}>${w}</option>`).join("")}</select></label>`;
    const ngay = (lbl) => `<label class="field" for="bcNgay"><span>${lbl}</span><input id="bcNgay" type="number" min="1" max="31" placeholder="Để trống nếu chưa biết"></label>`;
    $("#bcHanWrap").innerHTML =
      l === "tuan" ? `<div class="field-inline">${thu("bcThuChot", "Chốt số liệu", 2)}${thu("bcThuHan", "Hạn gửi", 3)}</div>` :
      l === "thang" ? ngay("Hạn: ngày mấy hằng tháng") :
      l === "quy" ? ngay("Hạn: ngày mấy tháng đầu quý sau") :
      l === "6thang" ? ngay("Hạn: ngày mấy tháng 6") :
      l === "9thang" ? ngay("Hạn: ngày mấy tháng 9") :
      l === "nam" ? `<div class="field-inline">${ngay("Ngày")}<label class="field" for="bcThang"><span>Tháng</span><input id="bcThang" type="number" min="1" max="12" value="12"></label></div>` :
      `<label class="field" for="bcNgayDX"><span>Hạn nộp</span><input id="bcNgayDX" type="date" required></label>`;
  }
  $("#bcLoai").addEventListener("change", renderHanField);
  function openBCForm(pre) {
    $("#formBC").reset(); $("#bcLoai").value = "thang"; renderHanField();
    if (pre) { $("#bcTen").value = pre.ten || ""; $("#bcCanCu").value = pre.canCu || ""; $("#bcNoiNhan").value = pre.noiNhan || ""; }
    open("#dlgBC");
  }
  $("#btnAddBC").addEventListener("click", () => openBCForm());
  $("#formBC").addEventListener("submit", (e) => {
    e.preventDefault();
    const l = $("#bcLoai").value;
    const num = (id) => { const el = $("#" + id); const n = el ? parseInt(el.value, 10) : NaN; return Number.isFinite(n) ? n : null; };
    const chuKy =
      l === "tuan" ? { loai: "tuan", chot: Number($("#bcThuChot").value), han: Number($("#bcThuHan").value) } :
      l === "thang" ? { loai: "thang", han: num("bcNgay") } :
      l === "quy" ? { loai: "quy", han: num("bcNgay") } :
      l === "6thang" ? { loai: "nam", thang: 6, han: num("bcNgay") } :
      l === "9thang" ? { loai: "nam", thang: 9, han: num("bcNgay") } :
      l === "nam" ? { loai: "nam", thang: num("bcThang") || 12, han: num("bcNgay") } : { loai: "dot-xuat" };
    const bc = { id: "u-" + Date.now(), ten: $("#bcTen").value.trim(), mang: $("#bcMang").value, noiNhan: $("#bcNoiNhan").value.trim() || "Cần xác nhận",
      canCu: $("#bcCanCu").value.trim(), chuKy, xacNhan: $("#bcXacNhan").checked, deCuong: lines($("#bcDeCuong").value),
      nguonSoLieu: $("#bcNguon").value.trim(), mau: $("#bcMau").value.trim(), ghiChu: "" };
    S.addBaoCao(bc);
    if (l === "dot-xuat") S.addLich({ id: "dx-" + bc.id, date: $("#bcNgayDX").value, kind: "red", loai: "viec", loaiTen: "Báo cáo", title: "Hạn: " + bc.ten, note: (bc.canCu ? "Theo " + bc.canCu + " · " : "") + "gửi " + bc.noiNhan, chuanBi: bc.deCuong });
    $("#dlgBC").hidden = true; toast("Đã thêm báo cáo"); renderEverything();
  });

  // ---------- THÊM LỊCH ----------
  $("#lcLoai").innerHTML = LOAI.map((l) => `<option value="${l.id}">${esc(l.ten)}</option>`).join("");
  function syncLichForm() { const ev = $("#lcLoai").value !== "viec"; $$(".ev-only").forEach((x) => { x.hidden = !ev; }); $$(".viec-only").forEach((x) => { x.hidden = ev; }); }
  $("#lcLoai").addEventListener("change", syncLichForm);
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-open-lich]"); if (!b) return;
    $("#formLich").reset(); $("#lcNgay").value = b.dataset.openLich === "selected" ? selected : TODAY; syncLichForm(); open("#dlgLich");
  });
  $("#formLich").addEventListener("submit", (e) => {
    e.preventDefault();
    const l = LOAI.find((x) => x.id === $("#lcLoai").value);
    const ev = l.id !== "viec";
    const cc = $("#lcCanCu").value.trim();
    S.addLich({ id: "u-" + Date.now(), date: $("#lcNgay").value, gio: $("#lcGio").value, kind: ev ? "violet" : ($("#lcGap").checked ? "red" : "amber"),
      loai: l.id, loaiTen: ev ? l.ten : "", title: $("#lcTen").value.trim(), diaDiem: ev ? $("#lcNoi").value.trim() : "", thanhPhan: ev ? $("#lcAi").value.trim() : "",
      chuanBi: lines($("#lcChuanBi").value), note: cc ? "Theo " + cc : "" });
    $("#dlgLich").hidden = true;
    selected = $("#lcNgay").value; const d = parse(selected); view = { y: d.getFullYear(), m: d.getMonth() };
    toast("Đã thêm vào lịch ngày " + dm(selected)); renderEverything();
  });

  // ---------- SAO LƯU ----------
  $("#btnBackup").addEventListener("click", () => { $("#bkStatus").textContent = ""; open("#dlgBackup"); });
  $("#bkDown").addEventListener("click", () => {
    try {
      const blob = new Blob([S.exportJSON()], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "banlamviec-saoluu-" + TODAY + ".json";
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      $("#bkStatus").textContent = "Đã tạo tệp sao lưu.";
    } catch (err) { $("#bkStatus").textContent = "Trình duyệt chặn tải tệp ở chế độ xem này."; }
  });
  $("#bkFile").addEventListener("change", (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { S.importJSON(r.result); $("#bkStatus").textContent = "Đã khôi phục dữ liệu."; renderEverything(); } catch (err) { $("#bkStatus").textContent = "Không đọc được tệp: " + err.message; } };
    r.readAsText(f); e.target.value = "";
  });

  // ---------- VĂN BẢN ĐI ----------
  let fDi = "homnay";
  function renderDi() {
    const q = ($("#qDi").value || "").toLowerCase();
    const rows = D.di.filter((d) => (fDi === "all" || (fDi === "homnay" && d.ngay === TODAY) || d.mau === fDi) && (!q || (d.so + " " + d.ty).toLowerCase().includes(q)));
    $("#tblDi").innerHTML = rows.map((d) => `<tr class="k-${d.mau}"><td class="mono">${esc(d.so)}</td><td class="nowrap">${dm(d.ngay)}</td><td>${esc(d.loai)}</td>
      <td>${esc(d.ty)}</td><td class="st"><span class="pill ${d.mau}">${esc(d.tt)}</span></td></tr>`).join("") || `<tr><td colspan="5" class="empty">Không có văn bản phù hợp.</td></tr>`;
  }
  $$("[data-fdi]").forEach((c) => c.addEventListener("click", () => { fDi = c.dataset.fdi; $$("[data-fdi]").forEach((x) => x.classList.toggle("is-on", x === c)); renderDi(); }));
  $("#qDi").addEventListener("input", renderDi);

  // ---------- CHUNG ----------
  function showTab(name) {
    $$(".tab").forEach((x) => { const on = x.dataset.tab === name; x.classList.toggle("is-active", on); x.setAttribute("aria-selected", on); });
    $$(".panel").forEach((p) => { p.hidden = p.id !== "panel-" + name; });
  }
  $$(".tab").forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));
  function veScanInfo() {
    $("#scanInfo").innerHTML = `${D.nguon === "that" ? "Dữ liệu thật" : "Dữ liệu mẫu"} · quét qlvb lần cuối: <b>${D.quet ? esc(D.quet) : "chưa có"}</b> · kho văn bản đi: <b>${D.di.length}</b>`;
    $("#dataNote").hidden = D.nguon === "that";
  }
  veScanInfo();
  $("#btnScan").addEventListener("click", () => { $("#qlvbStatus").textContent = ""; open("#scanDialog"); });

  // ---------- NHẬP DỮ LIỆU TỪ NÚT QUÉT QLVB ----------
  const chuan = (t) => String(t || "").toLowerCase().replace(/^tờ trình\s*/, "").replace(/^(công văn|kế hoạch|báo cáo|quyết định|giấy mời|thông báo)\s*/, "").replace(/^(về việc|v\/v|về)\s*/, "").trim();
  function ghepDi(rows) {
    const chinh = rows.filter((r) => !(/\/TTr/.test(r.so) || r.loai === "Tờ trình"));
    return rows.map((r) => {
      const ttr = /\/TTr/.test(r.so) || r.loai === "Tờ trình";
      if (!ttr) return { so: r.so, ngay: r.ngay, loai: r.loai || "", ty: r.ty, tt: "Hoàn thành", mau: "green", tm: r.tm || "", nd: r.nd || "" };
      const k = chuan(r.ty).slice(0, 40);
      const m = k && chinh.find((x) => { const y = chuan(x.ty); return y.startsWith(k) || k.startsWith(y.slice(0, 40)); });
      return { so: r.so, ngay: r.ngay, loai: "Tờ trình", ty: r.ty, tt: m ? "Đã có văn bản chính " + m.so : "Đã trình, chờ văn bản chính", mau: m ? "grey" : "amber", tm: "", nd: r.nd || "" };
    });
  }
  function doiChieuDen(rows, di) {
    const diText = di.map((d) => d.ty).join(" ");
    return rows.map((r) => {
      r = layHan(Object.assign({}, r)); r.ty = boHan(r.ty);
      const goc = r.so.split("/")[0];
      const nhac = goc.length >= 3 && diText.includes(goc + "/");
      const khan = r.khan && r.khan !== "Thường";
      return { so: r.so, den: r.den, han: r.han || "", khan: r.khan || "Thường", noi: r.noi || "", ty: r.ty, nd: r.nd || "", vaiTro: r.vaiTro || "",
        dc: nhac ? "Có văn bản đi nhắc số " + goc : /\/QĐ-/.test(r.so) ? "Quyết định để biết, triển khai" : "Đang xử lý",
        mau: nhac ? "green" : khan ? "red" : /\/QĐ-/.test(r.so) ? "grey" : "amber" };
    });
  }
  // Gói dữ liệu từ nút quét: bản 1 (mỗi tệp một loại) hoặc bản 2 (một gói có cả đến và đi)
  function traiGoi(goi) {
    if (!goi || goi.nguon !== "qlvb") throw new Error("không phải dữ liệu quét qlvb");
    if (goi.ban >= 2) {
      return ["den", "di", "xemBiet"].filter((k) => goi[k]).map((k) => ({ nguon: "qlvb", kieu: k, quet: goi.quet, rows: goi[k].rows,
        tongTrenQlvb: goi[k].tong ? goi[k].tong - (goi[k].boQuaMat || 0) : null }));
    }
    if (!Array.isArray(goi.rows)) throw new Error("tệp không đúng định dạng");
    return [goi];
  }
  function nhapGoi(packs) {
    // uniq: trùng số thì lấy bản mới nhất (bản đứng sau)
    const uniq = (arr) => { const m = new Map(); arr.forEach((r) => m.set(r.so, r)); return [...m.values()]; };
    const denPacks = packs.filter((x) => x.kieu === "den");
    const denRows = uniq(denPacks.flatMap((x) => x.rows));
    const diRows = uniq(packs.filter((x) => x.kieu === "di").flatMap((x) => x.rows));
    const xbPacks = packs.filter((x) => x.kieu === "xemBiet");
    const xbRows = uniq(xbPacks.flatMap((x) => x.rows)).map((r) => layHan({ so: r.so, den: r.den, han: r.han || "", khan: r.khan || "Thường", noi: r.noi || "", ty: r.ty, nd: r.nd || "" })).map((r) => Object.assign(r, { ty: boHan(r.ty) }));
    const xemBiet = xbPacks.length ? xbRows : D.xemBiet;

    // Văn bản đi: CỘNG DỒN qua các lần quét, giữ làm kho để lập báo cáo theo kỳ
    const goc = (r) => ({ so: r.so, ngay: r.ngay, loai: r.loai, ty: r.ty, tm: r.tm || "", nd: (r.ngay || "") >= addDays(TODAY, -7) ? String(r.nd || "").slice(0, 4000) : "" });
    const diCu = D.di.map(goc);
    const diGop = uniq(diCu.concat(diRows.map(goc)));
    const diMoi = diGop.length - diCu.length;
    const di = diRows.length ? ghepDi(diGop).sort((a, b) => (b.ngay || "").localeCompare(a.ngay || "")) : D.di;

    // Văn bản đến chờ xử lý: quét ĐỦ (số dòng ≥ tổng trên qlvb) thì thay mới;
    // quét thiếu trang thì cộng thêm vào danh sách cũ
    const tong = Math.max(0, ...denPacks.map((x) => x.tongTrenQlvb || 0));
    const du = denRows.length >= tong;
    const denGoc = (r) => ({ so: r.so, den: r.den, han: r.han, khan: r.khan, noi: r.noi, ty: r.ty, nd: r.nd || "", vaiTro: r.vaiTro || "" });
    const denBase = !denRows.length ? D.den.map(denGoc) : du ? denRows : uniq(D.den.map(denGoc).concat(denRows));
    const den = doiChieuDen(denBase, di);

    const last = packs.map((x) => x.quet).sort().pop();
    const t = new Date(last);
    S.setQlvb({ den, di, xemBiet, tongDen: den.length, quet: window.BLV.pad(t.getHours()) + ":" + window.BLV.pad(t.getMinutes()) + ", " + dmy(iso(t)) });
    const msg = [], hn = iso(new Date());
    if (denRows.length) msg.push(den.filter((r) => r.den === hn).length + " văn bản đến hôm nay" + (du ? "" : " (quét chưa đủ " + tong + ", đã cộng với danh sách cũ)"));
    if (xbPacks.length) msg.push(xemBiet.filter((r) => r.den === hn).length + " văn bản xem để biết hôm nay");
    if (diRows.length) msg.push(di.filter((r) => r.ngay === hn).length + " văn bản phát hành hôm nay");
    return "Đã nhập: " + msg.join("; ") + ".";
  }
  $("#qlvbFile").addEventListener("change", async (e) => {
    const files = [...e.target.files]; e.target.value = "";
    if (!files.length) return;
    try {
      const goi = await Promise.all(files.map((f) => f.text().then((t) => JSON.parse(t))));
      const kq = nhapGoi(goi.flatMap(traiGoi));
      $("#qlvbStatus").textContent = kq;
      capNhatTaiCho(kq);
    } catch (err) { $("#qlvbStatus").textContent = "Không nhập được: " + err.message + "."; }
  });

  // Nhận dữ liệu từ nút "Quét qlvb" qua phần # của địa chỉ (không gửi lên máy chủ)
  function nhanTuDiaChi() {
    const h = location.hash;
    if (h === "#dang-quet") {
      toast("Đang nhận dữ liệu từ qlvb… giữ nguyên tab qlvb đến khi xong");
      history.replaceState(null, "", location.pathname + location.search);
      // báo cho tab qlvb biết Bàn làm việc đã sẵn sàng nhận dữ liệu
      let n = 0; const h2 = setInterval(() => { try { if (window.opener) window.opener.postMessage("blv-san-sang", "https://qlvb.tphcm.gov.vn"); } catch (e) { /* bỏ qua */ } if (++n > 60) clearInterval(h2); }, 1000);
      window.__blvDungBao = () => clearInterval(h2);
      return;
    }
    if (!h.startsWith("#qlvb=")) return;
    history.replaceState(null, "", location.pathname + location.search);
    try {
      const json = decodeURIComponent(escape(atob(decodeURIComponent(h.slice(6)))));
      capNhatTaiCho(nhapGoi(traiGoi(JSON.parse(json))));
    } catch (err) { toast("Không nhận được dữ liệu từ qlvb: " + err.message); }
  }
  // Cập nhật ngay trên trang (không tải lại) để note đang ghim không bị đóng
  function capNhatTaiCho(kq) {
    const Q2 = S.get().qlvb || {};
    D.den.splice(0, D.den.length, ...(Q2.den || []));
    D.di.splice(0, D.di.length, ...(Q2.di || []));
    D.xemBiet.splice(0, D.xemBiet.length, ...(Q2.xemBiet || []));
    D.quet = Q2.quet; D.nguon = "that";
    veScanInfo();
    $("#dsDen").innerHTML = D.den.map((d) => `<option value="${esc(d.so)}">${esc(d.ty.slice(0, 60))}</option>`).join("");
    renderEverything(); renderDi();
    toast(kq);
    window.dispatchEvent(new Event("blv-capnhat"));
  }
  // Nhận dữ liệu nút quét gửi sang bằng postMessage (chỉ chấp nhận từ trang qlvb)
  window.addEventListener("message", (e) => {
    if (e.origin !== "https://qlvb.tphcm.gov.vn" || !e.data || e.data.loai !== "blv-qlvb") return;
    if (window.__blvDungBao) window.__blvDungBao();
    try { capNhatTaiCho(nhapGoi(traiGoi(e.data.goi))); } catch (err) { toast("Không nhận được dữ liệu từ qlvb: " + err.message); }
  });
  window.addEventListener("hashchange", nhanTuDiaChi);
  nhanTuDiaChi();
  $("#dsDen").innerHTML = D.den.map((d) => `<option value="${esc(d.so)}">${esc(d.ty.slice(0, 60))}</option>`).join("");

  function renderAll() { renderToday(); renderCal(); }
  function renderEverything() { renderAll(); renderDen(); renderCho(); renderBaoCao(); }
  renderEverything(); renderDi();

  // Cho khung Trợ lý (js/tro-ly.js) đọc dữ liệu
  window.BLV_APP = { D, tasks, isLate, isEvent, goiY, allBC, xuLy, choXemList, showTab, toast, TODAY, HUONG, hanMacDinh, denHomNay, diHomNay, xemBietHomNay };
})();
