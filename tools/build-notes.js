#!/usr/bin/env node
/* build-notes.js — mengubah catatan Markdown menjadi halaman statis.

   Jalankan dari akar repo:
     node tools/build-notes.js
     node tools/build-notes.js --watch

   Sumber kebenaran: front-matter di catatan/*.md.
   Hasil: data/notes.json, catatan/index.html, catatan/<slug>/index.html,
   dan kartu "Catatan terbaru" di index.html (di antara penanda notes:start/end).

   Folder draft/ tidak pernah dibaca. Tanpa dependensi.
*/
'use strict';

const fs = require('fs');
const path = require('path');
const markdown = require('./lib/markdown');
const shell = require('./lib/page');

const ROOT = path.resolve(__dirname, '..');
const NOTES_DIR = path.join(ROOT, 'catatan');
const DATA_DIR = path.join(ROOT, 'data');
const NOTES_JSON = path.join(DATA_DIR, 'notes.json');

function fail(message) {
  throw new Error(message);
}

function cleanValue(value) {
  const v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    try { return JSON.parse(v); } catch (e) { return v.slice(1, -1); }
  }
  return v;
}

/* ---------- Front-matter ---------- */

function parseNote(raw, file) {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) fail(file + ': front-matter harus dimulai dengan ---');

  const close = text.indexOf('\n---', 4);
  if (close === -1) fail(file + ': front-matter tidak ditutup dengan ---');

  const meta = {};
  text.slice(4, close).split('\n').forEach(function (line) {
    if (!line.trim() || line.trim().startsWith('#')) return;
    const m = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!m) fail(file + ': baris front-matter tidak dikenali: ' + line);
    meta[m[1]] = m[2].trim();
  });

  ['title', 'slug', 'status', 'created', 'updated', 'summary'].forEach(function (key) {
    if (!meta[key]) fail(file + ': ' + key + ' wajib diisi');
  });

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug)) {
    fail(file + ': slug hanya boleh huruf kecil, angka, dan tanda hubung');
  }
  if (!shell.STATUS[meta.status]) fail(file + ': status harus seedling, budding, atau evergreen');

  ['created', 'updated'].forEach(function (key) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta[key]) || isNaN(Date.parse(meta[key]))) {
      fail(file + ': ' + key + ' harus tanggal YYYY-MM-DD');
    }
  });

  let tags = [];
  if (meta.tags) {
    if (!meta.tags.startsWith('[') || !meta.tags.endsWith(']')) {
      fail(file + ': tags harus berbentuk [satu, dua]');
    }
    tags = meta.tags.slice(1, -1).split(',').map(cleanValue).filter(Boolean);
  }
  tags.forEach(function (tag) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag)) {
      fail(file + ': tag "' + tag + '" hanya boleh huruf kecil, angka, dan tanda hubung');
    }
  });

  const note = {
    title: cleanValue(meta.title),
    slug: meta.slug,
    status: meta.status,
    tags: tags,
    created: meta.created,
    updated: meta.updated,
    summary: cleanValue(meta.summary),
    body: text.slice(close + 4).replace(/^\n+/, '')
  };

  if (!note.title || !note.summary) fail(file + ': title dan summary tidak boleh kosong');
  return note;
}

/* ---------- Halaman catatan ---------- */

