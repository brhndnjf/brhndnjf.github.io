/* views/tryout.js — daftar paket soal.
   Mesin ujian penuh menyusul; sekarang hanya daftar dan riwayat. */
var ViewTryout = (function () {
  'use strict';

  function render(el) {
    var attempts = Store.getAttempts();

    el.innerHTML =
      '<div class="view-head">' +
        '<span class="eyebrow">Tryout</span>' +
        '<h1>Uji dengan waktu</h1>' +
        '<p>110 soal, 100 menit, skor keluar langsung. Timer berjalan di ' +
        'browser — jangan tutup tab di tengah ujian.</p>' +
      '</div>' +
      '<p class="muted">Memuat paket…</p>';

    UI.loadJSON('data/soal/index.json')
      .then(function (data) {
        var packs = (data.packs || []).filter(function (p) { return p.aktif; });

        var list = packs.length
          ? '<div class="list">' + packs.map(function (p) {
              return '<div class="row is-dim">' +
                '<span class="row-title">' + UI.esc(p.title) +
                  ' <span class="tag is-next">Segera</span></span>' +
                '<span class="row-sub">' + (p.jumlah || '—') + ' soal · ' +
                  (p.durasi || 100) + ' menit</span>' +
              '</div>';
            }).join('') + '</div>'
          : '<div class="empty"><strong>Belum ada paket soal</strong>' +
            'Paket ditambahkan setelah soalnya benar-benar siap.</div>';

        var riwayat = attempts.length
          ? '<h2 style="margin-top:40px;font-size:13px;font-family:var(--mono);' +
            'letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)">Riwayat</h2>' +
            '<div class="list">' + attempts.map(function (a) {
              return '<div class="row is-dim">' +
                '<span class="row-title">' + UI.esc(a.paket || 'Paket') + '</span>' +
                '<span class="row-sub">' + UI.esc(a.tanggal || '') + ' · ' +
                  UI.fmt(a.total) + ' / ' + UI.fmt(a.maks) + '</span>' +
                '<span class="row-go">' + (a.lulus ? '✓' : '·') + '</span>' +
              '</div>';
            }).join('') + '</div>'
          : '';

        el.innerHTML =
          '<div class="view-head">' +
            '<span class="eyebrow">Tryout</span>' +
            '<h1>Uji dengan waktu</h1>' +
            '<p>110 soal, 100 menit, skor keluar langsung. Timer berjalan di ' +
            'browser — jangan tutup tab di tengah ujian.</p>' +
          '</div>' + list + riwayat;
      })
      .catch(function (err) {
        el.innerHTML = UI.errorBox(err, 'daftar paket soal');
      });

    return 'tryout';
  }

  return { render: render };
})();
