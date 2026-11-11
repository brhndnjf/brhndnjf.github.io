/* store.js — satu-satunya pintu ke localStorage.
   Semua kunci diberi awalan "skd." (kecuali tema, milik situs).
   Bila bentuk data berubah, naikkan SCHEMA dan tulis migrasinya. */
var Store = (function () {
  'use strict';

  var SCHEMA = 1;
  var K_SCHEMA = 'skd.schema';
  var K_PROGRESS = 'skd.progress';
  var K_ATTEMPTS = 'skd.attempts';

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

  /* ---------- Versi skema ---------- */
  function migrate() {
    if (!ok) return;
    var v = read(K_SCHEMA, 0);
    if (v === SCHEMA) return;
    if (v === 0) {
      /* Pemasangan baru: tidak ada yang perlu dimigrasi */
      write(K_SCHEMA, SCHEMA);
      return;
    }
    if (v > SCHEMA) {
      /* Data dari versi aplikasi yang lebih baru. Jangan ditebak —
         simpan apa adanya dan biarkan aplikasi lama mengabaikannya. */
      return;
    }
    /* Tempat migrasi v1 → v2 dan seterusnya. Untuk sekarang: tidak ada. */
    write(K_SCHEMA, SCHEMA);
  }

  migrate();

  /* ---------- Progres materi ----------
     Bentuk: { "twk-01": "paham" | "ulang", ... } */
  function getProgress() {
    var p = read(K_PROGRESS, {});
    return p && typeof p === 'object' ? p : {};
  }

  function setProgress(id, status) {
    var p = getProgress();
    if (status) p[id] = status;
    else delete p[id];
    write(K_PROGRESS, p);
    return p;
  }

  function countProgress() {
    var p = getProgress();
    var out = { paham: 0, ulang: 0, total: 0 };
    Object.keys(p).forEach(function (k) {
      out.total++;
      if (p[k] === 'paham') out.paham++;
      else if (p[k] === 'ulang') out.ulang++;
    });
    return out;
  }

  /* ---------- Riwayat tryout ---------- */
  function getAttempts() {
    var a = read(K_ATTEMPTS, []);
    return Array.isArray(a) ? a : [];
  }

  function addAttempt(attempt) {
    var a = getAttempts();
    a.unshift(attempt);
    /* Riwayat dibatasi 50 agar tidak menghabiskan kuota */
    write(K_ATTEMPTS, a.slice(0, 50));
    return a;
  }

  function clearAll() {
    if (!ok) return;
    [K_PROGRESS, K_ATTEMPTS].forEach(function (k) {
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
    clearAll: clearAll
  };
})();