function renderNotePage(note) {
  const tags = note.tags.map(function (tag) {
    return '<li><a href="/catatan/?tag=' + encodeURIComponent(tag) + '">#' +
      markdown.esc(tag) + '</a></li>';
  }).join('');

  const body = [
    '      <article class="note-page">',
    '        ' + shell.GENERATED,
    '        <p class="note-crumb"><a href="/catatan/">Catatan</a> <span aria-hidden="true">/</span> ' +
      '<time datetime="' + note.created + '">' + shell.formatDate(note.created) + '</time></p>',
    '        <h1>' + markdown.esc(note.title) + '</h1>',
    '        <p class="note-lede">' + markdown.esc(note.summary) + '</p>',
    '        <div class="note-meta">',
    '          ' + shell.statusBadge(note),
    '          <span>Diperbarui <time datetime="' + note.updated + '">' +
      shell.formatDate(note.updated) + '</time></span>',
    '        </div>',
    tags ? '        <ul class="note-tags" aria-label="Topik">' + tags + '</ul>' : '',
    '        <div class="prose">',
    markdown.renderMarkdown(note.body),
    '        </div>',
    '        <footer class="note-foot">',
    '          <a href="/catatan/">← Semua catatan</a>',
    '          <a href="#isi">Ke atas</a>',
    '        </footer>',
    '      </article>'
  ].filter(Boolean).join('\n');

  return shell.page({
    title: note.title + ' — brhndnjf',
    description: note.summary,
    url: shell.SITE + '/catatan/' + note.slug + '/',
    type: 'article',
    body: body
  });
}

/* ---------- Halaman daftar ---------- */

function renderCard(note) {
  const tags = note.tags.map(function (tag) {
    return '<span>#' + markdown.esc(tag) + '</span>';
  }).join('');

  return [
    '        <a class="note-card" href="/catatan/' + note.slug + '/" data-note data-status="' +
      note.status + '" data-tags="' + markdown.esc(note.tags.join(' ')) + '">',
    '          <span class="note-card-top">',
    '            ' + shell.statusBadge(note),
    '            <span class="note-date"><time datetime="' + note.updated + '">' +
      shell.formatDate(note.updated) + '</time></span>',
    '          </span>',
    '          <span class="note-card-title">' + markdown.esc(note.title) + '</span>',
    '          <span class="note-card-summary">' + markdown.esc(note.summary) + '</span>',
    tags ? '          <span class="note-card-tags">' + tags + '</span>' : '',
    '        </a>'
  ].filter(Boolean).join('\n');
}

function renderIndexPage(notes) {
  const counts = { all: notes.length, seedling: 0, budding: 0, evergreen: 0 };
  notes.forEach(function (note) { counts[note.status] += 1; });

  const filters = [
    ['all', 'Semua'],
    ['seedling', 'Benih'],
    ['budding', 'Tumbuh'],
    ['evergreen', 'Abadi']
  ].map(function (pair) {
    return '          <button class="filter" type="button" data-filter="' + pair[0] +
      '" aria-pressed="' + (pair[0] === 'all') + '">' + pair[1] +
      ' <span>' + counts[pair[0]] + '</span></button>';
  }).join('\n');

  const body = [
    '      <header class="notes-head">',
    '        ' + shell.GENERATED,
    '        <p class="eyebrow">Taman digital</p>',
    '        <h1>Catatan</h1>',
    '        <p class="lede">Benih pikiran, potongan kode, dan hal yang sedang saya pelajari. Sebagian belum selesai — dan itu memang rencananya.</p>',
    '      </header>',
    '      <div class="filters" role="group" aria-label="Saring berdasarkan status">',
    filters,
    '      </div>',
    '      <p class="filter-note" data-tag-note hidden></p>',
    '      <p class="filter-count" data-filter-count aria-live="polite">' + notes.length + ' catatan</p>',
    '      <div class="note-list">',
    notes.map(renderCard).join('\n'),
    '      </div>',
    '      <p class="empty" data-empty hidden>Tidak ada catatan untuk saringan ini.</p>',
    '      <noscript><p class="note">Penyaringan status membutuhkan JavaScript. Semua catatan tetap tampil di atas.</p></noscript>',
    '      <p class="note"><a href="/">← Kembali ke beranda</a></p>'
  ].join('\n');

  return shell.page({
    title: 'Catatan — brhndnjf',
    description: 'Daftar catatan taman digital brhndnjf: neurodiversity, perangkat keras, kode sederhana, dan proyek kecil.',
    url: shell.SITE + '/catatan/',
    body: body,
    scripts: '  <script src="/assets/js/notes.js" defer></script>'
  });
}

/* ---------- Beranda ---------- */

