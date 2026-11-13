/* notes.js — penyaringan daftar catatan. Tanpa dependensi.
   Tanpa JavaScript, semua catatan tetap tampil karena HTML sudah statis. */
(function () {
  'use strict';

  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-note]'));
  var count = document.querySelector('[data-filter-count]');
  var empty = document.querySelector('[data-empty]');
  var tagNote = document.querySelector('[data-tag-note]');

  if (!cards.length) return;

  var params = new URLSearchParams(window.location.search);
  var tag = (params.get('tag') || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  var status = 'all';

  function apply() {
    var shown = 0;

    cards.forEach(function (card) {
      var okStatus = status === 'all' || card.getAttribute('data-status') === status;
      var tags = (card.getAttribute('data-tags') || '').split(/\s+/);
      var okTag = !tag || tags.indexOf(tag) !== -1;
      var show = okStatus && okTag;
      card.hidden = !show;
      if (show) shown += 1;
    });

    buttons.forEach(function (button) {
      button.setAttribute('aria-pressed',
        String(button.getAttribute('data-filter') === status));
    });

    if (count) count.textContent = shown + ' catatan';
    if (empty) empty.hidden = shown !== 0;

    if (tagNote) {
      tagNote.hidden = !tag;
      tagNote.textContent = '';
      if (tag) {
        var label = document.createElement('span');
        label.textContent = 'Topik: #' + tag + ' · ';
        var link = document.createElement('a');
        link.href = '/catatan/';
        link.textContent = 'Hapus saringan';
        tagNote.appendChild(label);
        tagNote.appendChild(link);
      }
    }
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      status = button.getAttribute('data-filter');
      apply();
    });
  });

  apply();
})();
