/* views/home.js — beranda aplikasi SKD. */
var ViewHome = (function () {
  'use strict';

  function render(el) {
    var pr = Store.countProgress();
    var attempts = Store.getAttempts();
    var last = attempts[0];

    el.innerHTML =
      '<div class="view-head">' +
        '<span class="eyebrow">Latihan SKD</span>' +
        '<h1>Belajar sedikit, tapi konsisten</h1>' +
        '<p>Materi ringkas per subtes dan tryout dengan timer. Semua progres ' +
        'tersimpan di perangkat ini — tanpa akun, tanpa server.</p>' +
      '</div>' +

      '<div class="stats">' +
        '<div class="stat"><b>' + pr.paham + '</b><span>materi dipahami</span></div>' +
        '<div class="stat"><b>' + pr.ulang + '</b><span>perlu diulang</span></div>' +
        '<div class="stat"><b>' + (last ? UI.fmt(last.total) : '—') + '</b><span>skor terakhir</span></div>' +
      '</div>' +

      '<div class="list">' +
        '<a class="row" href="#/materi">' +
          '<span class="row-title">Materi</span>' +
          '<span class="row-sub">TWK, TIU, dan TKP — ringkasan yang bisa dibaca ulang.</span>' +
          '<span class="row-go" aria-hidden="true">→</span>' +
        '</a>' +
        '<a class="row" href="#/tryout">' +
          '<span class="row-title">Tryout</span>' +
          '<span class="row-sub">Kerjakan paket soal, lihat skor dan pembahasan.</span>' +
          '<span class="row-go" aria-hidden="true">→</span>' +
        '</a>' +
      '</div>' +

      (Store.available ? '' :
        '<p class="note">Penyimpanan browser diblokir, jadi progres tidak akan tersimpan. ' +
        'Biasanya karena mode privat atau pengaturan situs.</p>');

    return 'home';
  }

  return { render: render };
})();
