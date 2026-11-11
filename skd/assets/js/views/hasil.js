/* views/hasil.js — skor akhir dan pembahasan satu percobaan ujian. */
var ViewHasil = (function () {
  'use strict';

  var token = 0;

  function render(el, examId, attemptId) {
    var my = ++token;
    Nav.render(examId, 'tryout');

    var attempt = Store.getAttempts(examId).filter(function (a) {
      return a.id === attemptId;
    })[0];

    if (!attempt) {
      el.innerHTML =
        '<a class="back" href="#/' + encodeURIComponent(examId) + '/tryout">' +
          '← Semua paket</a>' +
        '<div class="empty"><strong>Hasil tidak ditemukan</strong>' +
        'Riwayat ini tidak ada di perangkat ini, atau sudah terhapus.</div>';
      return function () { token++; };
    }

    if (!attempt.paket || !attempt.answers) {
      el.innerHTML = ringkas(examId, attempt) +
        '<p class="note">Pembahasan tidak tersedia untuk hasil ini.</p>';
      return function () { token++; };
    }

    el.innerHTML =
      '<a class="back" href="#/' + encodeURIComponent(examId) + '/tryout">' +
        '← Semua paket</a>' +
      '<p class="muted">Memuat pembahasan…</p>';

    Exam.paket(examId, attempt.paket)
      .then(function (hasil) {
        if (my !== token) return;
        var pack = hasil.pack;
        var manifest = hasil.manifest;
        var meta = hasil.meta;
        var skor = Score.hitung(manifest.scoring, pack.sections, attempt.answers);
        var rincian = Score.perSoal(manifest.scoring, pack.sections, attempt.answers);
        var nama = {};

        (manifest.subtes || []).forEach(function (s) { nama[s.id] = s.nama || s.id; });

        var contoh = (attempt.jenis || pack.jenis || 'penuh') === 'contoh';
        var berubah = attempt.sidik && Sesi.sidik(pack) !== attempt.sidik;

        el.innerHTML =
          '<a class="back" href="#/' + encodeURIComponent(examId) + '/tryout">' +
            '← Semua paket</a>' +
          '<div class="view-head">' +
            '<span class="eyebrow">' + UI.esc(manifest.title || examId) + ' · ' +
              UI.esc(pack.title || meta.title) + '</span>' +
            '<h1>Hasil</h1>' +
            '<p class="hasil-meta">' + UI.esc(attempt.tanggal || UI.tanggal(attempt.selesai)) +
              ' · ' + UI.jam((attempt.detik || 0) * 1000) + ' pengerjaan' +
              (attempt.auto ? ' · waktu habis' : '') + '</p>' +
          '</div>' +

          '<div class="skor-hero">' +
            '<span class="skor-besar">' + UI.fmt(skor.total) + '</span>' +
            '<span class="skor-dari">/ ' + UI.fmt(skor.maks) + '</span>' +
          '</div>' +

          statusHTML(contoh, skor) +
          '<div class="skor-list">' +
            Object.keys(skor.detail).map(function (k) {
              return skorRow(k, nama[k] || k.toUpperCase(), skor.detail[k], contoh);
            }).join('') +
          '</div>' +
          '<p class="note">' + (contoh
            ? 'Paket contoh: ambang kelulusan tidak berlaku. Skor ini hanya ' +
              'untuk menguji mesin ujian.'
            : 'Angka ambang kelulusan dapat berubah. Verifikasi dari pengumuman ' +
              'resmi sebelum menyimpulkan hasil.') + '</p>' +

          (berubah ? '<p class="note">Isi paket soal telah berubah sejak hasil ini ' +
            'dibuat. Pembahasan mengikuti versi terbaru, dipetakan lewat id soal.</p>' : '') +

          '<div class="view-head review-head">' +
            '<span class="eyebrow">Pembahasan · ' + rincian.length + ' soal</span>' +
          '</div>' +
          filterHTML(rincian) +
          '<div class="review-list" id="review-list">' +
            rincian.map(function (item) {
              return reviewHTML(item, nama[item.subtest] || item.subtest);
            }).join('') +
          '</div>' +

          '<div class="hasil-actions">' +
            (meta.aktif
              ? '<a class="btn" href="#/' + encodeURIComponent(examId) + '/tryout/' +
                encodeURIComponent(pack.id) + '">Ulangi paket</a>'
              : '') +
            '<a class="btn is-quiet" href="#/' + encodeURIComponent(examId) +
              '/tryout">Semua paket</a>' +
          '</div>';

        bindFilter(el);
      })
      .catch(function (err) {
        if (my !== token) return;
        el.innerHTML =
          '<a class="back" href="#/' + encodeURIComponent(examId) + '/tryout">' +
            '← Semua paket</a>' +
          UI.errorBox(err, 'pembahasan');
      });

    return function () { token++; };
  }

  function statusHTML(contoh, skor) {
    if (contoh) {
      return '<p class="status-line is-netral">Skor latihan, bukan simulasi penuh.</p>';
    }
    if (skor.lulus) {
      return '<p class="status-line is-ok">Memenuhi ambang semua subtes.</p>';
    }
    return '<p class="status-line is-no">Belum memenuhi ambang semua subtes.</p>';
  }

  function skorRow(id, nama, d, contoh) {
    var pct = d.max ? Math.max(0, Math.min(100, Math.round(d.skor / d.max * 100))) : 0;
    var info = d.mode === 'weighted'
      ? d.dijawab + ' dijawab · ' + d.kosong + ' kosong'
      : d.benar + ' benar · ' + d.salah + ' salah · ' + d.kosong + ' kosong';

    return '<div class="skor">' +
      '<span class="skor-nama">' + UI.esc(nama) + '</span>' +
      '<span class="skor-num">' + UI.fmt(d.skor) +
        ' <small>/ ' + UI.fmt(d.max) + '</small></span>' +
      '<div class="skor-bar" aria-hidden="true"><span style="width:' + pct + '%"></span></div>' +
      '<span class="skor-note">' + UI.esc(info) +
        (!contoh && typeof d.threshold === 'number'
          ? ' · ambang ' + UI.fmt(d.threshold) : '') + '</span>' +
    '</div>';
  }

  function filterHTML(rincian) {
    var salah = rincian.filter(function (x) { return x.status === 'salah'; }).length;
    var kosong = rincian.filter(function (x) { return x.status === 'kosong'; }).length;
    if (!salah && !kosong) return '';

    return '<div class="review-filter" role="group" aria-label="Saring pembahasan">' +
      '<button type="button" data-filter="all" aria-pressed="true">Semua ' +
        rincian.length + '</button>' +
      (salah ? '<button type="button" data-filter="salah" aria-pressed="false">Salah ' +
        salah + '</button>' : '') +
      (kosong ? '<button type="button" data-filter="kosong" aria-pressed="false">Kosong ' +
        kosong + '</button>' : '') +
    '</div>';
  }

  function reviewHTML(item, nama) {
    var label = {
      benar: 'Benar',
      salah: 'Salah',
      kosong: 'Kosong',
      bobot: 'Bobot ' + item.skor
    }[item.status];
    var kelas = {
      benar: 'is-ok',
      salah: 'is-no',
      kosong: 'is-empty',
      bobot: 'is-bobot'
    }[item.status];

    var opts = (item.opts || []).map(function (o, i) {
      var teks = typeof o === 'string' ? o : o.t;
      var cls = 'review-opt';
      var tanda = [];

      if (item.mode === 'weighted') {
        if (item.pick === i) {
          cls += ' is-pick';
          tanda.push('Jawaban Anda');
        }
      } else {
        if (i === item.key) {
          cls += ' is-key';
          tanda.push('Kunci');
        }
        if (item.pick === i) {
          cls += ' is-pick';
          if (i !== item.key) cls += ' is-wrong';
          tanda.push('Jawaban Anda');
        }
      }

      return '<li class="' + cls + '">' +
        '<span class="review-letter">' + String.fromCharCode(65 + i) + '</span>' +
        '<span class="review-text">' + UI.esc(teks) + '</span>' +
        (tanda.length ? '<span class="review-tag">' + tanda.join(' · ') + '</span>' : '') +
        (item.mode === 'weighted'
          ? '<span class="opt-score">' + (o.score || 0) + '</span>' : '') +
      '</li>';
    }).join('');

    return '<details class="review" data-status="' + item.status + '">' +
      '<summary>' +
        '<span class="review-no">' + (item.no < 10 ? '0' : '') + item.no + '</span>' +
        '<span class="review-sub">' + UI.esc(nama) + '</span>' +
        '<span class="review-status ' + kelas + '">' + label + '</span>' +
      '</summary>' +
      '<div class="review-body">' +
        '<p class="soal-q">' + UI.esc(item.q) + '</p>' +
        '<ul class="review-opts">' + opts + '</ul>' +
        '<p class="quiz-why">' + (item.why
          ? UI.esc(item.why)
          : 'Pembahasan belum ditulis untuk soal ini.') + '</p>' +
      '</div>' +
    '</details>';
  }

  function bindFilter(el) {
    var buttons = el.querySelectorAll('[data-filter]');
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter');
        buttons.forEach(function (x) {
          x.setAttribute('aria-pressed', String(x === b));
        });
        el.querySelectorAll('.review').forEach(function (d) {
          d.hidden = f !== 'all' && d.getAttribute('data-status') !== f;
        });
      });
    });
  }

  function ringkas(examId, attempt) {
    return '<a class="back" href="#/' + encodeURIComponent(examId) + '/tryout">' +
        '← Semua paket</a>' +
      '<div class="view-head">' +
        '<span class="eyebrow">' + UI.esc(examId) + '</span>' +
        '<h1>Hasil</h1>' +
        '<p class="hasil-meta">' + UI.esc(attempt.tanggal || '') + '</p>' +
      '</div>' +
      '<div class="skor-hero">' +
        '<span class="skor-besar">' + UI.fmt(attempt.total || 0) + '</span>' +
        '<span class="skor-dari">/ ' + UI.fmt(attempt.maks || 0) + '</span>' +
      '</div>';
  }

  return { render: render };
})();
