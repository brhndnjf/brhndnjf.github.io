#!/usr/bin/env node
/* new-note.js — membuat catatan baru dari template.

   Pemakaian:
     node tools/new-note.js "Judul catatan"
     node tools/new-note.js --draft "Ide yang belum siap"

   Catatan publik masuk ke catatan/. Draf masuk ke draft/ (gitignored).
   Setelah menulis catatan publik, jalankan: node tools/build-notes.js
*/
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function usage() {
  console.log('Pemakaian:');
  console.log('  node tools/new-note.js "Judul catatan"');
  console.log('  node tools/new-note.js --draft "Ide yang belum siap"');
}

function slugify(title) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

function today() {
  const d = new Date();
  const pad = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function main() {
  const args = process.argv.slice(2);
  let draft = false;
  const words = [];

  args.forEach(function (arg) {
    if (arg === '--draft') draft = true;
    else if (arg === '--help' || arg === '-h') { usage(); process.exit(0); }
    else words.push(arg);
  });

  const title = words.join(' ').trim();
  if (!title) { usage(); process.exit(1); }

  const slug = slugify(title);
  if (!slug) {
    console.error('Judul tidak menghasilkan slug yang sah. Pakai huruf atau angka.');
    process.exit(1);
  }

  const dir = path.join(ROOT, draft ? 'draft' : 'catatan');
  const file = path.join(dir, slug + '.md');
  const relative = (draft ? 'draft/' : 'catatan/') + slug + '.md';

  if (fs.existsSync(file)) {
    console.error('Berkas sudah ada: ' + relative);
    console.error('Pilih judul lain atau sunting berkas yang sudah ada.');
    process.exit(1);
  }

  const date = today();
  const content = [
    '---',
    'title: ' + JSON.stringify(title),
    'slug: ' + slug,
    'status: seedling',
    'tags: []',
    'created: ' + date,
    'updated: ' + date,
    'summary: "Satu kalimat tentang isi catatan."',
    '---',
    '',
    'Tulis dua atau tiga kalimat di sini. Benih tidak harus selesai.',
    ''
  ].join('\n');

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, content);

  console.log('Dibuat: ' + relative);
  if (draft) {
    console.log('Draf hanya ada di disk lokal dan tidak akan terbit.');
    console.log('Saat siap: pindahkan ke catatan/ lalu jalankan node tools/build-notes.js');
  } else {
    console.log('Lanjut: node tools/build-notes.js');
  }
}

main();
