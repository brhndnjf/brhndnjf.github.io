/* theme.js — mode terang/gelap untuk beranda dan aplikasi.
   Dipakai bersama supaya status tombol, warna chrome browser, dan
   pilihan tersimpan selalu sinkron. Atribut data-theme sendiri sudah
   dipasang lebih awal oleh skrip kecil di <head> agar tidak berkedip. */
var Tema = (function () {
  'use strict';

  var KEY = 'brh.theme';
  var root = document.documentElement;

  function simpan(mode) {
    try { localStorage.setItem(KEY, mode); } catch (e) {}
  }

  function terbaca() {
    try {
      var t = localStorage.getItem(KEY);
      if (t === 'dark' || t === 'light') return t;
    } catch (e) {}
    return null;
  }

  /* Urutan: pilihan tersimpan, lalu preferensi sistem. */
  function pilihan() {
    return terbaca() ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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

  function init() {
    var tombol = document.querySelector('[data-theme-toggle]');
    var mode = pilihan();

    /* Skrip di <head> sudah memasang atribut lebih awal; ini menjaga
       hasil yang sama bila penyimpanan diblokir. */
    apply(mode);
    if (terbaca()) meta(mode);
    if (tombol) label(tombol, mode);
    if (!tombol) return;

    tombol.addEventListener('click', function () {
      mode = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(mode);
      simpan(mode);
      meta(mode);
      label(tombol, mode);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { apply: apply, init: init };
})();
