/* views/exams.js — daftar ujian. Halaman pertama aplikasi. */
var ViewExams = (function () {
  'use strict';

  var token = 0;

  function render(el) {
    var my = ++token;
    Nav.render(null);

    el.innerHTML =
      '<div class="view-head">' +
        '<span class="eyebrow">Latihan</span>' +
        '<h1>Pilih ujian</h1>' +
        '<p>Materi ringkas dan tryout dengan timer. Semua progres tersimpan ' +
        'di perangkat ini — tanpa akun, tanpa server.</p>' +
      '</div>' +
      '<p class="muted">Memuat daftar ujian…</p>';

    Exam.list()
      .then(function (exams) {
        if (my !== token) return;

        if (!exams.length) {
          el.innerHTML =
            '<div class="view-head"><span class="eyebrow">Latihan</span>' +
            '<h1>Pilih ujian</h1></div>' +
            '<div class="empty"><strong>Belum ada ujian</strong>' +
            'Tambahkan entri pertama di <code>data/exams.json</code>.</div>';
          return;
        }

        var aktif = exams.filter(function (e) { return e.status === 'aktif'; });
        var segera = exams.filter(function (e) { return e.status !== 'aktif'; });

        var rows = aktif.map(function (e) {
          return '<a class="row" href="#/' + encodeURIComponent(e.id) + '">' +
            '<span class="row-title">' + UI.esc(e.title) +
              (e.subtitle ? ' <span class="tag">' + UI.esc(e.subtitle) + '</span>' : '') +
            '</span>' +
            '<span class="row-sub">' + UI.esc(e.desc || '') + '</span>' +
            '<span class="row-go" aria-hidden="true">→</span>' +
          '</a>';
        }).concat(segera.map(function (e) {
          return '<div class="row is-dim">' +
            '<span class="row-title">' + UI.esc(e.title) +
              ' <span class="tag is-next">Segera</span></span>' +
            '<span class="row-sub">' + UI.esc(e.desc || '') + '</span>' +
          '</div>';
        })).join('');

        el.innerHTML =
          '<div class="view-head">' +
            '<span class="eyebrow">Latihan · ' + exams.length + ' ujian</span>' +
            '<h1>Pilih ujian</h1>' +
            '<p>Materi ringkas dan tryout dengan timer. Semua progres tersimpan ' +
            'di perangkat ini — tanpa akun, tanpa server.</p>' +
          '</div>' +
          '<div class="list">' + rows + '</div>' +
          '<p class="note">Data tidak dikirim ke mana pun. Menghapus data browser ' +
          'berarti menghapus progres dan riwayat di perangkat ini.</p>';
      })
      .catch(function (err) {
        if (my !== token) return;
        el.innerHTML = UI.errorBox(err, 'daftar ujian');
      });

    return function () { token++; };
  }

  return { render: render };
})();
