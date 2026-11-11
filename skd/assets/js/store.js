/* store.js — satu-satunya pintu ke localStorage.
   Semua kunci diberi awalan "skd." (kecuali tema, milik situs).
   Bila bentuk data berubah, naikkan SCHEMA dan tulis migrasinya.

   Skema 2:
   - progres dipisah per ujian
   - riwayat ujian menyimpan exam + id + jawaban
   - sesi ujian yang belum selesai disimpan terpisah
*/
var Store = (function () {
  'use strict';

  var SCHEMA = 2;
  var K_SCHEMA = 'skd.schema';
  var K_PROGRESS = 'skd.progress';
  var K_ATTEMPTS = 'skd.attempts';
  var K_SESSIONS = 'skd.sessions';
  var K_LAST_EXAM = 'skd.exam';
  var MAX_SESSIONS = 5;

  function available() {
    try {
      var k = '__t';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  var ok = available();

  function read(key, fallback) {
    if (!ok) return fallback;
    try {
      var raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
      /* Data rusak: buang, jangan sampai memblokir aplikasi */
      try { localStorage.removeItem(key); } catch (e2) {}
      return fallback;
    }
  }

  function write(key, value) {
    if (!ok) return false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      /* Kuota penuh atau mode privat */
      return false;
    }
  }

  function obj(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  /* ---------- Versi skema ---------- */
  function migrate() {
    if (!ok) return;
    var v = read(K_SCHEMA, 0);
    if (v === SCHEMA) return;

    /* Data dari versi aplikasi yang lebih baru: jangan diturunkan. */
    if (v > SCHEMA) return;

    if (v === 1) {
      /* Progres lama berbentuk datar: { "twk-01": "paham" }.
         Bungkus ke bawah ujian cpns. */
      var p = read(K_PROGRESS, null);
      if (p && typeof p === 'object' && !Array.isArray(p)) {
        var datar = Object.keys(p).some(function (k) {
          return typeof p[k] === 'string';
        });
        if (datar) write(K_PROGRESS, { cpns: p });
      }

      /* Riwayat lama belum punya exam. */
      var a = read(K_ATTEMPTS, null);
      if (Array.isArray(a)) {
        write(K_ATTEMPTS, a.map(function (x) {
          if (x && typeof x === 'object' && !x.exam) {
            var salin = {};
            Object.keys(x).forEach(function (k) { salin[k] = x[k]; });
            salin.exam = 'cpns';
            return salin;
          }
          return x;
        }));
      }
    }

    write(K_SCHEMA, SCHEMA);
  }

  migrate();

  /* ---------- Progres materi ----------
     Bentuk: { "twk-01": "paham" | "ulang", ... } per ujian. */
  function getProgress(examId) {
    var all = obj(read(K_PROGRESS, {}));
    var p = obj(all[examId || 'cpns']);
    return p;
  }

  function setProgress(examId, id, status) {
    var all = obj(read(K_PROGRESS, {}));
    var key = examId || 'cpns';
    var p = obj(all[key]);
    if (status) p[id] = status;
    else delete p[id];
    all[key] = p;
    write(K_PROGRESS, all);
    return p;
  }

  function countProgress(examId) {
    var p = getProgress(examId);
    var out = { paham: 0, ulang: 0, total: 0 };
    Object.keys(p).forEach(function (k) {
      out.total++;
      if (p[k] === 'paham') out.paham++;
      else if (p[k] === 'ulang') out.ulang++;
    });
    return out;
  }

  /* ---------- Riwayat ujian ---------- */
  function getAttempts(examId) {
    var a = read(K_ATTEMPTS, []);
    if (!Array.isArray(a)) return [];
    if (!examId) return a;
    return a.filter(function (x) {
      return x && (x.exam || 'cpns') === examId;
    });
  }

  function addAttempt(attempt) {
    var a = getAttempts();
    a.unshift(attempt);
    /* Riwayat dibatasi 50 agar tidak menghabiskan kuota */
    write(K_ATTEMPTS, a.slice(0, 50));
    return a;
  }

  /* ---------- Sesi ujian yang belum selesai ----------
     Bentuk: { "cpns/paket-01": { ... } } */
  function getSessions() {
    return obj(read(K_SESSIONS, {}));
  }

  function getSession(key) {
    var all = getSessions();
    return all[key] && typeof all[key] === 'object' ? all[key] : null;
  }

  function setSession(key, session) {
    var all = getSessions();
    all[key] = session;

    /* Simpan paling banyak 5 sesi; buang yang paling lama dimulai. */
    var keys = Object.keys(all);
    if (keys.length > MAX_SESSIONS) {
      keys.sort(function (a, b) {
        return (all[a].mulai || 0) - (all[b].mulai || 0);
      });
      while (keys.length > MAX_SESSIONS) {
        delete all[keys.shift()];
      }
    }
    return write(K_SESSIONS, all);
  }

  function removeSession(key) {
    var all = getSessions();
    delete all[key];
    write(K_SESSIONS, all);
  }

  /* ---------- Ujian terakhir ---------- */
  function getLastExam() {
    if (!ok) return '';
    try { return localStorage.getItem(K_LAST_EXAM) || ''; } catch (e) { return ''; }
  }

  function setLastExam(examId) {
    if (!ok || !examId) return;
    try { localStorage.setItem(K_LAST_EXAM, examId); } catch (e) {}
  }

  function clearAll() {
    if (!ok) return;
    [K_PROGRESS, K_ATTEMPTS, K_SESSIONS, K_LAST_EXAM].forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) {}
    });
  }

  return {
    available: ok,
    getProgress: getProgress,
    setProgress: setProgress,
    countProgress: countProgress,
    getAttempts: getAttempts,
    addAttempt: addAttempt,
    getSessions: getSessions,
    getSession: getSession,
    setSession: setSession,
    removeSession: removeSession,
    getLastExam: getLastExam,
    setLastExam: setLastExam,
    clearAll: clearAll
  };
})();
