# brhndnjf.github.io

Situs pribadi. Statis sepenuhnya — tanpa backend, tanpa build step.

- Beranda: <https://brhndnjf.github.io>
- Latihan SKD: `/skd/` (menyusul)

## Struktur

```
index.html          beranda
404.html            halaman tidak ditemukan
robots.txt
.nojekyll           mematikan pemrosesan Jekyll

assets/
  css/tokens.css    warna, radius, tipografi — satu-satunya sumber
  css/base.css      reset & kerangka
  css/hub.css       komponen beranda
  js/hub.js         tema, tahun, dialog QRIS
  img/qris.png      (belum ada — tombol QRIS otomatis disembunyikan)

skd/                (menyusul)
```

## Menambah proyek

Sunting blok `<div class="projects">` di `index.html`. Setiap proyek berupa
`<a class="project">` (bila ada tautan) atau `<div class="project">` (bila belum).
Status memakai `<span class="tag is-live">`, `is-next`, atau `tag` biasa.

## Mengganti tema

Semua warna ada di `assets/css/tokens.css`. Jangan menulis warna langsung di
`hub.css` — selalu lewat variabel, supaya mode gelap tetap bekerja.

## Catatan

Tidak ada rahasia di repo ini. Apa pun yang ada di sini bisa dibaca publik.
