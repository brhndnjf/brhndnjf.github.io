/* exam.js — daftar ujian dan manifest.
   Semua jalur data berasal dari exams.json; tidak ada id ujian yang
   ditulis di dalam kode tampilan. Menambah ujian = menambah data. */
var Exam = (function () {
  'use strict';

  var registry = null;
  var manifests = {};
  var pakets = {};

  function list() {
    if (!registry) {
      registry = UI.loadJSON('data/exams.json')
        .then(function (data) {
          return Array.isArray(data.exams) ? data.exams : [];
        })
        .catch(function (err) {
          registry = null; /* biar bisa dicoba lagi */
          throw err;
        });
    }
    return registry;
  }

  function find(id) {
    return list().then(function (exams) {
      var found = exams.filter(function (e) { return e.id === id; })[0];
      return found || null;
    });
  }

  function manifest(id) {
    if (!manifests[id]) {
      manifests[id] = find(id)
        .then(function (e) {
          if (!e) throw new Error('Ujian "' + id + '" tidak dikenal.');
          if (e.status !== 'aktif') throw new Error('Ujian ini belum dibuka.');
          return UI.loadJSON('data/' + e.manifest);
        })
        .catch(function (err) {
          delete manifests[id];
          throw err;
        });
    }
    return manifests[id];
  }

  /* Satu paket = satu berkas. Mengembalikan metadata manifest,
     isi paket, dan manifest ujiannya. */
  function paket(examId, paketId) {
    var key = examId + '/' + paketId;
    if (!pakets[key]) {
      pakets[key] = manifest(examId)
        .then(function (man) {
          var meta = (man.paket || []).filter(function (p) {
            return p.id === paketId;
          })[0];
          if (!meta) throw new Error('Paket "' + paketId + '" tidak dikenal.');
          if (!meta.file) throw new Error('Paket "' + paketId + '" belum punya berkas.');
          return UI.loadJSON('data/' + meta.file).then(function (pack) {
            return { meta: meta, pack: pack, manifest: man };
          });
        })
        .catch(function (err) {
          delete pakets[key];
          throw err;
        });
    }
    return pakets[key];
  }

  function remember(id) {
    Store.setLastExam(id);
  }

  return {
    list: list,
    find: find,
    manifest: manifest,
    paket: paket,
    remember: remember
  };
})();
