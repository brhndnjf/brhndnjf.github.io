/* hub.js — perilaku beranda. Tanpa dependensi. */
(function () {
  'use strict';

  /* ---------- Tahun di kaki ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Dialog QRIS ----------
     Gambar hanya dipasang bila <dialog> punya data-qris-src.
     Dengan begitu tidak ada permintaan 404 untuk berkas yang belum ada,
     dan tombolnya tidak menjanjikan sesuatu yang tidak bisa dibuka. */
  var openers = document.querySelectorAll('[data-open="qris"]');
  var modal = document.getElementById('qris');
  var src = modal ? modal.getAttribute('data-qris-src') : null;
  var note = document.querySelector('[data-qris-note]');

  function sembunyikan() {
    openers.forEach(function (btn) { btn.hidden = true; });
    if (note) note.hidden = true;
  }

  if (modal && src) {
    var slot = modal.querySelector('[data-qris-slot]');
    if (slot) {
      var img = document.createElement('img');
      img.src = src;
      img.alt = 'Kode QRIS untuk dukungan';
      img.width = 280;
      img.height = 280;
      img.addEventListener('error', function () {
        img.remove();
        sembunyikan();
        var fb = modal.querySelector('[data-qris-fallback]');
        if (fb) fb.hidden = false;
      });
      slot.appendChild(img);
    }
  } else {
    sembunyikan();
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
