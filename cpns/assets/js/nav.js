/* nav.js — navigasi aplikasi mengikuti produk yang sedang dibuka.
   Tanpa produk (halaman daftar), nav dan progres disembunyikan.
   Nav selalu punya "Ujian" (indeks CPNS) + alat yang aktif. */
var Nav = (function () {
  'use strict';

  var ALAT = [
    { nav: 'materi', label: 'Materi', segmen: 'materi' },
    { nav: 'tryout', label: 'Tryout', segmen: 'tryout' },
    { nav: 'bank-soal', label: 'Bank Soal', segmen: 'bank-soal' },
    { nav: 'bank-materi', label: 'Bank Materi', segmen: 'bank-materi' },
    { nav: 'kamus', label: 'Kamus', segmen: 'kamus' }
  ];

  function segmenAktif() {
    var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    return parts[1] || '';
  }

  function render(examId, section) {
    var el = document.getElementById('tabs');
    var examEl = document.getElementById('side-exam');
    var prog = document.getElementById('side-progress');

    if (examEl) {
      examEl.textContent = examId ? String(examId).toUpperCase() : 'Latihan Ujian';
    }

    if (!examId) {
      if (el) { el.innerHTML = ''; el.hidden = true; }
      if (prog) { prog.innerHTML = ''; prog.hidden = true; }
      return;
    }

    if (el) {
      var e = encodeURIComponent(examId);
      var items = [{ nav: 'ujian', href: '#/' + e, label: 'Ujian' }].concat(
        ALAT.map(function (a) {
          return { nav: a.nav, href: '#/' + e + '/' + a.segmen, label: a.label };
        })
      );

      el.innerHTML = items.map(function (item) {
        return '<a href="' + item.href + '" data-nav="' + item.nav + '">' +
          UI.esc(item.label) + '</a>';
      }).join('');

      el.hidden = false;

      var aktif = section || (function () {
        var seg = segmenAktif();
        if (!seg) return 'ujian';
        for (var i = 0; i < ALAT.length; i++) {
          if (ALAT[i].segmen === seg) return ALAT[i].nav;
        }
        return '';
      })();

      el.querySelectorAll('[data-nav]').forEach(function (a) {
        if (aktif && a.getAttribute('data-nav') === aktif) {
          a.setAttribute('aria-current', 'page');
        }
      });
    }

    if (prog) {
      var pr = Store.countProgress(examId);
      var attempts = Store.getAttempts(examId).length;
      prog.innerHTML =
        '<span class="side-progress-label">Progres</span> ' +
        '<span>' + pr.paham + ' materi dipahami</span> ' +
        '<span>' + pr.ulang + ' perlu diulang</span> ' +
        (attempts ? '<span>' + attempts + ' riwayat tryout</span>' : '');
      prog.hidden = false;
    }
  }

  return { render: render };
})();
