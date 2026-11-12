# brhndnjf.github.io

Situs pribadi. Statis sepenuhnya — tanpa backend, tanpa build step.

- Beranda: <https://brhndnjf.github.io>
- Latihan ujian: <https://brhndnjf.github.io/skd/>

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
ARCHITECTURE.md     keputusan arsitektur & batas platform

assets/
  css/tokens.css    warna, tipe, jarak, bentuk — satu-satunya sumber
  css/base.css      reset, kerangka, tombol, dialog
  css/hub.css       komponen beranda
  js/theme.js       mode terang/gelap, dipakai beranda & aplikasi
  js/hub.js         tahun, dialog QRIS
  img/qris.png      (belum ada — tombol QRIS otomatis disembunyikan)

skd/
  index.html
  assets/css/
    app.css               kerangka aplikasi
    materi.css            akordeon, penanda progres, kuis
    ujian.css             layar ujian
    hasil.css             skor & pembahasan
  assets/js/
    ui, store, score      pembantu, penyimpanan, penilaian
    exam, sesi, nav       daftar ujian, sesi berjalan, tab
    router, app           hash router & pemasangan rute
    views/                exams, exam, materi, tryout, ujian, hasil
  data/
    exams.json            daftar ujian
    cpns/
      manifest.json       subtes, aturan skor, daftar paket
      materi/             twk.json, tiu.json, tkp.json
      paket/
        paket-contoh.json 15 soal contoh untuk menguji mesin
        paket-01.json     (belum ada — menunggu soal asli)

tools/
  serve.js          server lokal untuk pratinjau
  validate.js       pemeriksa isi data sebelum commit
```

## Alur ujian

Rute memakai awalan ujian, jadi satu aplikasi bisa memuat banyak ujian:

```
#/                        daftar ujian
#/cpns                    ringkasan ujian
#/cpns/materi             daftar subtes
#/cpns/materi/twk         isi materi
#/cpns/tryout             daftar paket + riwayat
#/cpns/tryout/paket-01    sesi ujian
#/cpns/hasil/<id>         skor + pembahasan
```

Tautan lama `#/materi`, `#/materi/twk`, dan `#/tryout` diarahkan ke CPNS.

Sesi ujian disimpan di `localStorage` setiap kali jawaban berubah. Kalau tab
ditutup atau halaman dimuat ulang, sesi yang sama dilanjutkan — timer dihitung
dari batas waktu, bukan dari hitungan detik di tab. Sesi yang kedaluwarsa
otomatis disimpan sebagai hasil. Satu ujian tidak bisa memakai sesi paket lain;
isi paket yang berubah juga ditolak lewat sidik soal.

Skor dihitung dari `scoring` di manifest ujian: `mode: "key"` memberi poin
untuk kunci benar, `mode: "weighted"` menjumlahkan bobot opsi (TKP). Skor
maksimum mengikuti jumlah soal yang benar-benar ada di paket, bukan angka
teoretis ujian penuh.

## Menambah isi

Seluruh isi berada di `skd/data/`. Jalur di dalam manifest bersifat relatif
terhadap folder `skd/data/`.

Sebelum commit, jalankan pemeriksa:

```powershell
node tools/validate.js
```

Perintah itu menolak kunci jawaban di luar jangkauan, id soal ganda, opsi TKP
yang bobotnya bukan 1–5, subtes yang tidak punya aturan skor, dan manifest yang
menunjuk berkas tidak ada. Tanpa build step, inilah satu-satunya jaring
pengaman — jangan dilewati.

Paket `paket-contoh` sengaja pendek dan bertanda `"jenis": "contoh"`. Ia hanya
untuk menguji mesin ujian; ambang kelulusan tidak berlaku untuk paket itu.
Ganti dengan soal asli sebelum dipakai orang lain.

## Menambah ujian baru

1. Buat folder `skd/data/<id>/` berisi `manifest.json`, `materi/`, dan `paket/`.
2. Salin bentuk `cpns/manifest.json`, ganti `id`, `title`, dan `scoring`.
3. Tambahkan satu entri di `skd/data/exams.json` dengan `manifest` yang sesuai.
4. Jalankan `node tools/validate.js`.

Tidak ada JavaScript yang perlu diubah. Rute, tab, dan pemilihan ujian mengikuti
daftar di `exams.json`.

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
