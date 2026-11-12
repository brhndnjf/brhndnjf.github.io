/* views/exam.js — ringkasan satu ujian sebelum masuk ke materi/tryout. */
var ViewExam = (function () {
  'use strict';

  var token = 0;

  function render(el, examId) {
    var my = ++token;
    Nav.render(examId, null);

    el.innerHTML = '<p class="muted">Memuat ujian…</p>';

    Exam.find(examId)
      .then(function (meta) {
        if (my !== token) return null;

        if (!meta) {
          Nav.render(null);
          el.innerHTML =
            '<div class="empty"><strong>Ujian tidak dikenal</strong>' +
            'Tidak ada ujian <code>' + UI.esc(examId) + '</code>. ' +
            '<a href="#/">Lihat daftar ujian</a>.</div>';
          return null;
        }

        if (meta.status !== 'aktif') {
          el.innerHTML =
            '<a class="back" href="#/">← Daftar ujian</a>' +
            '<div class="empty"><strong>Ujian belum dibuka</strong>' +
            UI.esc(meta.title) + ' belum tersedia. Kembali ke daftar ujian.</div>';
          return null;
        }

        return Exam.manifest(examId).then(function (man) {
          if (my !== token) return;
          Exam.remember(examId);
          UI.judul(meta.title || examId);

          var subtes = man.subtes || [];
          var paket = man.paket || [];
          var siap = paket.filter(function (p) { return p.aktif; });
          var pr = Store.countProgress(examId);
          var attempts = Store.getAttempts(examId);
          var last = attempts[0];

          var namaSubtes = subtes.map(function (s) { return s.nama || s.id; }).join(', ');
          var ringkasPaket = siap.length
            ? siap.length + ' paket siap dikerjakan'
            : 'Paket soal sedang disiapkan';

          el.innerHTML =
            '<div class="view-head">' +
              '<span class="eyebrow">' + UI.esc(meta.subtitle || 'Ujian') + '</span>' +
              '<h1>' + UI.esc(meta.title) + '</h1>' +
              (meta.desc ? '<p>' + UI.esc(meta.desc) + '</p>' : '') +
            '</div>' +

            '<div class="stats">' +
              '<div class="stat"><b>' + pr.paham + '</b><span>materi dipahami</span></div>' +
              '<div class="stat"><b>' + pr.ulang + '</b><span>perlu diulang</span></div>' +
              '<div class="stat"><b>' + (last ? UI.fmt(last.total) : '—') + '</b>' +
                '<span>skor terakhir</span></div>' +
            '</div>' +

            '<div class="list">' +
              '<a class="row" href="#/' + encodeURIComponent(examId) + '/materi">' +
                '<span class="row-title">Materi</span>' +
                '<span class="row-sub">' + UI.esc(namaSubtes || 'Belum ada subtes') +
                  (subtes.length ? ' — ' + subtes.length + ' subtes' : '') + '</span>' +
                '<span class="row-go" aria-hidden="true">→</span>' +
              '</a>' +
              '<a class="row" href="#/' + encodeURIComponent(examId) + '/tryout">' +
                '<span class="row-title">Tryout</span>' +
                '<span class="row-sub">' + UI.esc(ringkasPaket) + '</span>' +
                '<span class="row-go" aria-hidden="true">→</span>' +
              '</a>' +
            '</div>' +

            (Store.available ? '' :
              '<p class="note">Penyimpanan browser diblokir, jadi progres tidak akan ' +
              'tersimpan. Biasanya karena mode privat atau pengaturan situs.</p>');
        });
      })
      .catch(function (err) {
        if (my !== token) return;
        el.innerHTML =
          '<a class="back" href="#/">← Daftar ujian</a>' +
          UI.errorBox(err, 'ujian ini');
      });

    return function () { token++; };
  }

  return { render: render };
})();
