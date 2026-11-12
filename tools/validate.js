/* validate.js — pemeriksa isi data sebelum di-commit.
   Bukan build step: situs tetap statis. Ini alat penulis, seperti ejaan otomatis.

   Jalankan:  node tools/validate.js
   Keluar dengan kode 1 bila ada kesalahan.
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'skd');
/* Semua jalur di dalam manifest bersifat relatif terhadap folder data/ */
const BASE = path.join(ROOT, 'data');

const errors = [];
const warnings = [];

function err(where, msg) { errors.push(`${where}: ${msg}`); }
function warn(where, msg) { warnings.push(`${where}: ${msg}`); }

function readJSON(rel, where) {
  const abs = path.join(BASE, rel);
  if (!fs.existsSync(abs)) { err(where, `berkas tidak ada — ${rel}`); return null; }
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (e) {
    err(where, `JSON tidak sah — ${rel} (${e.message})`);
    return null;
  }
}

function exists(rel) { return fs.existsSync(path.join(BASE, rel)); }

function dupes(list) {
  const seen = new Set();
  const out = [];
  for (const x of list) {
    if (seen.has(x)) out.push(x);
    seen.add(x);
  }
  return out;
}

// ---------- 1. exams.json ----------
const exams = readJSON('exams.json', 'exams.json');
if (exams) {
  if (!Array.isArray(exams.exams) || !exams.exams.length) {
    err('exams.json', 'daftar "exams" kosong atau bukan array');
  } else {
    const ids = exams.exams.map((e) => e.id);
    dupes(ids).forEach((d) => err('exams.json', `id ujian ganda: "${d}"`));

    for (const e of exams.exams) {
      const w = `exams.json[${e.id || '?'}]`;
      if (!e.id) err(w, 'id kosong');
      if (!e.title) err(w, 'title kosong');
      if (!['aktif', 'segera'].includes(e.status)) err(w, `status tidak sah: "${e.status}"`);
      if (!e.manifest) err(w, 'manifest kosong');
      else if (!exists(e.manifest)) err(w, `manifest tidak ditemukan — ${e.manifest}`);
    }
  }
}

// ---------- 2. manifest tiap ujian ----------
const paketFiles = [];

