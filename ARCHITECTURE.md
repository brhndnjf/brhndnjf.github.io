# Arsitektur — taman digital statis

Situs ini statis sepenuhnya. Tidak ada backend, basis data, akun, atau proses
build di server. Repo Git adalah sumber kebenaran sekaligus penyimpanan isi.

---

## 1. Keputusan yang mengunci segalanya

| Keputusan | Konsekuensi |
|---|---|
| Tanpa backend | Tidak ada komentar, analytics, akun, atau sinkronisasi |
| Git sebagai basis data | Semua isi publik adalah berkas teks yang bisa di-clone |
| Pre-render lokal | Markdown diubah menjadi HTML sebelum commit |
| GitHub Pages | Repo disajikan apa adanya; `.nojekyll` mematikan Jekyll |
| Draf lokal | `draft/` di-`.gitignore`, tidak pernah terbit |

Dua aturan yang tidak boleh dilanggar:

1. **Sunting sumber, bukan hasil.** Isi catatan hidup di `catatan/*.md` dan
   `index.html`; halaman di `catatan/<slug>/` serta `data/notes.json` adalah
   hasil generate.
2. **Jalankan build sebelum commit.** Tanpa itu, halaman dan data bisa tertinggal
   dari sumbernya.

---

## 2. Alur catatan

```text
catatan/<slug>.md
      │  front-matter + Markdown
      ▼
tools/build-notes.js
      ├─ data/notes.json
      ├─ catatan/index.html
      ├─ catatan/<slug>/index.html
      └─ kartu "Catatan terbaru" di index.html
```

`tools/build-notes.js` membaca **hanya** `catatan/*.md` (kecuali
`_template.md`). Folder `draft/` tidak pernah dibaca, sehingga draf tidak mungkin
ikut ter-generate.

### Front-matter

| Kunci | Wajib | Bentuk | Dipakai untuk |
|---|---|---|---|
| `title` | ya | teks | judul halaman & kartu |
| `slug` | ya | `huruf-kecil-dan-huruf-hubung` | alamat `/catatan/<slug>/` |
| `status` | ya | `seedling` / `budding` / `evergreen` | badge pertumbuhan |
| `tags` | tidak | `[satu, dua]` | chip topik & saringan |
| `created` | ya | `YYYY-MM-DD` | tanggal catatan |
| `updated` | ya | `YYYY-MM-DD` | urutan terbaru & metadata |
| `summary` | ya | satu kalimat | kartu, meta description, OG |

Validasi berhenti dengan pesan jelas bila ada kunci yang hilang, slug ganda,
status tidak dikenal, atau tanggal salah bentuk.

### Markdown yang didukung

Heading `##`/`###`, paragraf, list berurut dan tak berurut, kutipan, garis
pemisah, kode inline, blok kode berpagar, tautan, tebal, dan miring. HTML mentah
di-escape; tautan hanya boleh `http(s)`, `mailto`, path absolut, atau anchor.

Ini parser kecil yang sengaja dibatasi. Bila suatu hari butuh tabel, catatan
kaki, atau HTML tersemat, tambahkan fitur ke `tools/lib/markdown.js` — jangan
mengganti seluruh alur dengan CMS.

---

## 3. Alamat dan berkas

Setiap catatan menjadi folder nyata:

```text
catatan/
├── index.html                    /catatan/
├── _template.md                  tidak diterbitkan
├── snippet-backup-shell.md       sumber
├── snippet-backup-shell/
│   └── index.html                /catatan/snippet-backup-shell/
└── ...
```

Karena setiap alamat punya `index.html` sendiri, refresh dan tautan langsung
bekerja tanpa aturan penulisan ulang di server.

`data/notes.json` menyimpan metadata ringkas untuk konsumen lain (misalnya
pencarian atau umpan RSS di masa depan). Beranda tidak mengambilnya lewat
JavaScript; kartu terbaru sudah ditanam sebagai HTML oleh build, jadi tetap
terbaca tanpa JavaScript.

### Membersihkan halaman lama

Bila slug diubah atau catatan dihapus, folder hasil generate lama ikut dibersihkan
— tetapi hanya folder yang berisi penanda generator. Folder atau berkas lain di
`catatan/` tidak disentuh.

---

## 4. Draf lokal

```text
draft/<slug>.md       gitignored, hanya di disk
```

- `tools/new-note.js --draft "Judul"` membuat draf.
- `tools/new-note.js "Judul"` membuat catatan publik.
- Saat draf siap, pindahkan ke `catatan/` lalu jalankan build.

Konsekuensi yang diterima: draf tidak punya backup otomatis. Satu-satunya
salinan ada di perangkat penulis sampai dipindahkan ke repo.

---

## 5. Kerangka halaman

Beranda memakai rail identitas (Halo, Sekarang, Topik, Tautan) dan kolom baca
(Proyek Aktif, Catatan Terbaru, Dukungan). Halaman catatan memakai kerangka
sempit 680px dengan kepala, isi, dan kaki yang sama.

- `assets/css/tokens.css` — satu-satunya sumber warna, tipe, jarak, bentuk.
- `assets/css/base.css` — reset, tipografi, tombol, dialog, kerangka.
- `assets/css/hub.css` — komponen beranda dan kepala halaman.
- `assets/css/notes.css` — halaman catatan, daftar, filter, isi Markdown.
- `assets/js/theme.js` — tema mengikuti jam lokal, pilihan manual disimpan.
- `assets/js/notes.js` — penyaringan status/tag; tanpa JS semua catatan tampil.

Tidak ada kerangka CSS atau komponen JavaScript eksternal.

---

## 6. Data di perangkat pengunjung

Satu-satunya data yang disimpan adalah preferensi tema:

| Kunci | Isi |
|---|---|
| `brh.theme` | `dark` atau `light` |

Nilainya tidak pernah dikirim ke server. Tidak ada cookie pelacak, analytics,
atau penyimpanan lain.

---

## 7. Yang akan rusak lebih dulu

| Gejala | Sebab | Pencegahan |
|---|---|---|
| Halaman 404 setelah rename | slug berubah, tautan lama tertinggal | build membersihkan folder lama; periksa tautan |
| Beranda tidak diperbarui | lupa menjalankan build | jalankan `node tools/build-notes.js` sebelum commit |
| Catatan tidak muncul | front-matter salah atau slug ganda | build berhenti dengan pesan berkas |
| Draf terbit tak sengaja | berkas dipindah ke `catatan/` tanpa diperiksa | tinjau sebelum commit |
| Isi berbahaya | HTML mentah | parser meng-escape HTML dan memfilter skema tautan |
| Tema berkedip | skrip tema tidak ada di `<head>` | skrip pra-gambar disertakan di setiap halaman |

---

## 8. Batas keras

Tanpa backend, hal-hal berikut tetap tidak mungkin: komentar, akun, sinkronisasi
antar-perangkat, analytics, pencarian lintas perangkat, dan pembayaran langsung
di situs. Bila salah satunya menjadi wajib, arsitektur ini berhenti — bukan
karena kodenya salah, tetapi karena masalahnya berubah.
