/* views/tryout.js — daftar paket dan riwayat untuk satu ujian.
   Paket aktif membuka sesi ujian; sesi yang belum selesai ditandai
   supaya pengguna bisa melanjutkan, bukan memulai dari nol. */
var ViewTryout = (function () {
  'use strict';

  var token = 0;

  function render(el, examId) {
    var my = ++token;
    Nav.render(examId, 'tryout');

    el.innerHTML = '<p class="muted">Memuat paket…</p>';

    Exam.manifest(examId)
      .then(function (man) {
        if (my !== token) return;
        Exam.remember(examId);
        UI.judul('Tryout ' + (man.title || examId));

        var packs = man.paket || [];
        var siap = packs.filter(function (p) { return p.aktif; });
        var sessions = Store.getSessions();
        var attempts = Store.getAttempts(examId);

        var rows = siap.map(function (p) {
          var sesi = sessions[Sesi.key(examId, p.id)];
          var tag = p.jenis === 'contoh' ? '<span class="tag">Contoh</span>' : '';
          var status = '';

          if (sesi) {
            var sisa = Sesi.sisa(sesi);
            if (sisa > 0) {
              tag += ' <span class="tag is-live">Lanjutkan</span>';
              status = ' · sisa ' + UI.menit(sisa);
            } else {
              tag += ' <span class="tag is-next">Waktu habis</span>';
              status = ' · buka untuk menyimpan hasil';
            }
          }

          return '<a class="row" href="#/' + encodeURIComponent(examId) +
              '/tryout/' + encodeURIComponent(p.id) + '">' +
            '<span class="row-title">' + UI.esc(p.title) + ' ' + tag + '</span>' +
            '<span class="row-sub">' + (p.jumlah || '—') + ' soal · ' +
              (p.durasi || 100) + ' menit' + UI.esc(status) + '</span>' +
            '<span class="row-go" aria-hidden="true">→</span>' +
          '</a>';
        }).join('');

        var menunggu = packs.filter(function (p) { return !p.aktif; }).map(function (p) {
          return '<div class="row is-dim">' +
            '<span class="row-title">' + UI.esc(p.title) +
              ' <span class="tag is-next">Segera</span></span>' +
            '<span class="row-sub">' + (p.jumlah || '—') + ' soal · ' +
              (p.durasi || 100) + ' menit</span>' +
          '</div>';
        }).join('');

        var daftar = rows + menunggu;
        if (!daftar) {
          daftar = '<div class="empty"><strong>Belum ada paket soal</strong>' +
            'Paket ditambahkan setelah soalnya benar-benar siap.</div>';
        }

        el.innerHTML =
          '<div class="view-head">' +
            '<span class="eyebrow">Tryout · ' + UI.esc(man.title || examId) + '</span>' +
            '<h1>Uji dengan waktu</h1>' +
            '<p>Kerjakan paket, lalu lihat skor dan pembahasan. Timer berjalan ' +
            'di browser — jangan tutup tab di tengah ujian.</p>' +
          '</div>' +
          '<div class="list">' + daftar + '</div>' +
          (siap.some(function (p) { return p.jenis === 'contoh'; })
            ? '<p class="note">Paket bertanda Contoh adalah paket pendek untuk ' +
              'menguji mesin ujian. Ambang kelulusan hanya berlaku untuk simulasi penuh.</p>'
            : '') +
          riwayatHTML(examId, attempts);
      })
      .catch(function (err) {
        if (my !== token) return;
        el.innerHTML =
          '<a class="back" href="#/">← Daftar ujian</a>' +
          UI.errorBox(err, 'daftar paket soal');
      });

    return function () { token++; };
  }

  function riwayatHTML(examId, attempts) {
    if (!attempts.length) return '';

    var tampil = attempts.slice(0, 10);
    var rows = tampil.map(function (a) {
      var judul = a.paketTitle || a.paket || 'Paket';
      var isi =
        '<span class="row-title">' + UI.esc(judul) + '</span>' +
        '<span class="row-sub">' + UI.esc(a.tanggal || UI.tanggal(a.selesai)) +
          ' · ' + UI.fmt(a.total || 0) + ' / ' + UI.fmt(a.maks || 0) + '</span>' +
        '<span class="row-go">' +
          (a.jenis !== 'contoh' && a.lulus ? '✓' : '·') + '</span>';

      if (a.id && a.answers) {
        return '<a class="row" href="#/' + encodeURIComponent(examId) +
          '/hasil/' + encodeURIComponent(a.id) + '">' + isi + '</a>';
      }
      return '<div class="row is-dim">' + isi + '</div>';
    }).join('');

    return '<div class="view-head review-head">' +
        '<span class="eyebrow">Riwayat · ' + attempts.length + '</span>' +
      '</div>' +
      '<div class="list">' + rows + '</div>' +
      (attempts.length > tampil.length
        ? '<p class="note">Menampilkan ' + tampil.length + ' terbaru dari ' +
          attempts.length + ' percobaan.</p>'
        : '');
  }

  return { render: render };
})();