if (exams && Array.isArray(exams.exams)) {
  for (const e of exams.exams) {
    if (!e.manifest) continue;
    const man = readJSON(e.manifest, `${e.id}/manifest.json`);
    if (!man) continue;

    if (man.id && man.id !== e.id) {
      err(`${e.id}/manifest.json`, `id manifest "${man.id}" tidak cocok dengan id ujian "${e.id}"`);
    }

    // aturan penilaian
    const scoring = man.scoring;
    if (!scoring || typeof scoring !== 'object') {
      err(`${e.id}/manifest.json`, 'scoring kosong — mesin ujian tidak bisa menghitung skor');
    } else {
      if (!Number.isInteger(scoring.poinBenar) || scoring.poinBenar <= 0) {
        err(`${e.id}/manifest.json`, 'scoring.poinBenar harus bilangan bulat positif');
      }
      const aturan = scoring.subtes || {};
      for (const id of Object.keys(aturan)) {
        const a = aturan[id];
        const w = `${e.id}/manifest.json[scoring:${id}]`;
        if (!['key', 'weighted'].includes(a.mode)) err(w, `mode tidak sah: "${a.mode}"`);
        if (!Number.isInteger(a.max) || a.max <= 0) err(w, 'max harus bilangan bulat positif');
        if (!Number.isInteger(a.threshold) || a.threshold < 0) err(w, 'threshold harus bilangan bulat ≥ 0');
        if (Number.isInteger(a.max) && Number.isInteger(a.threshold) && a.threshold > a.max) {
          err(w, 'threshold melebihi max');
        }
      }
    }

    // subtes
    const subtes = man.subtes || [];
    if (!subtes.length) warn(`${e.id}/manifest.json`, 'tidak ada subtes');

    dupes(subtes.map((s) => s.id)).forEach((d) =>
      err(`${e.id}/manifest.json`, `id subtes ganda: "${d}"`));

    if (scoring && scoring.subtes) {
      for (const s of subtes) {
        if (s.id && !scoring.subtes[s.id]) {
          err(`${e.id}/manifest.json`, `subtes "${s.id}" tidak punya aturan di scoring.subtes`);
        }
      }
      for (const id of Object.keys(scoring.subtes)) {
        if (!subtes.some((s) => s.id === id)) {
          err(`${e.id}/manifest.json`, `scoring.subtes.${id} tidak punya subtes pasangan`);
        }
      }
    }

    for (const s of subtes) {
      const w = `${e.id}/manifest.json[subtes:${s.id || '?'}]`;
      if (!s.id) err(w, 'id kosong');
      if (!s.penuh) err(w, 'penuh kosong');
      if (!s.materi) err(w, 'materi kosong');

      if (s.materi && exists(s.materi)) {
        const mat = readJSON(s.materi, s.materi);
        if (mat) {
          const items = mat.items || [];
          dupes(items.map((i) => i.id)).forEach((d) =>
            err(s.materi, `id materi ganda: "${d}"`));

          for (const item of items) {
            const iw = `${s.materi}[${item.id || '?'}]`;
            if (!item.id) err(iw, 'id kosong');
            if (!item.title) err(iw, 'title kosong');
            if (!Array.isArray(item.sections) || !item.sections.length) {
              warn(iw, 'tidak punya sections');
            }
            for (const [qi, q] of (item.quiz || []).entries()) {
              const qw = `${iw} kuis#${qi + 1}`;
              if (!q.q) err(qw, 'pertanyaan kosong');
              if (!Array.isArray(q.opts) || q.opts.length < 2) err(qw, 'opsi < 2');
              if (!Number.isInteger(q.key)) err(qw, 'key bukan bilangan bulat');
              else if (q.key < 0 || q.key >= (q.opts || []).length) {
                err(qw, `key ${q.key} di luar jangkauan (0–${(q.opts || []).length - 1})`);
              }
            }
          }
        }
      }
    }

    // modul alat belajar (SKD, bank soal, kamus, …)
    const modul = man.modul || [];
    dupes(modul.map((m) => m.id)).forEach((d) =>
      err(`${e.id}/manifest.json`, `id modul ganda: "${d}"`));

    for (const m of modul) {
      const w = `${e.id}/manifest.json[modul:${m.id || '?'}]`;
      if (!m.id) err(w, 'id kosong');
      if (!m.title) err(w, 'title kosong');
      if (m.status && !['aktif', 'segera'].includes(m.status)) {
        err(w, `status tidak sah: "${m.status}"`);
      }
    }

    // paket
    const paket = man.paket || [];
    dupes(paket.map((p) => p.id)).forEach((d) =>
      err(`${e.id}/manifest.json`, `id paket ganda: "${d}"`));

    for (const p of paket) {
      const w = `${e.id}/manifest.json[paket:${p.id || '?'}]`;
      if (!p.id) err(w, 'id kosong');
      if (!p.title) err(w, 'title kosong');
      if (!Number.isInteger(p.jumlah) || p.jumlah <= 0) err(w, 'jumlah harus bilangan positif');
      if (!Number.isInteger(p.durasi) || p.durasi <= 0) err(w, 'durasi harus bilangan positif');
      if (p.jenis && !['contoh', 'penuh'].includes(p.jenis)) {
        err(w, `jenis tidak sah: "${p.jenis}"`);
      }
      if (p.aktif && !p.file) err(w, 'aktif tapi tanpa "file"');
      if (p.file && exists(p.file)) {
        paketFiles.push({ exam: e.id, entry: p, scoring: man.scoring });
      } else if (p.aktif && p.file) {
        err(w, `aktif tapi berkas tidak ada — ${p.file}`);
      }
    }
  }
}

// ---------- 3. berkas paket soal ----------
const semuaSoal = new Map(); // id soal -> lokasi (deteksi ganda lintas paket)

