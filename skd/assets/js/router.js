/* router.js — hash router untuk host statis.
   URL berbentuk #/cpns/materi/twk — tidak pernah dikirim ke server,
   jadi refresh di halaman mana pun selalu berhasil.

   Handler boleh mengembalikan fungsi pembersih. Fungsi itu dipanggil
   sebelum rute berganti, supaya timer dan listener tidak tertinggal. */
var Router = (function () {
  'use strict';

  var routes = [];
  var cleanup = null;

  function add(pattern, handler) {
    routes.push({
      parts: pattern.split('/').filter(Boolean),
      handler: handler
    });
  }

  function current() {
    var raw = location.hash.replace(/^#\/?/, '');
    if (!raw) return [];
    return raw.split('/').filter(Boolean);
  }

  function bersihkan() {
    if (typeof cleanup === 'function') {
      try { cleanup(); } catch (e) {}
    }
    cleanup = null;
  }

  function resolve() {
    var parts = current();
    var view = document.getElementById('view');

    bersihkan();

    for (var i = 0; i < routes.length; i++) {
      var r = routes[i];
      if (r.parts.length !== parts.length) continue;

      var params = {};
      var cocok = true;

      for (var j = 0; j < r.parts.length; j++) {
        var p = r.parts[j];
        if (p.charAt(0) === ':') {
          params[p.slice(1)] = decodeURIComponent(parts[j]);
        } else if (p !== parts[j]) {
          cocok = false;
          break;
        }
      }

      if (cocok) {
        try {
          var ret = r.handler(view, params);
          cleanup = typeof ret === 'function' ? ret : null;
        } catch (err) {
          view.innerHTML = UI.errorBox(err, 'halaman ini');
        }
        window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
        return;
      }
    }

    /* Tidak ada yang cocok */
    Nav.render(null);
    view.innerHTML =
      '<div class="empty"><strong>Halaman tidak ada</strong>' +
      'Alamat <code>#' + UI.esc(location.hash.replace(/^#/, '')) + '</code> tidak dikenal. ' +
      '<a href="#/">Kembali ke daftar ujian</a></div>';
  }

  function go(path) {
    var next = '#/' + String(path).replace(/^\/+/, '');
    if (location.hash === next) resolve();
    else location.hash = next;
  }

  function start() {
    window.addEventListener('hashchange', resolve);
    resolve();
  }

  return { add: add, go: go, start: start, resolve: resolve };
})();
