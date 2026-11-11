/* views/tryout.js — daftar paket dari manifest ujian.
   Paket yang ditandai aktif wajib punya berkas; tanpa itu, tampil sebagai terkunci. */
var ViewTryout = (function () {
  'use strict';

  var EXAM = 'cpns';

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

    UI.loadJSON('data/' + EXAM + '/manifest.json')
      .then(function (data) {
        var packs = data.paket || [];
        var siap = packs.filter(function (p) { return p.aktif; });

        var list = siap.length
          ? '<div class="list">' + siap.map(function (p) {
              return '<div class="row is-dim">' +
                '<span class="row-title">' + UI.esc(p.title) +
                  ' <span class="tag is-next">Segera</span></span>' +
                '<span class="row-sub">' + (p.jumlah || '—') + ' soal · ' +
                  (p.durasi || 100) + ' menit</span>' +
              '</div>';
            }).join('') + '</div>'
          : '<div class="empty"><strong>Belum ada paket soal</strong>' +
            'Paket ditambahkan setelah soalnya benar-benar siap.</div>';

        var menunggu = packs.length - siap.length;
        var catatan = menunggu > 0
          ? '<p class="note">' + menunggu + ' paket masih disiapkan.</p>'
          : '';

        var riwayat = attempts.length
          ? '<div class="view-head" style="margin-top:var(--s5);border-bottom:0;padding-bottom:0">' +
              '<span class="eyebrow">Riwayat</span>' +
            '</div>' +
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
          '</div>' + list + catatan + riwayat;
      })
      .catch(function (err) {
        el.innerHTML = UI.errorBox(err, 'daftar paket soal');
      });

    return 'tryout';
  }

  return { render: render };
})();
