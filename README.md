# brhndnjf.github.io

Taman digital pribadi. Statis sepenuhnya — tanpa backend, tanpa akun, tanpa
pelacak. Isi situs adalah berkas teks di repo ini; tidak ada basis data.

- Situs: <https://brhndnjf.github.io>
- Catatan: <https://brhndnjf.github.io/catatan/>

## Cara kerja singkat

1. Tulis catatan Markdown di `catatan/`.
2. Jalankan `node tools/build-notes.js`.
3. Periksa hasilnya, lalu commit dan push.

GitHub Pages menyajikan repo apa adanya. Tidak ada build di server.

## Struktur

```text
index.html              beranda: rail identitas + catatan terbaru
404.html                halaman tidak ditemukan
robots.txt
.nojekyll               mematikan pemrosesan Jekyll

catatan/
  _template.md          contoh front-matter
  <slug>.md             sumber catatan (satu-satunya yang disunting)
  index.html            daftar catatan (hasil generate)
  <slug>/index.html     halaman catatan (hasil generate)

data/
  notes.json            metadata catatan (hasil generate)

draft/                  draf lokal, gitignored — tidak pernah terbit

assets/
  css/tokens.css        warna, tipe, jarak, bentuk — satu-satunya sumber
  css/base.css          reset, tipografi, kerangka, tombol, dialog
  css/hub.css           komponen beranda & kepala halaman
  css/notes.css         halaman catatan & daftar catatan
  js/theme.js           tema terang/gelap otomatis (jam setempat)
  js/hub.js             tahun, dialog QRIS
  js/notes.js           penyaringan status di daftar catatan
  img/qris.png          kode QRIS dukungan

tools/
  build-notes.js        Markdown → halaman statis + data/notes.json
  new-note.js           membuat catatan baru dari template
  lib/markdown.js       parser Markdown ringan
  lib/page.js           kerangka HTML halaman catatan
  serve.js              server lokal untuk pratinjau

DESIGN.md               acuan visual
ARCHITECTURE.md         keputusan arsitektur & batas platform
```

## Menulis catatan

Buat berkas baru dari template:

```powershell
node tools/new-note.js "Judul catatan"
```

Atau tulis draf yang belum siap terbit:

```powershell
node tools/new-note.js --draft "Ide yang belum matang"
```

Draf masuk ke `draft/` yang di-`.gitignore`. Isinya hanya ada di disk lokal.
Saat siap, pindahkan berkasnya ke `catatan/`, lalu jalankan build.

Front-matter yang dipakai:

```yaml
---
title: "Judul catatan"
slug: judul-catatan
status: seedling        # seedling | budding | evergreen
tags: [code, journal]
created: 2026-11-13
updated: 2026-11-13
summary: "Satu kalimat untuk kartu dan metadata."
---
```

- `slug` menjadi alamat: `/catatan/<slug>/`.
- `status` menjadi badge 🌱 Benih, 🌿 Tumbuh, atau 🌲 Abadi.
- `summary` dipakai di kartu beranda dan deskripsi halaman.
- `tags` dipakai untuk chip topik dan saringan `?tag=`.

Setelah menulis atau mengubah catatan:

```powershell
node tools/build-notes.js
```

Perintah itu menghasilkan `data/notes.json`, `catatan/index.html`, halaman tiap
catatan, dan kartu "Catatan terbaru" di beranda. Jangan menyunting berkas hasil
generate — sunting `.md`-nya lalu build ulang.

Selama menulis, mode pantau bisa dipakai:

```powershell
node tools/build-notes.js --watch
```

## Pratinjau lokal

```powershell
node tools/serve.js
```

Lalu buka <http://localhost:8080> dan <http://localhost:8080/catatan/>.

Server ini hanya alat pengembangan; GitHub Pages tidak membutuhkannya.

## Batas yang disengaja

- Tidak ada komentar, analytics, akun, atau database.
- Semua yang di-commit bersifat publik. Jangan menaruh rahasia atau data pribadi.
- Draf lokal tidak ter-backup otomatis oleh Git; salin manual bila perlu.
- Riwayat Git menyimpan versi lama berkas meskipun berkasnya dihapus.

## Tema

Tema mengikuti jam setempat: gelap pukul 18.00–05.59, terang pukul 06.00–17.59.
Pilihan manual disimpan di `localStorage` perangkat pengunjung dan tidak pernah
dikirim ke mana pun.

## Dukungan

Gambar QRIS ada di `assets/img/qris.png` dan dimuat lewat `data-qris-src` pada
`<dialog id="qris">` di beranda. Tombol disembunyikan otomatis bila gambar tidak
tersedia.

## Acuan desain

`DESIGN.md` adalah kontrak visual: palet batu hangat, Libre Baskerville untuk
judul, Inter untuk UI, tepi tajam, tanpa bayangan, jarak berbasis 12px, lebar
baca 680px. Semua nilai hidup di `assets/css/tokens.css`; berkas CSS lain
memakai variabel, bukan nilai mentah.
