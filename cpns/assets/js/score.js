/* score.js — aturan penilaian, dibaca dari manifest ujian.
   ============================================================
   PENTING: ambang kelulusan ada di manifest (scoring.subtes.*.threshold).
   Angka bawaan untuk CPNS (TWK 65, TIU 80, TKP 156) belum diverifikasi
   dan dapat berubah. Periksa pengumuman resmi sebelum memakainya
   untuk menilai kelulusan. Bila berbeda, ubah HANYA di manifest.
   ============================================================ */
var Score = (function () {
  'use strict';

  function kosongDetail(cfg) {
    var detail = {};
    Object.keys(cfg.subtes).forEach(function (id) {
      var s = cfg.subtes[id];
      detail[id] = {
        mode: s.mode,
        benar: 0,
        salah: 0,
        kosong: 0,
        dijawab: 0,
        skor: 0,
        max: 0,
        threshold: s.threshold
      };
    });
    return detail;
  }

  function bobotMaks(q) {
    var maks = 0;
    (q.opts || []).forEach(function (o) {
      if (o && typeof o.score === 'number' && o.score > maks) maks = o.score;
    });
    return maks;
  }

  /* answers: { "id-soal": index opsi terpilih }
     Kunci memakai id soal, bukan urutan, supaya jawaban tetap cocok
     walau urutan soal di berkas berubah. */
  function hitung(cfg, sections, answers) {
    var detail = kosongDetail(cfg);

    sections.forEach(function (sec) {
      var d = detail[sec.subtest];
      if (!d) return;

      sec.questions.forEach(function (q) {
        var pick = answers[q.id];

        if (d.mode === 'weighted') {
          d.max += bobotMaks(q);
          if (pick == null || !q.opts[pick]) {
            d.kosong++;
            return;
          }
          d.dijawab++;
          var bobot = q.opts[pick].score;
          d.skor += typeof bobot === 'number' ? bobot : 0;
        } else {
          d.max += cfg.poinBenar;
          if (pick == null) {
            d.kosong++;
          } else {
            d.dijawab++;
            if (pick === q.key) {
              d.benar++;
              d.skor += cfg.poinBenar;
            } else {
              d.salah++;
            }
          }
        }
      });
    });

    var total = 0;
    var maks = 0;
    Object.keys(detail).forEach(function (k) {
      total += detail[k].skor;
      maks += detail[k].max;
    });

    var lulus = Object.keys(detail).every(function (k) {
      return typeof detail[k].threshold !== 'number' ||
        detail[k].skor >= detail[k].threshold;
    });

    return {
      detail: detail,
      total: total,
      maks: maks,
      thresholds: (function () {
        var t = {};
        Object.keys(detail).forEach(function (k) { t[k] = detail[k].threshold; });
        return t;
      })(),
      lulus: lulus
    };
  }

  /* Rincian per soal untuk halaman pembahasan. */
  function perSoal(cfg, sections, answers) {
    var out = [];
    var no = 0;

    sections.forEach(function (sec) {
      var s = cfg.subtes[sec.subtest];
      if (!s) return;

      sec.questions.forEach(function (q) {
        no++;
        var pick = answers[q.id];
        var item = {
          no: no,
          id: q.id,
          subtest: sec.subtest,
          topik: q.topik || '',
          q: q.q,
          opts: q.opts,
          pick: pick == null ? null : pick,
          key: q.key,
          why: q.why || '',
          mode: s.mode,
          skor: 0,
          maks: 0,
          status: 'kosong'
        };

        if (s.mode === 'weighted') {
          item.maks = bobotMaks(q);
          if (pick != null && q.opts[pick]) {
            item.status = 'bobot';
            item.skor = q.opts[pick].score || 0;
          }
        } else {
          item.maks = cfg.poinBenar;
          if (pick == null) item.status = 'kosong';
          else if (pick === q.key) {
            item.status = 'benar';
            item.skor = cfg.poinBenar;
          } else {
            item.status = 'salah';
          }
        }

        out.push(item);
      });
    });

    return out;
  }

  return {
    hitung: hitung,
    perSoal: perSoal
  };
})();
