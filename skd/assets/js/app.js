/* app.js — menyambungkan rute ke tampilan, lalu jalankan. */
(function () {
  'use strict';

  Router.add('/', function (el) {
    ViewHome.render(el);
  });

  Router.add('/materi', function (el) {
    ViewMateri.daftar(el);
  });

  Router.add('/materi/:subtes', function (el, params) {
    ViewMateri.isi(el, params.subtes);
  });

  Router.add('/tryout', function (el) {
    ViewTryout.render(el);
  });

  Router.start();
})();
