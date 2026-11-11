/* score.js — aturan penilaian SKD.
   ============================================================
   PENTING: angka di THRESHOLDS bukan kebenaran yang dijamin.
   Verifikasi sendiri dari pengumuman resmi MenPANRB/BKN sebelum
   dipakai untuk menilai kelulusan. Bila berbeda, ubah HANYA di sini.
   ============================================================ */
var Score = (function () {
  'use strict';

  var THRESHOLDS = {
    twk: 65,
    tiu: 80,
    tkp: 156
  };

  var MAX = {
    twk: 150,
    tiu: 175,
    tkp: 225
  };

  var POIN_BENAR = 5;

  function emptyDetail() {
    return {
      twk: { benar: 0, salah: 0, kosong: 0, skor: 0 },
      tiu: { benar: 0, salah: 0, kosong: 0, skor: 0 },
      tkp: { benar: 0, salah: 0, kosong: 0, skor: 0 }
    };
  }

  /* jawaban: { subtest, questions, answers }
     answers[i] = index opsi terpilih, atau null bila kosong */
  function hitung(sections, answers) {
    var detail = emptyDetail();
    var total = 0;

    sections.forEach(function (sec) {
      var d = detail[sec.subtest];
      if (!d) return;

      sec.questions.forEach(function (q, i) {
        var pick = answers[sec.subtest + ':' + i];

        if (sec.subtest === 'tkp') {
          /* TKP: setiap opsi punya bobot; tidak ada jawaban salah */
          if (pick == null) {
            d.kosong++;
            return;
          }
          var opt = q.opts[pick];
          var bobot = opt && typeof opt.score === 'number' ? opt.score : 0;
          d.skor += bobot;
          d.benar++;
        } else {
          if (pick == null) {
            d.kosong++;
          } else if (pick === q.key) {
            d.benar++;
            d.skor += POIN_BENAR;
          } else {
            d.salah++;
          }
        }
      });

      total += d.skor;
    });

    var lulusSemua = Object.keys(THRESHOLDS).every(function (k) {
      return detail[k].skor >= THRESHOLDS[k];
    });

    return {
      detail: detail,
      total: total,
      maks: MAX.twk + MAX.tiu + MAX.tkp,
      thresholds: THRESHOLDS,
      lulus: lulusSemua
    };
  }

  /* Untuk satu subtes saja, mis. kuis mini */
  function hitungSatu(subtest, questions, picks) {
    return hitung(
      [{ subtest: subtest, questions: questions }],
      picks.reduce(function (acc, p, i) {
        acc[subtest + ':' + i] = p;
        return acc;
      }, {})
    );
  }

  return {
    THRESHOLDS: THRESHOLDS,
    MAX: MAX,
    hitung: hitung,
    hitungSatu: hitungSatu
  };
})();
