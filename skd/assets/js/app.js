/* app.js — menyambungkan rute ke tampilan, lalu jalankan.
   Rute lama (#/materi, #/tryout) diarahkan ke CPNS supaya tautan
   yang sudah beredar tidak berakhir di halaman kosong. */
(function () {
  'use strict';

  Router.add('/materi', function () {
    Router.go('cpns/materi');
  });
  Router.add('/materi/:subtes', function (el, params) {
    Router.go('cpns/materi/' + encodeURIComponent(params.subtes));
  });
  Router.add('/tryout', function () {
    Router.go('cpns/tryout');
  });

  Router.add('/', function (el) {
    ViewExams.render(el);
  });

  Router.add('/:exam', function (el, params) {
    ViewExam.render(el, params.exam);
  });
  Router.add('/:exam/materi', function (el, params) {
    ViewMateri.daftar(el, params.exam);
  });
  Router.add('/:exam/materi/:subtes', function (el, params) {
    ViewMateri.isi(el, params.exam, params.subtes);
  });
  Router.add('/:exam/tryout', function (el, params) {
    ViewTryout.render(el, params.exam);
  });
  Router.add('/:exam/tryout/:paket', function (el, params) {
    ViewUjian.render(el, params.exam, params.paket);
  });
  Router.add('/:exam/hasil/:attempt', function (el, params) {
    ViewHasil.render(el, params.exam, params.attempt);
  });

  Router.start();
})();
