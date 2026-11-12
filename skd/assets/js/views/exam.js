/* views/exam.js — halaman utama satu produk (CPNS).
   Menampilkan lima alat belajar: SKD yang aktif, sisanya "segera".
   Daftar alat berasal dari manifest.modul; menambah alat = menambah data. */
var ViewExam = (function () {
  'use strict';

  var token = 0;

  function modulRows(examId, modul) {
    return modul.map(function (m) {
      var aktif = m.status !== 'segera';
      var tag = aktif && m.id !== 'skd'
        ? ' <span class="tag is-live">Baru</span>'
        : (!aktif ? ' <span class="tag is-next">Segera</span>' : '');
      var dalam = '<span class="row-title">' + UI.esc(m.title) + tag + '</span>' +
        '<span class="row-sub">' + UI.esc(m.desc || '') + '</span>' +
        (aktif ? '<span class="row-go" aria-hidden="true">→</span>' : '');

      if (!aktif) return '<div class="row is-dim">' + dalam + '</div>';

      var href = m.id === 'skd'
        ? '#/' + encodeURIComponent(examId) + '/materi'
        : '#/' + encodeURIComponent(examId) + '/' + encodeURIComponent(m.id);
      return '<a class="row" href="' + href + '">' + dalam + '</a>';
    }).join('');
  }

  function render(el, examId) {
    var my = ++token;
    Nav.render(examId, 'ujian');

    el.innerHTML = '<p class="muted">Memuat…</p>';

    Exam.find(examId)
      .then(function (meta) {
        if (my !== token) return null;

        if (!meta) {
          Nav.render(null);
          el.innerHTML =
            '<div class="empty"><strong>Tidak dikenal</strong>' +
            'Tidak ada <code>' + UI.esc(examId) + '</code>. ' +
            '<a href="#/">Lihat daftar</a>.</div>';
          return null;
        }

        if (meta.status !== 'aktif') {
          el.innerHTML =
            '<a class="back" href="#/">← Daftar</a>' +
            '<div class="empty"><strong>Belum dibuka</strong>' +
            UI.esc(meta.title) + ' belum tersedia. Kembali ke daftar.</div>';
          return null;
        }

        return Exam.manifest(examId).then(function (man) {
          if (my !== token) return;
          Exam.remember(examId);
          UI.judul(meta.title || examId);

          var subtes = man.subtes || [];
          var paket = (man.paket || []).filter(function (p) { return p.aktif; });
          var pr = Store.countProgress(examId);
          var attempts = Store.getAttempts(examId);
          var last = attempts[0];

          var namaSubtes = subtes.map(function (s) { return s.nama || s.id; }).join(', ');
          var skor = last ? UI.fmt(last.total) : '—';

          el.innerHTML =
            '<div class="view-head">' +
              '<span class="eyebrow">' + UI.esc(meta.title || examId) + ' · ' +
                'Pilih alat belajar</span>' +
              '<h1>' + UI.esc(meta.title) + '</h1>' +
              (meta.desc ? '<p>' + UI.esc(meta.desc) + '</p>' : '') +
            '</div>' +

            '<div class="stats">' +
              '<div class="stat"><b>' + pr.paham + '</b><span>materi dipahami</span></div>' +
              '<div class="stat"><b>' + (last ? attempts.length : 0) + '</b><span>tryout selesai</span></div>' +
              '<div class="stat"><b>' + skor + '</b><span>skor terakhir</span></div>' +
            '</div>' +

            '<div class="list">' + modulRows(examId, man.modul || []) + '</div>' +

            '<p class="note">SKD berisi materi ' + UI.esc(namaSubtes || 'TWK, TIU, TKP') +
              ' dan ' + (paket.length ? paket.length + ' paket tryout' : 'tryout berwaktu') +
              '. Bank soal, bank materi, kamus, dan SKB dibuka bertahap.</p>' +

            (Store.available ? '' :
              '<p class="note">Penyimpanan browser diblokir, jadi progres tidak akan ' +
              'tersimpan. Biasanya karena mode privat atau pengaturan situs.</p>');
        });
      })
      .catch(function (err) {
        if (my !== token) return;
        el.innerHTML =
          '<a class="back" href="#/">← Daftar</a>' +
          UI.errorBox(err, 'halaman ini');
      });

    return function () { token++; };
  }

  return { render: render };
})();
