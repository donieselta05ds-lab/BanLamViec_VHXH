/* Dữ liệu người dùng tự thêm: báo cáo, lịch, hướng xử lý văn bản.
 * Lưu trên trình duyệt (localStorage). Dùng Sao lưu để xuất ra tệp .json. */
(function () {
  "use strict";
  const { load, save } = window.BLV;
  const KEY = "blv-user";
  const empty = () => ({ baoCao: [], lich: [], xuLy: {}, done: [] });

  let data = load(KEY, null);
  if (!data) {
    // chuyển dữ liệu từ bản cũ (nếu có)
    data = empty();
    data.lich = load("blv-tasks", []).map((t) => Object.assign({ loai: "viec" }, t));
    data.done = load("blv-done", []);
  }
  data = Object.assign(empty(), data);
  const persist = () => save(KEY, data);

  window.STORE = {
    get: () => data,
    addBaoCao(bc) { data.baoCao = data.baoCao.filter((b) => b.id !== bc.id).concat(bc); persist(); },
    removeBaoCao(id) { data.baoCao = data.baoCao.filter((b) => b.id !== id); persist(); },
    addLich(ev) { data.lich.push(ev); persist(); },
    removeLich(id) { data.lich = data.lich.filter((e) => e.id !== id); persist(); },
    setXuLy(so, x) { data.xuLy[so] = x; persist(); },
    clearXuLy(so) { delete data.xuLy[so]; data.lich = data.lich.filter((e) => e.tuVanBan !== so); persist(); },
    isDone: (id) => data.done.includes(id),
    toggleDone(id, on) { data.done = on ? [...new Set([...data.done, id])] : data.done.filter((x) => x !== id); persist(); },
    setQlvb(q) { data.qlvb = q; persist(); },
    clearQlvb() { delete data.qlvb; persist(); },
    exportJSON: () => JSON.stringify(Object.assign({ phienBan: 1, xuatLuc: new Date().toISOString() }, data), null, 1),
    importJSON(text) {
      const o = JSON.parse(text);
      if (!o || typeof o !== "object" || !Array.isArray(o.lich)) throw new Error("Tệp không đúng định dạng sao lưu");
      data = Object.assign(empty(), { baoCao: o.baoCao || [], lich: o.lich || [], xuLy: o.xuLy || {}, done: o.done || [] }, o.qlvb ? { qlvb: o.qlvb } : {});
      persist();
    },
  };
})();
