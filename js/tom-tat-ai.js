/* Tóm tắt văn bản bằng AI: Claude (mặc định) hoặc Gemini
 * - Văn bản đến chờ xử lý: tóm tắt kỹ (Nội dung chính / Phường cần làm / Hạn / Gửi về).
 * - Văn bản đi đã phát hành: tóm sơ 1 dòng.
 * - Văn bản xem để biết: không tóm tắt.
 * - Nội dung do nút "Quét qlvb" đọc từ tệp PDF trên qlvb (văn bản mật đã bị bỏ qua).
 * - Mã khóa (API key) mỗi máy tự nhập, CHỈ lưu trên trình duyệt máy đó, không nằm trên GitHub.
 * - "Tự động tóm tắt": quét xong chỉ tự tóm tắt văn bản QUAN TRỌNG để tiết kiệm token:
 *   văn bản cấp trên (Sở, UBND Thành phố…) mà mình xử lý chính (XLC) và cần tham mưu, hoặc khẩn/hỏa tốc.
 *   Tóm tắt văn bản đến = chỉ liệt kê việc giao cho Ủy ban nhân dân phường (việc, hạn, gửi về).
 *   Văn bản phối hợp, để biết, văn bản đi: chỉ tóm tắt khi bấm nút.
 */
(function () {
  "use strict";
  const A = window.BLV_APP;
  if (!A) return;
  const { esc, load, save } = window.BLV;
  const $ = (s, r = document) => r.querySelector(s);
  const NCC = {
    claude: { ten: "Claude (Anthropic)", model: "claude-haiku-5-5", taoKhoa: "https://platform.claude.com/settings/keys", mau: "sk-ant-..." },
    gemini: { ten: "Gemini (Google)", model: "gemini-2.5-flash", taoKhoa: "https://aistudio.google.com/apikey", mau: "AIza..." },
  };
  const ls = { get: (k) => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) { /* bỏ qua */ } } };
  const ncc = () => load("blv-ai-ncc", "claude");
  const khoa = (n = ncc()) => ls.get("blv-ai-khoa-" + n);
  const model = (n = ncc()) => load("blv-ai-model-" + n, "") || NCC[n].model;
  const tuDong = () => load("blv-ai-tudong", true);
  let kho = load("blv-tomtat", {});
  const layTomTat = (so) => (kho[so] && kho[so].tt) || "";
  const coND = (d) => d.nd && d.nd.replace(/\s/g, "").length >= 80;
  // Văn bản quan trọng: văn bản CẤP TRÊN gửi xuống (Sở, Ủy ban nhân dân Thành phố, Công an Thành phố, Trung tâm, Ban…;
  // không tính văn bản nội bộ của phường), và (khẩn/hỏa tốc hoặc mình xử lý chính XLC và cần tham mưu)
  const capTren = (d) => { const n = String(d.noi || "").trim(); return !!n && !/phường gia định|^đảng ủy phường|^ủy ban nhân dân phường/i.test(n); };
  const quanTrong = (d) => capTren(d) && ((d.khan && d.khan !== "Thường") || ((!d.vaiTro || /XLC/i.test(d.vaiTro)) && A.goiY(d).h.id !== "de-biet"));

  function cauLenh(d, kieu) {
    const dau = [
      "Bạn là chuyên viên Phòng Văn hóa - Xã hội, Ủy ban nhân dân phường Gia Định, Thành phố Hồ Chí Minh.",
      "Chỉ dùng thông tin có trong văn bản, không suy đoán, không thêm lời dẫn hay định dạng markdown.",
    ];
    const yeuCau = kieu === "di"
      ? ["Đây là văn bản phường ĐÃ PHÁT HÀNH. Tóm sơ trong 1 dòng, bắt đầu bằng \"Nội dung:\" (tối đa 30 từ): văn bản gửi ai, về việc gì."]
      : ["Đây là văn bản ĐẾN từ cấp trên. Lấy những việc văn bản giao cho Ủy ban nhân dân các phường, xã, đặc khu (hoặc phường Gia Định), kể cả việc giao chung cho \"các cơ quan, đơn vị, địa phương\" mà phường phải thực hiện.",
        "Linh động theo văn bản: văn bản yêu cầu báo cáo thì nêu báo cáo nội dung gì; văn bản triển khai thì nêu phường phải tổ chức, tuyên truyền, cử người… gì; giấy mời thì nêu thời gian, địa điểm, thành phần.",
        "Bỏ qua phần căn cứ, phần giới thiệu và việc chỉ giao riêng cho đơn vị khác.",
        "Mỗi việc 1 dòng, bắt đầu bằng \"- \", viết gọn: việc cần làm (nêu loại văn bản cần tham mưu nếu có: báo cáo, công văn, kế hoạch…); hạn: ngày (nếu văn bản ghi); gửi về: nơi nhận (nếu có).",
        "Tối đa 5 dòng. Nếu văn bản không giao việc gì cho phường thì chỉ ghi đúng 1 dòng: \"- Không giao việc cho phường (để biết).\""];
    return dau.concat(yeuCau, ["", "Số ký hiệu: " + d.so, d.noi ? "Cơ quan ban hành: " + d.noi : "", "Trích yếu: " + d.ty, "Nội dung văn bản:", String(d.nd || "").slice(0, kieu === "di" ? 3000 : 9000)])
      .filter((x) => x !== "").join("\n");
  }

  async function goiClaude(text, toiDa) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": khoa("claude"), "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model: model("claude"), max_tokens: toiDa, messages: [{ role: "user", content: text }] }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || ("lỗi " + r.status));
    return (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  }
  async function goiGemini(text, toiDa) {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model("gemini")) + ":generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": khoa("gemini") },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text }] }], generationConfig: { temperature: 0.2, maxOutputTokens: toiDa } }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || ("lỗi " + r.status));
    const c = ((j.candidates || [])[0] || {}).content;
    return c && c.parts ? c.parts.map((p) => p.text || "").join("").trim() : "";
  }

  async function tomTat(d, kieu) {
    if (!khoa()) throw new Error("chưa nhập mã khóa AI (bấm \"Cài AI\")");
    if (!coND(d)) throw new Error("chưa đọc được nội dung (tệp PDF dạng ảnh scan hoặc chưa quét lại)");
    const text = cauLenh(d, kieu);
    const kq = ncc() === "gemini" ? await goiGemini(text, kieu === "di" ? 200 : 600) : await goiClaude(text, kieu === "di" ? 200 : 600);
    if (!kq) throw new Error("AI không trả lời");
    kho[d.so] = { tt: kq, luc: new Date().toISOString(), ncc: ncc() };
    save("blv-tomtat", kho);
    return kq;
  }

  // ---------- giao diện ----------
  const dsDen = () => A.denHomNay();
  const dsDi = () => A.diHomNay();
  const side = $(".side");
  if (side) {
    side.insertAdjacentHTML("afterbegin", `
      <div class="block" id="aiBlock">
        <div class="block-head"><h2>Tóm tắt văn bản hôm nay (AI)</h2>
          <span class="row"><button class="btn btn-sm" type="button" id="aiTatCa">Tóm tắt văn bản quan trọng</button><button class="btn btn-sm btn-ghost" type="button" id="aiCai">Cài AI</button></span></div>
        <p class="hint" id="aiHint"></p>
        <h3 class="sub">Văn bản đến chờ xử lý</h3><ul class="mini" id="aiDen"></ul>
        <h3 class="sub">Văn bản đã phát hành</h3><ul class="mini" id="aiDi"></ul>
        <p class="hint" id="aiXb"></p>
      </div>`);
  }
  document.body.insertAdjacentHTML("beforeend", `
    <div class="overlay" id="dlgAi" hidden>
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="aiH">
        <h2 id="aiH">Cài AI tóm tắt</h2>
        <label class="field">Dùng AI<select id="aiNcc"><option value="claude">Claude (Anthropic)</option><option value="gemini">Gemini (Google, có gói miễn phí)</option></select></label>
        <p id="aiHuongDan"></p>
        <label class="field">Mã khóa (API key)<input id="aiKhoa" type="password" autocomplete="off"></label>
        <label class="field">Mô hình<input id="aiModel" type="text"></label>
        <label class="row"><input type="checkbox" id="aiTuDong"> Quét xong tự tóm tắt văn bản quan trọng của cấp trên (xử lý chính hoặc khẩn)</label>
        <p class="hint" id="aiLuuY"></p>
        <p class="status" id="aiStatus" role="status"></p>
        <div class="row end"><button class="btn" type="button" id="aiXoa">Xóa mã</button><button class="btn" type="button" data-close>Đóng</button><button class="btn btn-primary" type="button" id="aiLuu">Lưu</button></div>
      </div>
    </div>`);

  function dong(d, kieu) {
    const tt = layTomTat(d.so), co = coND(d);
    const qt = kieu === "den" && quanTrong(d);
    return `<li class="${kieu === "di" ? "blue" : d.khan && d.khan !== "Thường" ? "red" : "amber"}"><div class="row"><b class="mono">${esc(d.so)}${qt ? ' <span class="pill red">Quan trọng</span>' : d.vaiTro && kieu === "den" ? ` <span class="pill grey">${esc(d.vaiTro)}</span>` : ""}</b>${tt ? "" : `<button class="btn btn-xl" type="button" data-ai="${esc(d.so)}" data-kieu="${kieu}" ${co ? "" : "disabled"}>Tóm tắt</button>`}</div>
      <span>${esc(d.ty)}</span>
      ${tt ? `<span style="display:block;white-space:pre-line;color:var(--ink);margin-top:4px">${esc(tt)}</span>` : co ? "" : `<span class="q">Chưa có nội dung (tệp PDF dạng ảnh scan hoặc chưa quét): mở qlvb để đọc.</span>`}</li>`;
  }
  function ve() {
    const den = dsDen(), di = dsDi(), xb = A.xemBietHomNay();
    $("#aiHint").textContent = !den.length && !di.length ? "Hôm nay chưa có văn bản mới. Bấm nút Quét qlvb trên trang qlvb để cập nhật."
      : khoa() ? `Đang dùng ${NCC[ncc()].ten}${tuDong() ? ", quét xong tự tóm tắt văn bản quan trọng của cấp trên (xử lý chính hoặc khẩn): lấy việc giao cho phường" : ""}. Văn bản khác bấm Tóm tắt ở từng dòng nếu cần.`
        : "Bấm \"Cài AI\" để nhập mã khóa trước khi tóm tắt.";
    $("#aiDen").innerHTML = den.map((d) => dong(d, "den")).join("") || "<li>Không có.</li>";
    $("#aiDi").innerHTML = di.map((d) => dong(d, "di")).join("") || "<li>Không có.</li>";
    $("#aiXb").textContent = xb.length ? `Văn bản xem để biết hôm nay: ${xb.length} (không tóm tắt).` : "";
  }
  let dangChay = false;
  async function chay(so, kieu) {
    const d = (kieu === "di" ? dsDi() : dsDen()).find((x) => x.so === so); if (!d) return false;
    const b = document.querySelector(`[data-ai="${CSS.escape(so)}"]`);
    if (b) { b.disabled = true; b.textContent = "Đang tóm tắt…"; }
    let ok = true;
    try { await tomTat(d, kieu); } catch (e) { ok = false; A.toast("Không tóm tắt được " + so + ": " + e.message); }
    ve(); return ok;
  }
  // chiQuanTrong: tự động sau khi quét chỉ tóm tắt văn bản quan trọng; bấm "Tóm tắt văn bản quan trọng" cũng vậy
  async function tomTatTatCa(imLang) {
    if (dangChay) return;
    if (!khoa()) { if (!imLang) moCai(); return; }
    const can = dsDen().filter((d) => !layTomTat(d.so) && coND(d) && quanTrong(d)).map((d) => [d.so, "den"]);
    if (!can.length) { if (!imLang) A.toast("Không còn văn bản quan trọng nào cần tóm tắt. Văn bản khác bấm Tóm tắt ở từng dòng."); return; }
    dangChay = true;
    let xong = 0;
    for (const [so, kieu] of can) { if (await chay(so, kieu)) xong++; await new Promise((r) => setTimeout(r, 800)); }
    dangChay = false;
    A.toast("Đã tóm tắt " + xong + "/" + can.length + " văn bản.");
    window.dispatchEvent(new Event("blv-tomtat"));   // cập nhật note, mail
  }
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-ai]"); if (b) chay(b.dataset.ai, b.dataset.kieu); });
  $("#aiTatCa") && $("#aiTatCa").addEventListener("click", () => tomTatTatCa(false));

  function veHuongDan() {
    const n = $("#aiNcc").value, c = NCC[n];
    $("#aiHuongDan").innerHTML = `Tạo mã tại <a href="${c.taoKhoa}" target="_blank" rel="noopener">${c.taoKhoa.replace("https://", "")}</a>, chép rồi dán vào ô dưới. Mã chỉ lưu trên trình duyệt máy này.`;
    $("#aiKhoa").placeholder = c.mau; $("#aiKhoa").value = khoa(n); $("#aiModel").value = model(n);
    $("#aiLuuY").textContent = n === "claude"
      ? "Claude API tính phí theo lượt dùng (nạp tiền trước trên Claude Console), tách riêng với gói Claude Pro trên claude.ai. Mô hình Haiku rẻ, đủ cho tóm tắt."
      : "Gói miễn phí của Gemini có thể được Google dùng nội dung gửi lên để cải thiện sản phẩm.";
  }
  function moCai() { $("#aiNcc").value = ncc(); $("#aiTuDong").checked = tuDong(); veHuongDan(); $("#aiStatus").textContent = ""; $("#dlgAi").hidden = false; }
  $("#aiNcc").addEventListener("change", veHuongDan);
  $("#aiCai") && $("#aiCai").addEventListener("click", moCai);
  $("#aiLuu").addEventListener("click", () => {
    const n = $("#aiNcc").value;
    save("blv-ai-ncc", n);
    ls.set("blv-ai-khoa-" + n, $("#aiKhoa").value.trim());
    save("blv-ai-model-" + n, $("#aiModel").value.trim() === NCC[n].model ? "" : $("#aiModel").value.trim());
    save("blv-ai-tudong", $("#aiTuDong").checked);
    $("#aiStatus").textContent = "Đã lưu."; ve();
  });
  $("#aiXoa").addEventListener("click", () => { ls.set("blv-ai-khoa-" + $("#aiNcc").value, ""); $("#aiKhoa").value = ""; $("#aiStatus").textContent = "Đã xóa mã khỏi máy này."; ve(); });
  $("#dlgAi").addEventListener("click", (e) => { if (e.target.id === "dlgAi" || e.target.closest("[data-close]")) $("#dlgAi").hidden = true; });

  // Quét xong (dữ liệu mới về) thì vẽ lại, và tự tóm tắt nếu bật
  window.addEventListener("blv-capnhat", () => { ve(); if (tuDong() && khoa()) tomTatTatCa(true); });
  ve();

  window.BLV_AI = { layTomTat, tomTat };
})();
