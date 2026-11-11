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

  /* Tanggal ringkas untuk riwayat, mis. "11 Nov 2026". */
  function tanggal(ts) {
    var d = new Date(ts || Date.now());
    try {
      return d.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch (e) {
      return d.toISOString().slice(0, 10);
    }
  }

  /* Hitung mundur mm:ss. Menit boleh lebih dari 59 (mis. 100:00). */
  function jam(ms) {
    var total = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function menit(ms) {
    var m = Math.max(1, Math.round(ms / 60000));
    return m + ' menit';
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

  return {
    esc: esc,
    loadJSON: loadJSON,
    fmt: fmt,
    tanggal: tanggal,
    jam: jam,
    menit: menit,
    errorBox: errorBox
  };
})();
