/* sesi.js — satu sesi ujian yang sedang berjalan.
   Menyimpan jawaban, sisa waktu, dan posisi soal di localStorage
   lewat Store, supaya refresh atau pindah halaman tidak menghapus apa pun. */
var Sesi = (function () {
  'use strict';

  function key(examId, paketId) {
    return examId + '/' + paketId;
  }

  function daftarSoal(pack) {
    var out = [];
    (pack.sections || []).forEach(function (sec) {
      (sec.questions || []).forEach(function (q) {
        out.push({ subtest: sec.subtest, q: q });
      });
    });
    return out;
  }

  function ids(pack) {
    return daftarSoal(pack).map(function (s) { return s.q.id; });
  }

  /* Sidik ringkas isi paket. Dipakai untuk mendeteksi paket yang berubah
     setelah sesi atau hasil dibuat, tanpa menyimpan seluruh soal. */
  function sidik(pack) {
    var daftar = ids(pack);
    var h = 5381;
    daftar.forEach(function (id) {
      for (var i = 0; i < id.length; i++) {
        h = ((h << 5) + h + id.charCodeAt(i)) | 0;
      }
    });
    return daftar.length + '-' + (h >>> 0).toString(36);
  }

  function buat(examId, meta, pack) {
    var now = Date.now();
    var durasi = pack.durasi || meta.durasi || 100;
    return {
      v: 1,
      exam: examId,
      paket: pack.id || meta.id,
      judul: pack.title || meta.title,
      jenis: pack.jenis || meta.jenis || 'penuh',
      durasi: durasi,
      mulai: now,
      batas: now + durasi * 60000,
      posisi: 0,
      answers: {},
      flags: {},
      ids: ids(pack),
      sidik: sidik(pack)
    };
  }

  function get(examId, paketId) {
    return Store.getSession(key(examId, paketId));
  }

  function simpan(session) {
    if (!session || !session.exam || !session.paket) return;
    Store.setSession(key(session.exam, session.paket), session);
  }

  function cocok(session, pack) {
    if (!session || !Array.isArray(session.ids)) return false;
    var now = ids(pack);
    if (now.length !== session.ids.length) return false;
    for (var i = 0; i < now.length; i++) {
      if (now[i] !== session.ids[i]) return false;
    }
    return true;
  }

  function sisa(session) {
    return Math.max(0, (session.batas || 0) - Date.now());
  }

  function dijawab(session) {
    var n = 0;
    Object.keys(session.answers || {}).forEach(function (k) {
      if (session.answers[k] != null) n++;
    });
    return n;
  }

  function hapus(examId, paketId) {
    Store.removeSession(key(examId, paketId));
  }

  function finalkan(session, pack, manifest, auto) {
    var now = Date.now();
    var hasil = Score.hitung(manifest.scoring, pack.sections, session.answers || {});
    var answers = {};

    Object.keys(session.answers || {}).forEach(function (k) {
      answers[k] = session.answers[k];
    });

    var attempt = {
      id: 'a' + now.toString(36) + Math.random().toString(36).slice(2, 7),
      exam: session.exam,
      paket: session.paket,
      paketTitle: session.judul,
      jenis: session.jenis || 'penuh',
      tanggal: UI.tanggal(now),
      mulai: session.mulai,
      selesai: now,
      sidik: session.sidik || sidik(pack),
      detik: Math.max(0, Math.round(
        (Math.min(now, session.batas || now) - session.mulai) / 1000
      )),
      auto: !!auto,
      answers: answers,
      detail: hasil.detail,
      thresholds: hasil.thresholds,
      total: hasil.total,
      maks: hasil.maks,
      lulus: hasil.lulus
    };

    Store.addAttempt(attempt);
    hapus(session.exam, session.paket);
    return attempt;
  }

  return {
    key: key,
    daftarSoal: daftarSoal,
    sidik: sidik,
    buat: buat,
    get: get,
    simpan: simpan,
    cocok: cocok,
    sisa: sisa,
    dijawab: dijawab,
    hapus: hapus,
    finalkan: finalkan
  };
})();
