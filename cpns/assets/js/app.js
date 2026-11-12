/* app.js — menyambungkan rute ke tampilan, lalu jalankan.
   Rute lama (#/materi, #/tryout) diarahkan ke CPNS supaya tautan
   yang sudah beredar tidak berakhir di halaman kosong. */
(function () {
  'use strict';

  function modulSegera(el, params, fallback) {
    return Exam.manifest(params.exam)
      .then(function (man) {
        var m = (man.modul || []).filter(function (x) {
          return x.id === (params.modul || fallback);
        })[0];
        ViewPlaceholder.render(el, params.exam, m ? m.id : fallback,
          m ? m.title : fallback, m ? m.desc : '');
      })
      .catch(function (err) {
        el.innerHTML = UI.errorBox(err, 'halaman ini');
      });
  }

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
  Router.add('/:exam/bank-soal', function (el, params) {
    params.modul = 'bank-soal';
    modulSegera(el, params);
  });
  Router.add('/:exam/bank-soal/:topik', function (el, params) {
    params.modul = 'bank-soal';
    modulSegera(el, params);
  });
  Router.add('/:exam/bank-materi', function (el, params) {
    params.modul = 'bank-materi';
    modulSegera(el, params);
  });
  Router.add('/:exam/kamus', function (el, params) {
    params.modul = 'kamus';
    modulSegera(el, params);
  });
  Router.add('/:exam/skb', function (el, params) {
    params.modul = 'skb';
    modulSegera(el, params);
  });

  Router.start();
})();
