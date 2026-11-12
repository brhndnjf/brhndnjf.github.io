/* nav.js — navigasi aplikasi mengikuti ujian yang sedang dibuka.
   Di layar kecil, nav menjadi tab di bilah atas. Di desktop, nav
   menjadi rail vertikal bersama ringkasan progres. Tanpa ujian
   (halaman daftar ujian), nav dan progres disembunyikan. */
var Nav = (function () {
  'use strict';

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
      var items = [
        { nav: 'exams', href: '#/', label: 'Ujian' },
        { nav: 'materi', href: '#/' + e + '/materi', label: 'Materi' },
        { nav: 'tryout', href: '#/' + e + '/tryout', label: 'Tryout' }
      ];

      el.innerHTML = items.map(function (item) {
        return '<a href="' + item.href + '" data-nav="' + item.nav + '">' +
          UI.esc(item.label) + '</a>';
      }).join('');

      el.hidden = false;
      el.querySelectorAll('[data-nav]').forEach(function (a) {
        if (section && a.getAttribute('data-nav') === section) {
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
