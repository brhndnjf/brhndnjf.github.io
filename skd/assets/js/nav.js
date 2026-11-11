/* nav.js — tab atas mengikuti ujian yang sedang dibuka.
   Tanpa ujian (halaman daftar ujian), tab disembunyikan: tidak ada
   bagian aplikasi yang bisa dituju tanpa konteks ujian. */
var Nav = (function () {
  'use strict';

  function render(examId, section) {
    var el = document.getElementById('tabs');
    if (!el) return;

    if (!examId) {
      el.innerHTML = '';
      el.hidden = true;
      return;
    }

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

  return { render: render };
})();
