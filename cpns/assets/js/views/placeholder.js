/* views/placeholder.js — halaman "segera" untuk alat yang belum dibangun.
   Satu view untuk bank soal, bank materi, kamus, dan SKB sampai
   masing-masing punya view sendiri. */
var ViewPlaceholder = (function () {
  'use strict';

  var token = 0;

  function render(el, examId, modulId, judul, desc) {
    var my = ++token;
    Nav.render(examId, null);

    Exam.find(examId).then(function (meta) {
      if (my !== token) return;
      if (!meta) {
        Nav.render(null);
        el.innerHTML =
          '<div class="empty"><strong>Tidak dikenal</strong>' +
          'Tidak ada <code>' + UI.esc(examId) + '</code>. ' +
          '<a href="#/">Lihat daftar</a>.</div>';
        return;
      }
      Exam.remember(examId);
      UI.judul((judul || modulId) + ' ' + (meta.title || examId));

      el.innerHTML =
        '<a class="back" href="#/' + encodeURIComponent(examId) + '">' +
          '← ' + UI.esc(meta.title || examId) + '</a>' +
        '<div class="view-head">' +
          '<span class="eyebrow">' + UI.esc(meta.title || examId) + '</span>' +
          '<h1>' + UI.esc(judul || modulId) + '</h1>' +
          (desc ? '<p>' + UI.esc(desc) + '</p>' : '') +
        '</div>' +
        '<div class="empty"><strong>Segera</strong>' +
        'Alat ini dibuka bertahap setelah SKD stabil.</div>';
    }).catch(function (err) {
      if (my !== token) return;
      el.innerHTML = UI.errorBox(err, 'halaman ini');
    });

    return function () { token++; };
  }

  return { render: render };
})();
