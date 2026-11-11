/* ui.js — pembantu kecil: escape, ambil JSON, format angka.
   Tidak ada framework, tidak ada dependensi. */
var UI = (function () {
  'use strict';

  /* Escape teks sebelum dimasukkan ke innerHTML.
     Semua teks dari JSON wajib lewat sini — JSON bisa saja berisi <script>. */
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* Ambil JSON sekali, simpan di memori selama halaman terbuka.
     Gagal jaringan tidak di-cache, supaya percobaan berikutnya bisa berhasil. */
  var cache = Object.create(null);

  function loadJSON(path) {
    if (cache[path]) return cache[path];
    var promise = fetch(path, { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' untuk ' + path);
        return res.json();
      })
      .then(function (data) {
        cache[path] = Promise.resolve(data);
        return data;
      })
      .catch(function (err) {
        delete cache[path];
        throw err;
      });
    cache[path] = promise;
    return promise;
  }

  function fmt(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /* Pesan galat yang jujur, bukan "Terjadi kesalahan". */
  function errorBox(err, what) {
    return '<div class="empty">' +
      '<strong>Gagal memuat ' + esc(what) + '</strong>' +
      'Berkas datanya tidak ditemukan atau tidak bisa dibaca. ' +
      'Kalau Anda membuka berkas ini langsung dari disk, jalankan server lokal dulu.<br>' +
      '<small class="muted">' + esc(err && err.message ? err.message : '') + '</small>' +
      '</div>';
  }

  return { esc: esc, loadJSON: loadJSON, fmt: fmt, errorBox: errorBox };
})();
