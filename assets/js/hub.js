/* hub.js — perilaku beranda. Tanpa dependensi. */
(function () {
  'use strict';

  var THEME_KEY = 'brh.theme';
  var root = document.documentElement;

  /* ---------- Tema ---------- */
  function applyTheme(mode) {
    if (mode === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }

  function readTheme() {
    try {
      var saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) { /* localStorage diblokir: pakai preferensi sistem */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  applyTheme(readTheme());

  var toggle = document.querySelector('[data-theme-toggle]');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      toggle.setAttribute('aria-pressed', String(next === 'dark'));
    });
  }

  /* ---------- Tahun di kaki ---------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Dialog QRIS ---------- */
  var openers = document.querySelectorAll('[data-open="qris"]');
  var modal = document.getElementById('qris');

  /* Kalau berkas QRIS belum ada, jangan tampilkan tombol yang menjanjikan
     sesuatu yang tidak bisa dibuka. Lebih baik tombolnya hilang. */
  var qrisImg = document.querySelector('[data-qris-img]');
  if (qrisImg) {
    qrisImg.addEventListener('error', function () {
      qrisImg.hidden = true;
      openers.forEach(function (btn) { btn.hidden = true; });
      var fallback = document.querySelector('[data-qris-fallback]');
      if (fallback) fallback.hidden = false;
    });
    /* Memaksa pengecekan bila gambar sudah gagal dimuat sebelum skrip jalan */
    if (qrisImg.complete && qrisImg.naturalWidth === 0) {
      qrisImg.dispatchEvent(new Event('error'));
    }
  }

  if (modal && typeof modal.showModal === 'function') {
    openers.forEach(function (btn) {
      btn.addEventListener('click', function () { modal.showModal(); });
    });
    modal.addEventListener('click', function (e) {
      /* Tutup bila klik di area backdrop (di luar kotak dialog) */
      if (e.target === modal) modal.close();
    });
    var closer = modal.querySelector('[data-close]');
    if (closer) closer.addEventListener('click', function () { modal.close(); });
  } else if (modal) {
    /* Browser lama tanpa <dialog>: sembunyikan pemicu agar tidak jadi tautan mati */
    openers.forEach(function (btn) { btn.hidden = true; });
  }
})();