for (const { exam, entry, scoring } of paketFiles) {
  const pk = readJSON(entry.file, entry.file);
  if (!pk) continue;

  const w = entry.file;
  if (pk.id && pk.id !== entry.id) err(w, `id berkas "${pk.id}" != id manifest "${entry.id}"`);
  if (pk.jenis && !['contoh', 'penuh'].includes(pk.jenis)) {
    err(w, `jenis tidak sah: "${pk.jenis}"`);
  }
  if (entry.jenis && pk.jenis && entry.jenis !== pk.jenis) {
    warn(w, `jenis berkas "${pk.jenis}" != manifest "${entry.jenis}"`);
  }
  if (Number.isInteger(pk.durasi) && pk.durasi !== entry.durasi) {
    warn(w, `durasi berkas ${pk.durasi} menit, manifest ${entry.durasi} menit`);
  }

  const sections = pk.sections || [];
  if (!sections.length) err(w, 'tidak ada sections');

  let total = 0;
  for (const sec of sections) {
    const sw = `${w}[${sec.subtest || '?'}]`;
    if (!sec.subtest) err(sw, 'subtest kosong');

    const aturan = scoring && scoring.subtes ? scoring.subtes[sec.subtest] : null;
    const mode = aturan ? aturan.mode : null;
    if (!aturan) err(sw, `subtest "${sec.subtest}" tidak punya aturan penilaian`);

    const qs = sec.questions || [];
    total += qs.length;
    if (!qs.length) warn(sw, 'tidak ada soal');

    for (const [i, q] of qs.entries()) {
      const qw = `${sw} soal#${i + 1}`;
      if (!q.id) err(qw, 'id soal kosong');
      else if (semuaSoal.has(q.id)) {
        err(qw, `id soal "${q.id}" sudah dipakai di ${semuaSoal.get(q.id)}`);
      } else {
        semuaSoal.set(q.id, w);
      }

      if (!q.q) err(qw, 'pertanyaan kosong');
      if (!q.why) warn(qw, 'pembahasan kosong');

      const opts = Array.isArray(q.opts) ? q.opts : [];
      if (opts.length < 2) err(qw, 'opsi < 2');

      if (mode === 'weighted') {
        for (const [oi, o] of opts.entries()) {
          if (!o || typeof o !== 'object') {
            err(qw, `opsi#${oi + 1} harus objek { t, score }`);
            continue;
          }
          if (!o.t) err(qw, `opsi#${oi + 1} kosong`);
          if (!Number.isInteger(o.score) || o.score < 1 || o.score > 5) {
            err(qw, `opsi#${oi + 1} skor harus 1–5, dapat ${JSON.stringify(o.score)}`);
          }
        }
      } else {
        if (!Number.isInteger(q.key)) err(qw, 'key bukan bilangan bulat');
        else if (q.key < 0 || q.key >= opts.length) err(qw, `key ${q.key} di luar jangkauan`);
        if (opts.some((o) => typeof o !== 'string' || !o.trim())) err(qw, 'ada opsi kosong');
      }
    }
  }

  if (Number.isInteger(entry.jumlah) && total !== entry.jumlah) {
    warn(w, `jumlah soal ${total}, manifest menyebut ${entry.jumlah}`);
  }
}

// ---------- 4. laporan ----------
const namaUjian = exams && exams.exams ? exams.exams.length : 0;

console.log('Memeriksa', namaUjian, 'ujian;', paketFiles.length, 'berkas paket.');

if (warnings.length) {
  console.log(`\n${warnings.length} peringatan:`);
  warnings.forEach((w) => console.log('  ! ' + w));
}

if (errors.length) {
  console.log(`\n${errors.length} KESALAHAN:`);
  errors.forEach((e) => console.log('  x ' + e));
  console.log('\nGagal. Perbaiki dulu sebelum commit.');
  process.exit(1);
}

console.log('\nLolos. Isi data konsisten.');
