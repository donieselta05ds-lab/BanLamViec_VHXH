/* TẠO THƯ MỤC CÔNG VIỆC + TỆP MẪU
 * ----------------------------------------------------------------------------
 * Bấm "Tạo thư mục" trong hộp Xử lý: web tạo trong thư mục gốc (chọn 1 lần,
 * ví dụ congviec\2026 P.Gia Định\2026 P.Gia Định):
 *   <LOẠI>\NN. CV 11060-TB-SKHCN - De cu nhan su ...\
 *       File dinh kem\            (để tệp tải từ qlvb)
 *       CV_..., TTr_..., PTr_..., PTr_5o_....docx   (điền sẵn trích yếu, căn cứ)
 * NN = số thứ tự tiếp theo trong thư mục loại. Đã có thư mục cho số văn bản này
 * thì dùng lại, không tạo trùng; tệp đã có thì không ghi đè.
 * Dùng chức năng ghi thư mục của Chrome/Edge (File System Access).
 */
(function () {
  "use strict";
  const A = window.BLV_APP;
  if (!A) return;
  const { dmy, esc } = window.BLV;
  const HO_TRO = "showDirectoryPicker" in window;

  // ---------- lưu thư mục gốc (IndexedDB giữ được quyền truy cập thư mục) ----------
  const idb = () => new Promise((res, rej) => {
    const r = indexedDB.open("blv-thu-muc", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("h");
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  async function docGoc() {
    try {
      const db = await idb();
      return await new Promise((res) => { const t = db.transaction("h").objectStore("h").get("goc"); t.onsuccess = () => res(t.result || null); t.onerror = () => res(null); });
    } catch (e) { return null; }
  }
  async function luuGoc(h) {
    try { const db = await idb(); await new Promise((res) => { const t = db.transaction("h", "readwrite"); t.objectStore("h").put(h, "goc"); t.oncomplete = res; t.onerror = res; }); } catch (e) { /* bỏ qua */ }
  }
  async function layGoc(chonLai) {
    let h = chonLai ? null : await docGoc();
    if (h) {
      let p = await h.queryPermission({ mode: "readwrite" });
      if (p !== "granted") p = await h.requestPermission({ mode: "readwrite" });
      if (p !== "granted") h = null;
    }
    if (!h) {
      h = await window.showDirectoryPicker({ id: "blv-congviec", mode: "readwrite" });
      await luuGoc(h);
    }
    return h;
  }

  // ---------- chữ ----------
  const boDau = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
  const loaiTheoSo = (so) => /\/KH-/.test(so) ? "Kế hoạch" : /\/QĐ-/.test(so) ? "Quyết định" : /\/TB-/.test(so) ? "Thông báo" : /\/BC-/.test(so) ? "Báo cáo" : /\/TTr/.test(so) ? "Tờ trình" : "Công văn";
  const tenDu = (s) => String(s || "[cơ quan ban hành]")
    .replace(/^PC\d+\s*-\s*/i, "").replace(/\bTPHCM\b|TP\.HCM/g, "Thành phố Hồ Chí Minh").replace(/\bTP\b/g, "Thành phố")
    .replace(/\bUBND\b/g, "Ủy ban nhân dân").replace(/\bKHCN\b/g, "Khoa học và Công nghệ").replace(/\bSNV\b/g, "Sở Nội vụ").replace(/\bVPĐU\b/g, "Văn phòng Đảng ủy");
  const gon = (ty) => String(ty || "").replace(/^(V\/v|Về việc|Về)\s+/i, "").replace(/[.\s]+$/, "");
  const thuongDau = (s) => s.charAt(0).toLowerCase() + s.slice(1);

  function giaTri(doc, h) {
    const loai = loaiTheoSo(doc.so);
    const noi = tenDu(doc.noi);
    const tyGoc = thuongDau(gon(doc.ty));
    const loaiVb = h.id === "ke-hoach" ? "Kế hoạch" : h.id === "quyet-dinh" ? "Quyết định" : "Công văn";
    const tyVb = h.id === "trien-khai" || h.id === "chuyen" ? `triển khai ${loai} số ${doc.so} của ${noi}`
      : h.id === "ke-hoach" ? `thực hiện ${loai} số ${doc.so} của ${noi}` : tyGoc;
    const vv = h.id === "ke-hoach" ? " " : " về việc ";   // "Kế hoạch thực hiện…", "Công văn về việc…"
    const v = {
      LOAI_VB: loaiVb, DO_KHAN: doc.khan || "Thường",
      TY_VB: tyVb, TY_TRINH: `${loaiVb}${vv}${tyVb}`,
      CAN_CU: `${loai} số ${doc.so} ngày … tháng … năm 2026 của ${noi} về việc ${tyGoc}`,
      VB_THAM_MUU: `${loaiVb.toLowerCase()}${vv}${tyVb}`, VE_VIEC: `ban hành ${loaiVb}${vv}${tyVb}`,
      KINH_GUI: `${noi}.`, NOI_DUNG: "", KET: "",
    };
    Object.assign(v, window.NGUOI_KY || {});   // người ký, người trình: config/nguoi-ky(.local).js
    if (h.id === "trien-khai" || h.id === "chuyen") {
      v.KINH_GUI = "- Các phòng chuyên môn thuộc phường;\n- Trung tâm Phục vụ hành chính công phường;\n- Các đơn vị sự nghiệp công lập thuộc phường.";
      v.NOI_DUNG = `Ủy ban nhân dân phường Gia Định đề nghị các cơ quan, đơn vị:\n- [Nội dung triển khai].\n- Trong quá trình thực hiện, nếu có khó khăn, vướng mắc, đề nghị các cơ quan, đơn vị phản ánh về Ủy ban nhân dân phường (thông qua Phòng Văn hóa - Xã hội) để tổng hợp, báo cáo ${noi} xem xét, hướng dẫn.\n(Đính kèm ${loai} số ${doc.so} của ${noi})`;
      v.KET = "Ủy ban nhân dân phường Gia Định đề nghị các cơ quan, đơn vị nghiêm túc triển khai thực hiện./.";
    } else if (h.id === "gop-y") {
      v.NOI_DUNG = "Qua nghiên cứu, Ủy ban nhân dân phường Gia Định thống nhất với nội dung dự thảo [tên dự thảo].";
      v.KET = `Ủy ban nhân dân phường Gia Định kính báo cáo đến ${noi}./.`;
    } else if (h.id === "tham-du") {
      v.NOI_DUNG = "Ủy ban nhân dân phường Gia Định cử [họ tên, chức vụ, số điện thoại] tham dự [tên lớp tập huấn, hội nghị].";
      v.KET = `Ủy ban nhân dân phường Gia Định kính gửi ${noi} tổng hợp./.`;
    } else {
      v.NOI_DUNG = "Ủy ban nhân dân phường Gia Định báo cáo kết quả thực hiện như sau:\n1. [Nội dung]\n2. [Nội dung]";
      v.KET = `Ủy ban nhân dân phường Gia Định kính báo cáo ${noi} tổng hợp./.`;
    }
    return v;
  }

  // Tệp tạo theo hướng xử lý
  const TEP = {
    "bao-cao": ["cv", "ttr", "ptr", "ptr5"], "tra-loi": ["cv", "ttr", "ptr", "ptr5"], "gop-y": ["cv", "ttr", "ptr", "ptr5"],
    "trien-khai": ["cv", "ttr", "ptr", "ptr5"], "chuyen": ["cv", "ttr", "ptr", "ptr5"],
    "ke-hoach": ["ttr", "ptr", "ptr5"], "quyet-dinh": ["ttr", "ptr", "ptr5"], "tham-du": ["cv", "ptr"], "de-biet": [],
  };
  const TIEN_TO = { cv: "CV_", ttr: "TTr_", ptr: "PTr_", ptr5: "PTr_5o_" };

  // ---------- điền mẫu Word ----------
  const escXml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  function dienXml(xml, v) {
    // token có nhiều dòng: nhân bản cả đoạn văn (w:p) chứa nó
    Object.keys(v).forEach((k) => {
      const tok = "{{" + k + "}}";
      let i;
      while ((i = xml.indexOf(tok)) >= 0) {
        const dong = String(v[k]).split("\n");
        if (dong.length === 1) { xml = xml.slice(0, i) + escXml(dong[0]) + xml.slice(i + tok.length); continue; }
        const a = Math.max(xml.lastIndexOf("<w:p ", i), xml.lastIndexOf("<w:p>", i));
        const b = xml.indexOf("</w:p>", i) + 6;
        const doan = xml.slice(a, b);
        const nhieu = dong.map((d) => doan.replace(tok, escXml(d))).join("");
        xml = xml.slice(0, a) + nhieu + xml.slice(b);
      }
    });
    return xml;
  }
  async function taoDocx(mau, v) {
    const zip = await window.JSZip.loadAsync(window.MAU_WORD[mau], { base64: true });
    const xml = await zip.file("word/document.xml").async("string");
    zip.file("word/document.xml", dienXml(xml, v));
    return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 }, mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  }

  // ---------- tạo thư mục ----------
  async function coSan(dir, ten, kind) {
    try { return kind === "dir" ? await dir.getDirectoryHandle(ten) : await dir.getFileHandle(ten); } catch (e) { return null; }
  }
  function tenMoi(doc, nn) {
    const soFs = doc.so.replace(/\//g, "-");
    const pre = /\/KH-/.test(doc.so) ? "KH" : /\/QĐ-/.test(doc.so) ? "QD" : /\/TB-/.test(doc.so) ? "TB" : "CV";
    const chu = boDau(gon(doc.ty)).replace(/\//g, "-").replace(/[^\w\s.-]/g, "").replace(/\.+$/, "").split(/\s+/).filter(Boolean).slice(0, 10).join(" ");
    return `${nn}. ${pre} ${soFs} - ${chu.charAt(0).toUpperCase() + chu.slice(1)}`.replace(/[\\/:*?"<>|]/g, "-").slice(0, 150);
  }
  const slugTep = (v) => boDau(v.TY_VB).replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean).slice(0, 8).join("_");

  // Dự phòng: trình duyệt không cho ghi thư mục (bản xem thử, Firefox…) -> tải về tệp .zip cùng cấu trúc
  async function taiZip(doc, h) {
    const v = giaTri(doc, h);
    const tenTM = tenMoi(doc, "NN");
    const zip = new window.JSZip();
    const tm = zip.folder(h.thuMuc).folder(tenTM);
    tm.folder("File dinh kem");
    const tep = [];
    for (const mau of TEP[h.id] || []) {
      const ten = `${TIEN_TO[mau]}${slugTep(v)}.docx`;
      tm.file(ten, await taoDocx(mau, v)); tep.push(ten);
    }
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = tenTM.replace(/^NN\. /, "") + ".zip";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return { thuMuc: `${h.thuMuc}\\${tenTM}`, tep };
  }

  async function tao(doc, h, chonLai) {
    const goc = await layGoc(chonLai);
    const loaiDir = await goc.getDirectoryHandle(h.thuMuc, { create: true });
    const soFs = doc.so.replace(/\//g, "-");
    let tenTM = null, maxNN = 0;
    for await (const [ten, hd] of loaiDir.entries()) {
      if (hd.kind !== "directory") continue;
      const m = /^(\d+)/.exec(ten); if (m) maxNN = Math.max(maxNN, Number(m[1]));
      if (ten.includes(soFs)) tenTM = ten;   // đã có thư mục cho văn bản này
    }
    const daCo = !!tenTM;
    if (!tenTM) tenTM = tenMoi(doc, String(maxNN + 1).padStart(2, "0"));
    const tm = await loaiDir.getDirectoryHandle(tenTM, { create: true });
    await tm.getDirectoryHandle("File dinh kem", { create: true });

    const v = giaTri(doc, h);
    const slug = slugTep(v);
    const ket = { thuMuc: `${goc.name}\\${h.thuMuc}\\${tenTM}`, daCo, tao: [], boQua: [] };
    for (const mau of TEP[h.id] || []) {
      const ten = `${TIEN_TO[mau]}${slug}.docx`;
      if (await coSan(tm, ten, "file")) { ket.boQua.push(ten); continue; }
      const fh = await tm.getFileHandle(ten, { create: true });
      const w = await fh.createWritable();
      await w.write(await taoDocx(mau, v));
      await w.close();
      ket.tao.push(ten);
    }
    return ket;
  }

  // ---------- giao diện trong hộp Xử lý ----------
  window.BLV_THUMUC = {
    hoTro: HO_TRO,
    coTheTao: (h) => !!(h && h.thuMuc && TEP[h.id]),
    tepSeTao: (h) => (TEP[h.id] || []).map((m) => ({ cv: "Văn bản chính (CV)", ttr: "Tờ trình", ptr: "Phiếu trình", ptr5: "Phiếu trình 5 ô" }[m])),
    async chay(doc, h, chonLai, oKetQua) {
      const quaZip = async (lyDo) => {
        const k = await taiZip(doc, h);
        oKetQua.innerHTML = `${lyDo} Đã tải về tệp <b>.zip</b> gồm thư mục <code>${esc(k.thuMuc)}</code>`
          + (k.tep.length ? ` và ${esc(k.tep.join(", "))}` : "") + `. Giải nén vào thư mục công việc, đổi "NN" thành số thứ tự.`;
        A.toast("Đã tải về thư mục công việc (.zip)");
      };
      oKetQua.textContent = "Đang tạo…";
      if (!HO_TRO) { await quaZip("Trình duyệt này không ghi thẳng vào thư mục được."); return; }
      try {
        const k = await tao(doc, h, chonLai);
        oKetQua.innerHTML = `<b>${k.daCo ? "Dùng thư mục đã có" : "Đã tạo thư mục"}:</b> <code>${esc(k.thuMuc)}</code>`
          + (k.tao.length ? `<br>Tệp mới: ${k.tao.join(", ")}` : "")
          + (k.boQua.length ? `<br>Đã có sẵn, không ghi đè: ${k.boQua.join(", ")}` : "")
          + `<br><span class="hint">Tải văn bản của nơi gửi từ qlvb vào "File dinh kem". Chỗ "…" và [ ] trong tệp cần điền.</span>`;
        A.toast(k.daCo ? "Đã cập nhật thư mục công việc" : "Đã tạo thư mục công việc");
      } catch (e) {
        if (e && e.name === "AbortError") { oKetQua.textContent = "Chưa chọn thư mục gốc."; return; }
        if (e && (e.name === "SecurityError" || e.name === "NotAllowedError" || /sub frame|cross.origin/i.test(e.message || ""))) {
          try { await quaZip("Trang đang mở trong khung xem thử nên không ghi thẳng vào thư mục được."); } catch (e2) { oKetQua.textContent = "Không tạo được: " + e2.message; }
          return;
        }
        oKetQua.textContent = "Không tạo được: " + (e && e.message ? e.message : e);
      }
    },
    dmy,
  };
})();
