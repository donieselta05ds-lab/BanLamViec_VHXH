/* KHUNG TRỢ LÝ (chat mini ở góc dưới)
 * ----------------------------------------------------------------------------
 * Chạy hoàn toàn trên máy: chỉ đọc dữ liệu đã có trong web (việc, lịch, văn bản
 * đến/đi, báo cáo). KHÔNG gửi gì ra Internet.
 * Phần "soạn văn bản" tạo câu lệnh điền sẵn thông tin để dán vào công cụ AI bất kỳ.
 * Câu lệnh mẫu sửa ở config/cau-lenh-ai.js.
 */
(function () {
  "use strict";
  const A = window.BLV_APP;
  if (!A) return;
  const { dm, dmy, esc, addDays, parse, WD } = window.BLV;
  const CL = window.CAU_LENH || { mau: {}, theoHuong: {}, vanPhong: "" };
  const { D, TODAY } = A;
  const $ = (s) => document.querySelector(s);
  const boDau = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  const reSo = /\d[\d.]*\/[A-Za-zĐđ0-9&.\-\/_]+/;

  const log = $("#tlLog"), input = $("#tlInput"), panel = $("#tlPanel"), fab = $("#tlFab");
  let prompts = [];

  // ---------- GIAO DIỆN ----------
  function toggle(on) {
    panel.hidden = !on; fab.setAttribute("aria-expanded", on);
    if (on) { if (!log.children.length) chao(); input.focus(); }
  }
  fab.addEventListener("click", () => toggle(panel.hidden));
  $("#tlClose").addEventListener("click", () => toggle(false));
  $("#tlForm").addEventListener("submit", (e) => { e.preventDefault(); const q = input.value.trim(); if (!q) return; input.value = ""; hoi(q); });
  panel.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-q]"); if (chip) { hoi(chip.dataset.q); return; }
    const cp = e.target.closest("[data-copy]"); if (cp) { saoChep(prompts[Number(cp.dataset.copy)]); return; }
    const tab = e.target.closest("[data-tab-go]"); if (tab) { A.showTab(tab.dataset.tabGo); return; }
  });

  function say(who, html) {
    const d = document.createElement("div");
    d.className = "tl-msg " + who;
    d.innerHTML = html;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }
  const chips = (arr) => `<div class="tl-chips">${arr.map((q) => `<button type="button" class="tl-chip" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>`;
  function promptBox(text, title) {
    const i = prompts.push(text) - 1;
    return `<div class="tl-prompt"><div class="tl-prompt-head"><b>${esc(title)}</b><button type="button" class="btn btn-sm btn-primary" data-copy="${i}">Sao chép</button></div><pre>${esc(text)}</pre><p class="hint">Dán vào công cụ AI bạn dùng (ChatGPT, Gemini, Claude…), điền phần [ ]. Không dán nội dung mật hay thông tin cá nhân.</p></div>`;
  }
  async function saoChep(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select();
      document.execCommand("copy"); t.remove();
    }
    A.toast("Đã sao chép câu lệnh, dán vào công cụ AI");
  }

  function chao() {
    say("bot", `Chào bạn, mình là trợ lý của Bàn làm việc. Mình đọc dữ liệu có sẵn trong web và soạn sẵn câu lệnh để dán vào công cụ AI bạn dùng. Mình không gửi gì ra ngoài.${chips(["Hôm nay làm gì?", "7 ngày tới", "Văn bản khẩn", "Báo cáo sắp đến hạn", "Câu lệnh mẫu", "Cách thêm văn bản mới"])}`);
  }

  // ---------- TRẢ LỜI ----------
  const viec = (t) => `<li><span class="pill ${t.kind || "blue"}">${A.isLate(t) ? "Cần làm" : t.date === TODAY ? "Hôm nay" : WD[parse(t.date).getDay()].replace("Thứ ", "T") + " " + dm(t.date)}</span> ${esc(t.title)}${t.gio ? " · " + esc(t.gio) : ""}</li>`;
  const vbDen = (d) => `<li><b class="mono">${esc(d.so)}</b> ${d.khan && d.khan !== "Thường" ? `<span class="pill red">${esc(d.khan)}</span> ` : ""}${esc(d.ty)}${d.dc ? `<br><span class="hint">${esc(d.dc)}</span>` : ""}</li>`;
  const vbDi = (d) => `<li><b class="mono">${esc(d.so)}</b> <span class="hint">${d.ngay ? dmy(d.ngay) : ""}</span> ${esc(d.ty)}</li>`;
  const list = (arr, fn, max) => arr.length ? `<ul class="tl-list">${arr.slice(0, max || 8).map(fn).join("")}</ul>${arr.length > (max || 8) ? `<p class="hint">… và ${arr.length - (max || 8)} mục nữa.</p>` : ""}` : "";

  function dien(tpl, v) {
    return tpl.replace(/\{(\w+)\}/g, (m, k) => (k === "vanPhong" ? CL.vanPhong : v[k] != null && v[k] !== "" ? v[k] : "[ ]"));
  }
  function cauLenhVanBan(doc, mauId) {
    const id = mauId || CL.theoHuong[(A.xuLy()[doc.so] || {}).huong || A.goiY(doc).h.id] || "tom-tat";
    const m = CL.mau[id] || CL.mau["tom-tat"];
    return { ten: m.ten, text: dien(m.noiDung, { so: doc.so, den: doc.den ? dmy(doc.den) : doc.ngay ? dmy(doc.ngay) : "", noi: doc.noi || "[cơ quan]", khan: doc.khan || "Thường", ty: doc.ty }) };
  }
  function cauLenhBaoCao(bc) {
    const k = window.BLV.kyGanNhat(bc, TODAY);
    const ds = D.di.filter((d) => d.ngay && d.ngay >= k.from && d.ngay <= k.to && d.loai !== "Tờ trình");
    const m = CL.mau["bao-cao-ky"];
    return { ds, k, text: dien(m.noiDung, {
      tenBC: bc.ten, noiNhan: bc.noiNhan, tu: dmy(k.from), den: dmy(k.to), han: k.han ? dmy(k.han) : "[ ]", canCu: bc.canCu,
      deCuong: (bc.deCuong || []).map((x, i) => (i + 1) + ". " + x).join("\n") || "[ ]",
      dsVanBan: ds.map((d) => "- " + d.so + " ngày " + dmy(d.ngay) + ": " + d.ty).join("\n") || "- (chưa có văn bản đi trong kỳ trên kho; quét Văn bản đi đã phát hành để cập nhật)",
    }) };
  }
  const STOP = new Set(["bao", "cao", "khi", "nao", "han", "cua", "ngay", "lam", "soan", "cho", "toi", "minh", "the", "gui", "nay", "lenh", "cau"]);
  function timBaoCao(q) {
    const w = boDau(q).split(/[^a-z0-9]+/).filter((x) => x.length >= 2 && !STOP.has(x));
    if (!w.length) return null;
    let best = null;
    A.allBC().forEach((b) => {
      const t = boDau([b.ten, b.noiNhan, b.mang, b.canCu, b.id].join(" "));
      const n = w.filter((x) => t.includes(x)).length;
      if (n && (!best || n > best.n)) best = { b, n };
    });
    return best && best.b;
  }
  function timVanBan(q) {
    const w = boDau(q).split(/\s+/).filter((x) => x.length >= 2);
    const hit = (d) => { const t = boDau(d.so + " " + d.ty + " " + (d.noi || "")); return w.every((x) => t.includes(x)); };
    return { den: D.den.filter(hit), di: D.di.filter(hit) };
  }

  function hoi(q) {
    say("me", esc(q));
    const k = boDau(q);
    const all = A.tasks();
    let tl = "";

    // loại câu lệnh được gọi đúng tên (từ các nút gợi ý)
    const mauKhop = Object.keys(CL.mau).find((x) => k.includes(boDau(CL.mau[x].ten)));
    const so = (q.match(reSo) || [])[0];
    const doc = so && (D.den.find((d) => d.so === so) || D.den.find((d) => d.so.startsWith(so)) || D.di.find((d) => d.so === so || d.so.startsWith(so)));

    if (doc) {
      const c = cauLenhVanBan(doc, mauKhop !== "bao-cao-ky" ? mauKhop : null);
      const h = A.xuLy()[doc.so] ? "đã phân loại" : "gợi ý: " + A.goiY(doc).h.ten;
      tl = `<p><b class="mono">${esc(doc.so)}</b> ${esc(doc.ty)}<br><span class="hint">${esc(doc.noi || "")}${doc.den ? " · đến " + dm(doc.den) : ""} · ${esc(h)}</span></p>${promptBox(c.text, c.ten)}`
        + chips(Object.keys(CL.mau).filter((x) => x !== "bao-cao-ky").map((x) => "Câu lệnh " + CL.mau[x].ten.toLowerCase() + " cho " + doc.so).slice(0, 4));
    } else if (so) {
      tl = `Không thấy văn bản <b class="mono">${esc(so)}</b> trong dữ liệu. Có thể văn bản chưa được quét: bấm <b>Nhập dữ liệu qlvb</b> để cập nhật.`;
    } else if (/huong dan|giup|lam duoc gi|help|ban la ai/.test(k)) {
      tl = `Bạn có thể hỏi:<ul class="tl-list"><li>Việc: "hôm nay làm gì", "7 ngày tới"</li><li>Văn bản: "văn bản khẩn", "chưa phân loại", "chờ xem xét", "tờ trình chờ", hoặc gõ vài chữ trong trích yếu để tìm</li><li>Báo cáo: "báo cáo sắp đến hạn", "báo cáo tuần Sở KHCN"</li><li>Soạn: gõ số văn bản (ví dụ 7226/SKHCN-CĐS), "câu lệnh kế hoạch", "câu lệnh soát lỗi"</li><li>"Cách thêm văn bản mới"</li></ul>`;
    } else if (/(them|cap nhat|quet|nhap).*(van ban|qlvb)|qlvb/.test(k)) {
      tl = `Thêm văn bản mới (khoảng 1 phút):<ol class="tl-list"><li>Trên qlvb mở <b>Văn bản đến chờ xử lý</b>, chọn 50 bản ghi, bấm nút <b>Quét qlvb</b> trên thanh dấu trang. Nhiều hơn 50 thì sang trang 2 bấm tiếp.</li><li>Mở <b>Văn bản đi đã phát hành</b>, bấm <b>Quét qlvb</b>.</li><li>Ở đây bấm <b>Nhập dữ liệu qlvb</b>, chọn các tệp vừa tải.</li></ol><p>Văn bản đi được <b>cộng dồn</b> vào kho (hiện có ${D.di.length}) để làm báo cáo theo kỳ; văn bản đến được làm mới theo qlvb. Chưa cài nút Quét thì mở trang <a href="cai-dat-nut-quet.html" target="_blank" rel="noopener">Cài nút Quét qlvb</a>.</p>`;
    } else if (/cau lenh|mau|prompt/.test(k) && ((mauKhop && mauKhop !== "bao-cao-ky") || !/bao cao/.test(k))) {
      const id = mauKhop && mauKhop !== "bao-cao-ky" ? mauKhop
        : Object.keys(CL.mau).find((x) => x !== "bao-cao-ky" && boDau(CL.mau[x].ten).split(/[^a-z]+/).filter((y) => y.length > 3).some((y) => k.includes(y)));
      if (id) {
        const m = CL.mau[id];
        tl = promptBox(dien(m.noiDung, {}), m.ten) + `<p class="hint">Mẹo: gõ số văn bản để có câu lệnh điền sẵn thông tin văn bản đó.</p>`;
      } else {
        tl = `Chọn loại câu lệnh:${chips(Object.keys(CL.mau).filter((x) => x !== "bao-cao-ky").map((x) => "Câu lệnh " + CL.mau[x].ten.toLowerCase()))}<p class="hint">Hoặc gõ số văn bản để có câu lệnh điền sẵn.</p>`;
      }
    } else if (/bao cao/.test(k)) {
      const bc = timBaoCao(q.replace(/báo cáo/gi, ""));
      if (bc) {
        const r = cauLenhBaoCao(bc);
        tl = `<p><b>${esc(bc.ten)}</b><br><span class="hint">${esc(window.BLV.chuKyText(bc))} · gửi ${esc(bc.noiNhan)}</span><br>Kỳ tới: số liệu ${dm(r.k.from)} – ${dm(r.k.to)}, hạn <b>${r.k.han ? dmy(r.k.han) : "chưa xác định"}</b>. Trong kỳ có <b>${r.ds.length}</b> văn bản đi.</p>${promptBox(r.text, "Soạn " + bc.ten)}<button type="button" class="btn btn-sm" data-tab-go="baocao">Mở tab Báo cáo</button>`;
      } else {
        const up = A.allBC().map((b) => ({ b, h: window.BLV.kyToi(b, TODAY) })).filter((x) => x.h).sort((a, b) => a.h.localeCompare(b.h));
        tl = `Báo cáo sắp đến hạn:<ul class="tl-list">${up.slice(0, 6).map((x) => `<li><span class="pill ${x.h <= addDays(TODAY, 2) ? "red" : "blue"}">${dm(x.h)}</span> ${esc(x.b.ten)}</li>`).join("")}</ul>${chips(up.slice(0, 3).map((x) => "Báo cáo " + x.b.ten))}`;
      }
    } else if (/hom nay|lam gi/.test(k)) {
      const t = all.filter((x) => (x.date === TODAY || A.isLate(x)) && !window.STORE.isDone(x.id));
      tl = t.length ? `Hôm nay còn <b>${t.length}</b> việc:${list(t, viec)}` : "Hôm nay không còn việc nào chưa xong.";
    } else if (/7 ngay|tuan|sap toi|sap den/.test(k)) {
      const t = all.filter((x) => x.date > TODAY && x.date <= addDays(TODAY, 7));
      tl = t.length ? `7 ngày tới có <b>${t.length}</b> việc:${list(t, viec, 10)}` : "7 ngày tới chưa có việc nào.";
    } else if (/qua han|\btre\b|ton dong/.test(k)) {
      const t = all.filter(A.isLate);
      tl = t.length ? `<b>${t.length}</b> việc cần làm sớm:${list(t, viec)}` : "Không có việc nào cần làm gấp.";
    } else if (/khan|hoa toc/.test(k)) {
      const t = D.den.filter((d) => d.mau === "red");
      tl = t.length ? `<b>${t.length}</b> văn bản khẩn đang xử lý:${list(t, vbDen)}<p class="hint">Gõ số văn bản để có câu lệnh soạn trả lời.</p>` : "Không có văn bản khẩn nào đang chờ.";
    } else if (/cho xem|chua ro/.test(k)) {
      const t = A.choXemList();
      tl = t.length ? `<b>${t.length}</b> văn bản chờ xem xét:${list(t, vbDen)}<button type="button" class="btn btn-sm" data-tab-go="cho">Mở tab Chờ xem xét</button>` : "Không có văn bản nào chờ xem xét.";
    } else if (/chua phan loai|chua xu ly|van ban moi/.test(k)) {
      const t = D.den.filter((d) => !A.xuLy()[d.so]);
      tl = t.length ? `<b>${t.length}</b> văn bản đến chưa phân loại:${list(t, vbDen)}` : "Đã phân loại hết văn bản đến.";
    } else if (/to trinh/.test(k)) {
      const t = D.di.filter((d) => d.loai === "Tờ trình" && d.mau === "amber");
      tl = t.length ? `<b>${t.length}</b> tờ trình đang chờ văn bản chính:${list(t, vbDi)}` : "Không có tờ trình nào đang chờ.";
    } else {
      const r = timVanBan(q);
      const n = r.den.length + r.di.length;
      tl = n ? `Tìm thấy ${n} văn bản:${r.den.length ? "<p><b>Văn bản đến</b></p>" + list(r.den, vbDen, 5) : ""}${r.di.length ? "<p><b>Văn bản đi</b></p>" + list(r.di, vbDi, 5) : ""}<p class="hint">Gõ số văn bản để có câu lệnh soạn.</p>`
        : `Mình chưa hiểu câu này và không tìm thấy văn bản nào khớp.${chips(["Hướng dẫn", "Hôm nay làm gì?", "Câu lệnh mẫu"])}`;
    }
    say("bot", tl);
  }
})();
