/* views/materi.js — daftar subtes & isi materi.
   Semua jalur berkas berasal dari manifest ujian, bukan ditulis di kode.
   Menambah ujian baru tidak boleh memerlukan perubahan di berkas ini. */
var ViewMateri = (function () {
  'use strict';

  var EXAM = 'cpns';
  var manifestCache = null;

  function ambilManifest() {
    if (!manifestCache) {
      manifestCache = UI.loadJSON('data/' + EXAM + '/manifest.json').catch(function (err) {
        manifestCache = null; /* biar bisa dicoba lagi */
        throw err;
      });
    }
    return manifestCache;
  }

  function daftar(el) {
    el.innerHTML =
      '<div class="view-head">' +
        '<span class="eyebrow">Materi</span>' +
        '<h1>Pilih subtes</h1>' +
        '<p>Ringkasan yang bisa dibaca cepat, lalu ditandai sudah paham ' +
        'atau perlu diulang.</p>' +
      '</div>' +
      '<p class="muted">Memuat…</p>';

    ambilManifest()
      .then(function (data) {
        var subtes = data.subtes || [];
        el.innerHTML =
          '<div class="view-head">' +
            '<span class="eyebrow">Materi · ' + subtes.length + ' subtes</span>' +
            '<h1>Pilih subtes</h1>' +
            '<p>Ringkasan yang bisa dibaca cepat, lalu ditandai sudah paham ' +
            'atau perlu diulang.</p>' +
          '</div>' +
          '<div class="list">' +
          subtes.map(function (s) {
            return '<a class="row" href="#/materi/' + encodeURIComponent(s.id) + '">' +
              '<span class="row-title">' + UI.esc(s.penuh) + '</span>' +
              '<span class="row-sub">' + UI.esc(s.ringkas || '') + '</span>' +
              '<span class="row-go" aria-hidden="true">→</span>' +
            '</a>';
          }).join('') +
          '</div>';
      })
      .catch(function (err) {
        el.innerHTML = UI.errorBox(err, 'daftar subtes');
      });

    return 'materi';
  }

  function isi(el, subtesId) {
    el.innerHTML =
      '<a class="back" href="#/materi">← Semua subtes</a>' +
      '<p class="muted">Memuat materi…</p>';

    ambilManifest()
      .then(function (data) {
        var meta = (data.subtes || []).filter(function (s) { return s.id === subtesId; })[0];
        if (!meta) {
          el.innerHTML =
            '<a class="back" href="#/materi">← Semua subtes</a>' +
            '<div class="empty"><strong>Subtes tidak dikenal</strong>' +
            'Tidak ada subtes <code>' + UI.esc(subtesId) + '</code> di manifest.</div>';
          return;
        }
        return UI.loadJSON('data/' + meta.materi).then(function (materi) {
          render(el, meta, materi);
        });
      })
      .catch(function (err) {
        el.innerHTML =
          '<a class="back" href="#/materi">← Semua subtes</a>' +
          UI.errorBox(err, 'materi');
      });

    return 'materi';
  }

  function render(el, meta, data) {
    var items = data.items || [];

    if (!items.length) {
      el.innerHTML =
        '<a class="back" href="#/materi">← Semua subtes</a>' +
        '<div class="empty"><strong>Belum ada materi</strong>' +
        'Berkas <code>' + UI.esc(meta.materi) + '</code> masih kosong.</div>';
      return;
    }

    el.innerHTML =
      '<a class="back" href="#/materi">← Semua subtes</a>' +
      '<div class="view-head">' +
        '<span class="eyebrow">' + UI.esc(meta.nama) + ' · ' + items.length + ' materi</span>' +
        '<h1>' + UI.esc(data.title || meta.penuh) + '</h1>' +
        (data.goal ? '<p>' + UI.esc(data.goal) + '</p>' : '') +
      '</div>' +
      items.map(function (item) { return itemHTML(item); }).join('');

    bind(el, items);
  }

  function itemHTML(item) {
    var body = (item.sections || []).map(function (sec) {
      var h = sec.h ? '<h4>' + UI.esc(sec.h) + '</h4>' : '';
      var p = (sec.p || []).map(function (t) {
        return '<p>' + UI.esc(t) + '</p>';
      }).join('');
      var list = sec.list && sec.list.length
        ? '<ul>' + sec.list.map(function (t) {
            return '<li>' + UI.esc(t) + '</li>';
          }).join('') + '</ul>'
        : '';
      return h + p + list;
    }).join('');

    var memo = item.memo ? '<div class="memo">' + UI.esc(item.memo) + '</div>' : '';

    var quiz = '';
    if (item.quiz && item.quiz.length) {
      quiz = item.quiz.map(function (q, qi) {
        return '<div class="quiz" data-quiz="' + qi + '">' +
          '<p class="quiz-q">' + UI.esc(q.q) + '</p>' +
          q.opts.map(function (opt, oi) {
            return '<button class="opt" type="button" data-opt="' + oi + '">' +
              UI.esc(opt) + '</button>';
          }).join('') +
          '<p class="quiz-why" hidden></p>' +
        '</div>';
      }).join('');
    }

    return '<details class="acc" data-id="' + UI.esc(item.id) + '">' +
      '<summary>' + UI.esc(item.title || ('Materi ' + item.no)) +
        '<span class="tag" data-tag hidden></span></summary>' +
      '<div class="acc-body">' + body + memo + quiz +
        '<div class="mark" data-markgroup>' +
          '<span class="mark-label">Status</span>' +
          '<button type="button" data-mark="paham" aria-pressed="false">Sudah paham</button>' +
          '<button type="button" data-mark="ulang" aria-pressed="false">Perlu diulang</button>' +
        '</div>' +
      '</div>' +
    '</details>';
  }

  /* Kuis mini + penanda progres */
  function bind(el, items) {
    el.querySelectorAll('.quiz').forEach(function (quizEl) {
      var id = quizEl.closest('.acc').getAttribute('data-id');
      var item = items.filter(function (i) { return i.id === id; })[0];
      var qi = Number(quizEl.getAttribute('data-quiz'));
      var q = item.quiz[qi];

      quizEl.querySelectorAll('[data-opt]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quizEl.dataset.done === '1') return;
          quizEl.dataset.done = '1';

          var pick = Number(btn.getAttribute('data-opt'));
          quizEl.querySelectorAll('[data-opt]').forEach(function (b, i) {
            if (i === q.key) b.classList.add('is-ok');
            else if (i === pick) b.classList.add('is-no');
            b.disabled = true;
          });

          var why = quizEl.querySelector('.quiz-why');
          if (why) {
            why.textContent = q.why || '';
            why.hidden = !q.why;
          }
        });
      });
    });

    el.querySelectorAll('[data-markgroup]').forEach(function (group) {
      var acc = group.closest('.acc');
      var id = acc.getAttribute('data-id');
      var tagEl = acc.querySelector('[data-tag]');

      function paint(status) {
        group.querySelectorAll('[data-mark]').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b.getAttribute('data-mark') === status));
        });
        if (!tagEl) return;
        if (!status) {
          tagEl.hidden = true;
          tagEl.textContent = '';
          tagEl.className = 'tag';
          return;
        }
        tagEl.hidden = false;
        tagEl.textContent = status === 'paham' ? 'paham' : 'ulang';
        tagEl.className = 'tag ' + (status === 'paham' ? 'is-live' : 'is-next');
      }

      paint(Store.getProgress()[id] || '');

      group.querySelectorAll('[data-mark]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var val = btn.getAttribute('data-mark');
          var now = Store.getProgress()[id] || '';
          var next = now === val ? '' : val; /* klik ulang = batalkan */
          Store.setProgress(id, next);
          paint(next);
        });
      });
    });
  }

  return { daftar: daftar, isi: isi };
})();
