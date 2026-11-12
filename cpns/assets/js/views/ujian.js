/* views/ujian.js — mesin ujian: timer, navigasi soal, jawaban, submit.
   Sesi disimpan setiap kali jawaban berubah, jadi refresh tidak
   menghapus pekerjaan. Waktu dihitung dari batas waktu, bukan dari
   hitungan detik di tab — tab yang ditidurkan browser tidak merusak timer. */
var ViewUjian = (function () {
  'use strict';

  var token = 0;
  var tick = null;
  var selesai = false;

  function bersih() {
    token++;
    if (tick) { clearInterval(tick); tick = null; }
    selesai = false;
  }

  function render(el, examId, paketId) {
    bersih();
    var my = token;
    Nav.render(examId, 'tryout');

    el.innerHTML = '<p class="muted">Memuat paket…</p>';

    Exam.paket(examId, paketId)
      .then(function (hasil) {
        if (my !== token) return;
        var meta = hasil.meta;
        var pack = hasil.pack;
        var manifest = hasil.manifest;

        if (!meta.aktif) {
          el.innerHTML =
            '<a class="back" href="#/' + encodeURIComponent(examId) + '/tryout">' +
              '← Semua paket</a>' +
            '<div class="empty"><strong>Paket belum dibuka</strong>' +
            'Paket ini masih disiapkan. Coba paket yang sudah tersedia.</div>';
          return;
        }

        Exam.remember(examId);

        var sesi = Sesi.get(examId, paketId);
        if (sesi && !Sesi.cocok(sesi, pack)) {
          el.innerHTML =
            '<a class="back" href="#/' + encodeURIComponent(examId) + '/tryout">' +
              '← Semua paket</a>' +
            '<div class="empty"><strong>Sesi lama tidak cocok</strong>' +
            'Isi paket soal berubah sejak sesi itu dimulai, jadi jawaban lama ' +
            'tidak bisa dipetakan dengan aman.<br><button class="btn is-quiet" ' +
            'type="button" id="hapus-sesi">Hapus sesi lama</button></div>';
          var hapus = document.getElementById('hapus-sesi');
          if (hapus) hapus.addEventListener('click', function () {
            Sesi.hapus(examId, paketId);
            render(el, examId, paketId);
          });
          return;
        }

        if (sesi && Sesi.sisa(sesi) <= 0) {
          var hasilAkhir = Sesi.finalkan(sesi, pack, manifest, true);
          Router.go(examId + '/hasil/' + hasilAkhir.id);
          return;
        }

        if (sesi) mulaiTampilan(el, examId, meta, pack, manifest, sesi, my);
        else praMulai(el, examId, meta, pack, manifest, my);
      })
      .catch(function (err) {
        if (my !== token) return;
        el.innerHTML =
          '<a class="back" href="#/' + encodeURIComponent(examId) + '/tryout">' +
            '← Semua paket</a>' +
          UI.errorBox(err, 'paket soal');
      });

    return bersih;
  }

  /* ---------- Layar sebelum mulai ---------- */
  function praMulai(el, examId, meta, pack, manifest, my) {
    var soal = Sesi.daftarSoal(pack);
    var durasi = pack.durasi || meta.durasi || 100;
    UI.judul(pack.title || meta.title);
    var nama = {};

    (manifest.subtes || []).forEach(function (s) { nama[s.id] = s.nama || s.id; });
    (pack.sections || []).forEach(function (sec) {
      if (!nama[sec.subtest]) nama[sec.subtest] = sec.subtest;
    });

    el.innerHTML =
      '<a class="back" href="#/' + encodeURIComponent(examId) + '/tryout">' +
        '← Semua paket</a>' +
      '<div class="view-head">' +
        '<span class="eyebrow">' + UI.esc(manifest.title || examId) +
          ' · ' + (pack.jenis === 'contoh' ? 'Paket contoh' : 'Tryout') + '</span>' +
        '<h1>' + UI.esc(pack.title || meta.title) + '</h1>' +
        '<p>' + (pack.jenis === 'contoh'
          ? 'Paket pendek untuk mencoba mesin ujian. Bukan simulasi penuh, ' +
            'jadi ambang kelulusan tidak berlaku.'
          : 'Simulasi dengan timer. Skor keluar setelah dikumpulkan.') + '</p>' +
      '</div>' +
      '<div class="stats">' +
        '<div class="stat"><b>' + soal.length + '</b><span>soal</span></div>' +
        '<div class="stat"><b>' + durasi + '</b><span>menit</span></div>' +
        '<div class="stat"><b>' + (pack.sections || []).length + '</b><span>subtes</span></div>' +
      '</div>' +
      '<div class="card">' +
        '<h2>Sebelum mulai</h2>' +
        '<ul class="bullet">' +
          '<li>Timer berjalan sejak tombol mulai ditekan dan tidak bisa dijeda.</li>' +
          (Store.available
            ? '<li>Jawaban tersimpan otomatis. Menutup tab tidak menghapus sesi.</li>'
            : '<li>Penyimpanan browser diblokir, jadi jawaban tidak akan tersimpan.</li>') +
          '<li>Bila waktu habis, jawaban yang sudah dipilih tetap dinilai.</li>' +
          '<li>Navigasi soal bisa dibuka kapan saja untuk melompat.</li>' +
        '</ul>' +
      '</div>' +
      '<div class="start-actions">' +
        '<button class="btn" type="button" id="mulai">Mulai ujian</button>' +
      '</div>' +
      '<p class="note">' + (Store.available
        ? 'Semua jawaban hanya tersimpan di perangkat ini.'
        : 'Penyimpanan browser diblokir — jawaban dan progres tidak akan tersimpan.') + '</p>';

    var mulai = document.getElementById('mulai');
    if (mulai) mulai.addEventListener('click', function () {
      if (my !== token) return;
      var sesi = Sesi.buat(examId, meta, pack);
      Sesi.simpan(sesi);
      mulaiTampilan(el, examId, meta, pack, manifest, sesi, my);
    });
  }

  /* ---------- Layar ujian ---------- */
  function mulaiTampilan(el, examId, meta, pack, manifest, sesi, my) {
    var soal = Sesi.daftarSoal(pack);
    var nama = {};
    UI.judul(pack.title || meta.title);
    (manifest.subtes || []).forEach(function (s) { nama[s.id] = s.nama || s.id; });

    var pos = Number(sesi.posisi) || 0;
    if (pos < 0 || pos >= soal.length) pos = 0;

    el.innerHTML =
      '<div class="ujian-layout">' +
        '<div class="ujian-head">' +
          '<div class="ujian-top" tabindex="-1">' +
            '<div class="ujian-title">' +
              '<span class="eyebrow">' + UI.esc(manifest.title || examId) + '</span>' +
              '<strong>' + UI.esc(pack.title || meta.title) + '</strong>' +
            '</div>' +
            '<div class="ujian-clock">' +
              '<button class="btn is-quiet btn-flag" type="button" id="flag" ' +
                'aria-pressed="false">Ragu-ragu</button>' +
              '<div class="timer" id="timer" role="timer" aria-label="Sisa waktu">—</div>' +
            '</div>' +
          '</div>' +
          '<div class="ujian-line">' +
            '<span id="progress"></span>' +
            '<span id="terjawab" class="muted"></span>' +
          '</div>' +
        '</div>' +
        '<aside class="ujian-side">' +
          '<details class="nav-wrap">' +
            '<summary>Navigasi soal</summary>' +
            '<div class="nav-grid" id="navgrid"></div>' +
            '<p class="nav-note">Angka penuh berarti sudah dijawab. Tanda · berarti ragu-ragu.</p>' +
          '</details>' +
        '</aside>' +
        '<div class="ujian-body">' +
          '<div id="soal"></div>' +
          '<div class="ujian-actions">' +
            '<button class="btn is-quiet" type="button" id="prev">← Sebelumnya</button>' +
            '<button class="btn" type="button" id="next">Berikutnya →</button>' +
          '</div>' +
          '<div class="ujian-foot">' +
            '<button class="btn is-quiet" type="button" id="finish">Selesaikan ujian</button>' +
            '<span class="note">' + (Store.available
              ? 'Jawaban tersimpan otomatis.'
              : 'Penyimpanan diblokir — jawaban tidak akan tersimpan.') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<p class="sr-only" id="status-ujian" role="status" aria-live="polite"></p>' +
      '<dialog class="modal" id="dialog-selesai" aria-labelledby="judul-selesai">' +
        '<div class="modal-body">' +
          '<h3 id="judul-selesai">Selesaikan ujian?</h3>' +
          '<p id="ringkas-selesai"></p>' +
          '<div class="modal-actions">' +
            '<button class="btn is-quiet" type="button" id="batal-selesai">Kembali</button>' +
            '<button class="btn" type="button" id="kumpul">Kumpulkan</button>' +
          '</div>' +
        '</div>' +
      '</dialog>';

    var navWrap = el.querySelector('.nav-wrap');
    if (navWrap && window.matchMedia('(min-width: 1100px)').matches) {
      navWrap.open = true;
    }

    selesai = false;

    function simpan() {
      sesi.posisi = pos;
      Sesi.simpan(sesi);
    }

    function gambar() {
      var item = soal[pos];
      var q = item.q;
      var pick = sesi.answers[q.id];
      var ragu = !!sesi.flags[q.id];
      var opts = q.opts || [];

      var html =
        '<div class="soal-meta">' +
          '<span class="tag">' + UI.esc(nama[item.subtest] || item.subtest) + '</span>' +
          '<span class="muted">Soal ' + (pos + 1) + ' dari ' + soal.length + '</span>' +
        '</div>' +
        '<p class="soal-q" id="soal-q" tabindex="-1">' + UI.esc(q.q) + '</p>' +
        '<div class="soal-opts">' +
        opts.map(function (o, i) {
          var teks = typeof o === 'string' ? o : o.t;
          return '<button class="soal-opt' + (pick === i ? ' is-pick' : '') +
            '" type="button" data-pick="' + i + '" aria-pressed="' +
            (pick === i ? 'true' : 'false') + '">' +
            '<span class="opt-letter">' + String.fromCharCode(65 + i) + '</span>' +
            '<span>' + UI.esc(teks) + '</span>' +
          '</button>';
        }).join('') +
        '</div>';

      var zona = document.getElementById('soal');
      if (zona) zona.innerHTML = html;

      var prev = document.getElementById('prev');
      var next = document.getElementById('next');
      var flag = document.getElementById('flag');
      if (prev) prev.disabled = pos === 0;
      if (next) next.disabled = pos === soal.length - 1;
      if (flag) {
        flag.setAttribute('aria-pressed', ragu ? 'true' : 'false');
        flag.textContent = ragu ? 'Ditandai ragu' : 'Ragu-ragu';
      }

      var progress = document.getElementById('progress');
      if (progress) progress.textContent = 'Soal ' + (pos + 1) + ' / ' + soal.length;
      var terjawab = document.getElementById('terjawab');
      if (terjawab) terjawab.textContent = Sesi.dijawab(sesi) + ' dijawab';

      gambarNav();
      bindSoal();
    }

    function gambarNav() {
      var grid = document.getElementById('navgrid');
      if (!grid) return;
      grid.innerHTML = soal.map(function (item, i) {
        var dijawab = sesi.answers[item.q.id] != null;
        var ragu = !!sesi.flags[item.q.id];
        var kelas = 'nav-dot';
        if (dijawab) kelas += ' is-answered';
        if (ragu) kelas += ' is-flag';
        if (i === pos) kelas += ' is-current';
        return '<button class="' + kelas + '" type="button" data-nav="' + i +
          '" aria-label="Soal ' + (i + 1) + (dijawab ? ', sudah dijawab' : '') +
          (ragu ? ', ragu-ragu' : '') + '"' +
          (i === pos ? ' aria-current="true"' : '') + '>' + (i + 1) + '</button>';
      }).join('');
      grid.querySelectorAll('[data-nav]').forEach(function (b) {
        b.addEventListener('click', function () {
          pos = Number(b.getAttribute('data-nav'));
          simpan();
          gambar();
          var q = document.getElementById('soal-q');
          if (q) q.focus();
        });
      });
    }

    function bindSoal() {
      document.querySelectorAll('[data-pick]').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = Number(b.getAttribute('data-pick'));
          sesi.answers[soal[pos].q.id] = i;
          simpan();
          gambar();

          /* Opsi dirender ulang; kembalikan fokus ke pilihan yang sama
             supaya pengguna keyboard tidak kembali ke awal halaman. */
          var lagi = document.querySelector('[data-pick="' + i + '"]');
          if (lagi) lagi.focus();

          var status = document.getElementById('status-ujian');
          if (status) {
            status.textContent = 'Jawaban ' + String.fromCharCode(65 + i) +
              ' dipilih untuk soal ' + (pos + 1) + '.';
          }
        });
      });
    }

    function pindah(arah) {
      var baru = pos + arah;
      if (baru < 0 || baru >= soal.length) return;
      pos = baru;
      simpan();
      gambar();
      var q = document.getElementById('soal-q');
      if (q) q.focus();
    }

    function bukaDialog() {
      var d = document.getElementById('dialog-selesai');
      var ringkas = document.getElementById('ringkas-selesai');
      if (ringkas) {
        var kosong = soal.length - Sesi.dijawab(sesi);
        var ragu = Object.keys(sesi.flags).filter(function (k) {
          return sesi.flags[k];
        }).length;
        ringkas.textContent = Sesi.dijawab(sesi) + ' dari ' + soal.length +
          ' soal dijawab. ' + (kosong ? kosong + ' masih kosong. ' : '') +
          (ragu ? ragu + ' ditandai ragu-ragu. ' : '') +
          'Jawaban tidak bisa diubah setelah dikumpulkan.';
      }
      if (!d) return;
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    }

    function selesaikan(auto) {
      if (selesai) return;
      selesai = true;
      if (tick) { clearInterval(tick); tick = null; }
      var hasil = Sesi.finalkan(sesi, pack, manifest, auto);
      Router.go(examId + '/hasil/' + hasil.id);
    }

    function updateTimer() {
      var elTimer = document.getElementById('timer');
      if (!elTimer) return;
      var sisa = Sesi.sisa(sesi);
      elTimer.textContent = UI.jam(sisa);
      elTimer.classList.toggle('is-low', sisa <= 300000);
      if (sisa <= 0) selesaikan(true);
    }

    var prev = document.getElementById('prev');
    var next = document.getElementById('next');
    var flag = document.getElementById('flag');
    var finish = document.getElementById('finish');
    var batal = document.getElementById('batal-selesai');
    var kumpul = document.getElementById('kumpul');

    if (prev) prev.addEventListener('click', function () { pindah(-1); });
    if (next) next.addEventListener('click', function () { pindah(1); });
    if (flag) flag.addEventListener('click', function () {
      var id = soal[pos].q.id;
      if (sesi.flags[id]) delete sesi.flags[id];
      else sesi.flags[id] = true;
      simpan();
      gambar();
    });
    if (finish) finish.addEventListener('click', bukaDialog);
    if (batal) batal.addEventListener('click', function () {
      var d = document.getElementById('dialog-selesai');
      if (d && typeof d.close === 'function') d.close();
    });
    if (kumpul) kumpul.addEventListener('click', function () { selesaikan(false); });

    gambar();
    updateTimer();
    tick = setInterval(updateTimer, 1000);

    /* Mulai dari atas: timer dan awal soal harus terlihat, bukan posisi
       scroll layar pra-ujian yang lebih panjang. */
    window.scrollTo(0, 0);
    var qAwal = document.getElementById('soal-q');
    if (qAwal) qAwal.focus({ preventScroll: true });
  }

  return { render: render };
})();
