# brhndnjf.github.io

Situs pribadi. Statis sepenuhnya — tanpa backend, tanpa build step.

- Beranda: <https://brhndnjf.github.io>
- Latihan SKD: <https://brhndnjf.github.io/skd/>

## Acuan desain

`DESIGN.md` adalah kontrak visual: palet batu hangat, Libre Baskerville untuk
judul, Inter untuk UI, tepi tajam (radius 0), tanpa bayangan, jarak berbasis
12px, lebar isi 680px.

Semua nilai itu hidup di **`assets/css/tokens.css`**. Jangan menulis warna,
ukuran huruf, atau radius langsung di berkas CSS lain — selalu lewat variabel,
supaya mode gelap dan konsistensi tetap terjaga.

## Struktur

```
index.html          beranda
404.html            halaman tidak ditemukan
robots.txt
.nojekyll           mematikan pemrosesan Jekyll
DESIGN.md           acuan desain

assets/
  css/tokens.css    warna, tipe, jarak, bentuk — satu-satunya sumber
  css/base.css      reset & kerangka
  css/hub.css       komponen beranda
  js/hub.js         tema, tahun, dialog QRIS
  img/qris.png      (belum ada — tombol QRIS otomatis disembunyikan)

skd/
  index.html
  assets/css/app.css
  assets/js/        ui, store, score, router, views
  data/
    exams.json      daftar ujian
    cpns/
      manifest.json subtes + daftar paket
      materi/       twk.json, tiu.json, tkp.json
      paket/        paket-01.json, ...

tools/
  serve.js          server lokal untuk pratinjau
  validate.js       pemeriksa isi data sebelum commit
```

## Menambah isi

Seluruh isi berada di `skd/data/`. Jalur di dalam manifest bersifat relatif
terhadap folder `skd/data/`.

Sebelum commit, jalankan pemeriksa:

```powershell
node tools/validate.js
```

Perintah itu menolak kunci jawaban di luar jangkauan, id soal ganda, opsi TKP
yang bobotnya bukan 1–5, dan manifest yang menunjuk berkas tidak ada. Tanpa
build step, inilah satu-satunya jaring pengaman — jangan dilewati.

## Pratinjau lokal

Membuka `index.html` langsung dari disk akan gagal memuat JSON, karena
`fetch` diblokir untuk `file://`. Jalankan server kecil ini:

```powershell
node tools/serve.js
```

Lalu buka <http://localhost:8080> dan <http://localhost:8080/skd/>.

## Menambah proyek

Sunting blok `<div class="projects">` di `index.html`. Pakai `<a class="project">`
bila sudah ada tautan, `<div class="project">` bila belum. Status memakai
`<span class="tag is-live">`, `is-next`, atau `tag` biasa.

## Mengaktifkan QRIS

1. Taruh gambar di `assets/img/qris.png`.
2. Tambahkan `data-qris-src="assets/img/qris.png"` pada `<dialog id="qris">`.

Tanpa atribut itu, tombol QRIS disembunyikan dan tidak ada permintaan 404.

## Catatan

Tidak ada rahasia di repo ini. Apa pun yang ada di sini bisa dibaca publik.