function renderLatestCards(notes) {
  return notes.slice(0, 5).map(function (note) {
    return [
      '            <a class="project" href="/catatan/' + note.slug + '/">',
      '              <span class="project-title">',
      '                ' + markdown.esc(note.title),
      '                ' + shell.statusBadge(note),
      '              </span>',
      '              <span class="project-desc">' + markdown.esc(note.summary) + '</span>',
      '              <span class="project-go" aria-hidden="true">→</span>',
      '            </a>'
    ].join('\n');
  }).join('\n');
}

function updateLanding(notes) {
  const file = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const marker = /<!-- notes:start -->[\s\S]*?<!-- notes:end -->/;

  if (!marker.test(html)) {
    console.warn('  peringatan: penanda notes:start/notes:end tidak ditemukan di index.html');
    return;
  }

  html = html.replace(marker, '<!-- notes:start -->\n' + renderLatestCards(notes) +
    '\n            <!-- notes:end -->');
  html = html.replace(/(<span data-notes-count>)[^<]*(<\/span>)/,
    '$1' + Math.min(notes.length, 5) + '$2');
  fs.writeFileSync(file, html);
}

/* ---------- Bangun semua ---------- */

function cleanStale(slugs) {
  fs.readdirSync(NOTES_DIR, { withFileTypes: true }).forEach(function (entry) {
    if (!entry.isDirectory() || slugs.has(entry.name)) return;
    const index = path.join(NOTES_DIR, entry.name, 'index.html');
    if (!fs.existsSync(index)) return;
    if (!fs.readFileSync(index, 'utf8').includes(shell.GENERATED)) return;
    fs.rmSync(path.join(NOTES_DIR, entry.name), { recursive: true, force: true });
    console.log('  hapus halaman lama: catatan/' + entry.name + '/');
  });
}

function build() {
  if (!fs.existsSync(NOTES_DIR)) fail('folder catatan/ tidak ditemukan');

  const files = fs.readdirSync(NOTES_DIR).filter(function (file) {
    return file.endsWith('.md') && file !== '_template.md';
  });
  if (!files.length) fail('tidak ada berkas .md di catatan/');

  const seen = new Set();
  const notes = files.map(function (file) {
    const note = parseNote(fs.readFileSync(path.join(NOTES_DIR, file), 'utf8'), file);
    if (seen.has(note.slug)) fail(file + ': slug ganda: ' + note.slug);
    seen.add(note.slug);
    return note;
  });

  notes.sort(function (a, b) {
    return b.updated.localeCompare(a.updated) || b.created.localeCompare(a.created);
  });

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(NOTES_JSON, JSON.stringify({
    schema: 1,
    notes: notes.map(function (note) {
      return {
        slug: note.slug,
        title: note.title,
        summary: note.summary,
        status: note.status,
        tags: note.tags,
        created: note.created,
        updated: note.updated,
        url: '/catatan/' + note.slug + '/'
      };
    })
  }, null, 2) + '\n');

  notes.forEach(function (note) {
    const dir = path.join(NOTES_DIR, note.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), renderNotePage(note));
    console.log('  catatan/' + note.slug + '/');
  });

  fs.writeFileSync(path.join(NOTES_DIR, 'index.html'), renderIndexPage(notes));
  console.log('  catatan/index.html');
  cleanStale(seen);
  updateLanding(notes);
  console.log('  data/notes.json');
  console.log('Selesai: ' + notes.length + ' catatan.');
}

if (process.argv.includes('--watch')) {
  build();
  console.log('Mengawasi catatan/ — simpan berkas .md untuk membangun ulang.');
  let timer = null;
  fs.watch(NOTES_DIR, function (event, filename) {
    if (filename && !String(filename).endsWith('.md')) return;
    clearTimeout(timer);
    timer = setTimeout(function () {
      try { build(); } catch (error) { console.error('Gagal: ' + error.message); }
    }, 200);
  });
} else {
  try {
    build();
  } catch (error) {
    console.error('Gagal: ' + error.message);
    process.exit(1);
  }
}
