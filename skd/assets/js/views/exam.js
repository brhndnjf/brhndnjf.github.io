/* views/exam.js — hub satu produk (CPNS).
   Tanpa perantara: Materi dan Tryout langsung di hub, tidak lewat
   halaman "SKD" dulu. Daftar alat berasal dari manifest.modul;
   menambah alat = menambah data. */
var ViewExam = (function () {
  'use strict';

  var token = 0;

  function rowAktif(examId, m, sub) {
    var baru = (m.id !== 'materi' && m.id !== 'tryout')
      ? ' <span class="tag is-live">Baru</span>'
      : '';
    return '<a class="row" href="#/' + encodeURIComponent(examId) +
        '/' + encodeURIComponent(m.id) + '">' +
      '<span class="row-title">' + UI.esc(m.title) + baru + '</span>' +
      '<span class="row-sub">' + UI.esc(sub || m.desc || '') + '</span>' +
      '<span class="row-go" aria-hidden="true">→</span>' +
    '</a>';
  }

  function rowSegera(m) {
    return '<div class="row is-dim">' +
      '<span class="row-title">' + UI.esc(m.title) +
        ' <span class="tag is-next">Segera</span></span>' +
      '<span class="row-sub">' + UI.esc(m.desc || '') + '</span>' +
    '</div>';
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
          var modul = man.modul || [];
          var paket = (man.paket || []).filter(function (p) { return p.aktif; });
          var pr = Store.countProgress(examId);
          var attempts = Store.getAttempts(examId);
          var last = attempts[0];

          function cari(id) {
            return modul.filter(function (m) { return m.id === id; })[0] || null;
          }

          var mMateri = cari('materi');
          var mTryout = cari('tryout');
          var lain = modul.filter(function (m) {
            return m.id !== 'materi' && m.id !== 'tryout';
          });

          var namaSubtes = subtes.map(function (s) { return s.nama || s.id; }).join(', ');
          var skor = last ? UI.fmt(last.total) : '—';

          var baris = '';
          if (mMateri && mMateri.status !== 'segera') {
            baris += rowAktif(examId, mMateri,
              (namaSubtes || 'TWK, TIU, TKP') + ' · ' + pr.paham + ' dipahami');
          } else if (mMateri) {
            baris += rowSegera(mMateri);
          }
          if (mTryout && mTryout.status !== 'segera') {
            baris += rowAktif(examId, mTryout,
              paket.length + ' paket · ' + attempts.length + ' riwayat');
          } else if (mTryout) {
            baris += rowSegera(mTryout);
          }
          baris += lain.map(function (m) {
            return m.status === 'segera' ? rowSegera(m) : rowAktif(examId, m);
          }).join('');

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

            '<div class="list">' + baris + '</div>' +

            '<p class="note">Materi ' + UI.esc(namaSubtes || 'TWK, TIU, TKP') +
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
