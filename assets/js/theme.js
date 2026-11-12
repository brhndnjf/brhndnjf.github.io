/* theme.js — mode terang/gelap untuk beranda dan aplikasi.
   Urutan keputusan: pilihan pengguna (localStorage), lalu jam setempat.
   Malam 18.00–05.59 memakai tema gelap; siang 06.00–17.59 tema terang.
   Zona waktu dibaca dari Intl, bukan dari server. Atribut data-theme
   sudah dipasang lebih awal oleh skrip kecil di <head> agar tidak berkedip. */
var Tema = (function () {
  'use strict';

  var KEY = 'brh.theme';
  var root = document.documentElement;
  var jadwalTimer = null;

  function simpan(mode) {
    try { localStorage.setItem(KEY, mode); } catch (e) {}
  }

  function lupakan() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  function terbaca() {
    try {
      var t = localStorage.getItem(KEY);
      if (t === 'dark' || t === 'light') return t;
    } catch (e) {}
    return null;
  }

  /* Jam lokal perangkat. 18.00–05.59 dianggap malam. */
  function modeUntuk(jam) {
    return (jam >= 18 || jam < 6) ? 'dark' : 'light';
  }

  function otomatis() {
    return modeUntuk(new Date().getHours());
  }

  function pilihan() {
    return terbaca() || otomatis();
  }

  function zona() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (e) {
      return '';
    }
  }

  function jamLokal() {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit', minute: '2-digit', hour12: false
      }).format(new Date());
    } catch (e) {
      var d = new Date();
      return (d.getHours() < 10 ? '0' : '') + d.getHours() + '.' +
        (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    }
  }

  function apply(mode) {
    if (mode === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }

  /* Warna chrome browser mengikuti tema yang sedang dipakai, bukan
     preferensi sistem, begitu pengguna memilih sendiri. */
  function meta(mode) {
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      if (i === 0) {
        metas[i].removeAttribute('media');
        metas[i].setAttribute('content', mode === 'dark' ? '#1C1917' : '#FAFAF9');
      } else {
        metas[i].parentNode.removeChild(metas[i]);
      }
    }
  }

  function label(tombol, mode) {
    tombol.setAttribute('aria-pressed', String(mode === 'dark'));
    tombol.setAttribute('aria-label',
      mode === 'dark' ? 'Tema gelap aktif. Ganti ke tema terang' :
        'Tema terang aktif. Ganti ke tema gelap');
  }

  /* Petunjuk kecil di samping tombol: sumber tema dan jamnya. */
  function hint(mode) {
    var teks = document.querySelectorAll('[data-theme-state]');
    var waktu = document.querySelectorAll('[data-theme-time]');
    var auto = document.querySelectorAll('[data-theme-auto]');
    var manual = !!terbaca();
    var z = zona();

    Array.prototype.forEach.call(teks, function (el) {
      el.textContent = manual ? 'Tema manual' : 'Tema otomatis';
    });

    Array.prototype.forEach.call(waktu, function (el) {
      el.textContent = manual ? '' : jamLokal();
    });

    Array.prototype.forEach.call(auto, function (el) {
      el.hidden = !manual;
    });

    var ket = document.querySelectorAll('[data-theme-hint]');
    Array.prototype.forEach.call(ket, function (el) {
      el.setAttribute('title', manual
        ? 'Tema dipilih sendiri. Klik "Ikuti jam" untuk kembali otomatis.'
        : 'Tema mengikuti jam setempat' + (z ? ' (' + z + ')' : '') +
          '. Klik tombol untuk memilih sendiri.');
    });
  }

  /* Saat tema otomatis, pasang timer ke batas berikutnya (06.00/18.00)
     supaya tab yang dibiarkan terbuka ikut berganti. */
  function jadwal(tombol) {
    if (jadwalTimer) {
      clearTimeout(jadwalTimer);
      jadwalTimer = null;
    }
    if (terbaca()) return;

    var now = new Date();
    var next = new Date(now.getTime());
    var h = now.getHours();

    if (h < 6) next.setHours(6, 0, 0, 0);
    else if (h < 18) next.setHours(18, 0, 0, 0);
    else {
      next.setDate(next.getDate() + 1);
      next.setHours(6, 0, 0, 0);
    }

    var ms = Math.max(1000, next.getTime() - now.getTime());
    jadwalTimer = setTimeout(function () {
      if (terbaca()) return;
      var mode = otomatis();
      apply(mode);
      meta(mode);
      if (tombol) label(tombol, mode);
      hint(mode);
      jadwal(tombol);
    }, ms);
  }

  function init() {
    var tombol = document.querySelector('[data-theme-toggle]');
    var mode = pilihan();

    /* Skrip di <head> sudah memasang atribut lebih awal; ini menjaga
       hasil yang sama bila penyimpanan diblokir. */
    apply(mode);
    meta(mode);
    if (tombol) label(tombol, mode);
    hint(mode);
    jadwal(tombol);

    if (!tombol) return;

    tombol.addEventListener('click', function () {
      mode = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(mode);
      simpan(mode);
      meta(mode);
      label(tombol, mode);
      hint(mode);
      jadwal(tombol);
    });

    document.querySelectorAll('[data-theme-auto]').forEach(function (b) {
      b.addEventListener('click', function () {
        lupakan();
        mode = otomatis();
        apply(mode);
        meta(mode);
        label(tombol, mode);
        hint(mode);
        jadwal(tombol);
        tombol.focus();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { apply: apply, init: init, modeUntuk: modeUntuk, otomatis: otomatis };
})();
