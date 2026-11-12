# Arsitektur — platform latihan multi-ujian

Tanpa backend, **tanpa build step**, target ribuan soal dan banyak ujian.
Dokumen ini menjelaskan bagaimana itu mungkin, apa yang sudah berjalan,
dan di mana batasnya.

---

## 1. Keputusan yang mengunci segalanya

| Keputusan | Konsekuensi |
|---|---|
| Tanpa build | Tidak ada nama berkas ber-hash; cache harus diurus manual |
| Tanpa backend | Tidak ada akun, sinkron, peringkat, atau anti-cheat |
| Banyak ujian | Semua jalur data dan rute berawalan ujian: `cpns/`, `pppk/`, ... |
| Ribuan soal | Isi **wajib** dipecah; tidak boleh ada satu berkas raksasa |

Dua aturan yang tidak boleh dilanggar:

1. **Satu paket soal = satu berkas.** Maksimal ~150 soal per berkas. Tidak pernah "semua soal dalam satu JSON".
2. **Setiap berkas isi harus lolos validator.** Tanpa build step, validator adalah satu-satunya jaring pengaman; tanpa itu, satu kunci jawaban yang salah akan diam-diam merusak skor.

Menambah ujian baru adalah pekerjaan **data**, bukan kode: satu folder di
`skd/data/`, satu entri di `exams.json`. Tidak ada rute, tab, atau berkas
JavaScript yang perlu disentuh.

---

## 2. Tata letak data — sistem berkas sebagai basis data

Host statis tidak bisa "melihat daftar folder". Karena itu setiap tingkat punya
**manifest** yang menyebut berkas anaknya secara eksplisit.

```
skd/data/
├── exams.json                        # daftar semua ujian
└── cpns/
    ├── manifest.json                 # subtes, aturan skor, daftar paket
    ├── materi/
    │   ├── twk.json
    │   ├── tiu.json
    │   └── tkp.json
    └── paket/
        ├── paket-contoh.json         # 15 soal, aktif — untuk menguji mesin
        └── paket-01.json             # 110 soal (belum ada)
```

Semua jalur di dalam manifest **relatif terhadap `skd/data/`**. Aturan
penamaan: huruf kecil, tanda hubung, tanpa spasi. ID berkas = ID di manifest.

### `data/exams.json`

```json
{
  "schema": 1,
  "exams": [
    {
      "id": "cpns",
      "title": "CPNS",
      "subtitle": "Seleksi Kompetensi Dasar",
      "desc": "Satu kalimat.",
      "status": "aktif",
      "manifest": "cpns/manifest.json"
    }
  ]
}
```

`status`: `aktif` | `segera`. Ujian `segera` tampil di daftar tetapi tidak bisa
dibuka; `Exam.find` mengembalikan entri apa adanya, tampilan yang menolak.

### `data/cpns/manifest.json`

```json
{
  "schema": 1,
  "id": "cpns",
  "title": "CPNS",
  "scoring": {
    "poinBenar": 5,
    "subtes": {
      "twk": { "mode": "key",      "max": 150, "threshold": 65 },
      "tiu": { "mode": "key",      "max": 175, "threshold": 80 },
      "tkp": { "mode": "weighted", "max": 225, "threshold": 156 }
    }
  },
  "subtes": [
    {
      "id": "twk",
      "nama": "TWK",
      "penuh": "Tes Wawasan Kebangsaan",
      "ringkas": "Satu baris untuk daftar.",
      "materi": "cpns/materi/twk.json"
    }
  ],
  "paket": [
    {
      "id": "paket-contoh",
      "title": "Paket Contoh — 15 Soal",
      "jumlah": 15,
      "durasi": 20,
      "jenis": "contoh",
      "aktif": true,
      "file": "cpns/paket/paket-contoh.json"
    }
  ]
}
```

- `scoring.subtes.*.mode`: `key` (benar/salah) atau `weighted` (bobot per opsi, untuk TKP).
- `scoring.subtes.*.max` adalah skor maksimum **teoretis** ujian penuh; dipakai validator untuk memastikan ambang tidak melebihinya.
- `jenis`: `contoh` | `penuh`. Paket `contoh` menyembunyikan status lulus/gagal dan ambang kelulusan.
- `aktif: false` menampilkan paket sebagai "Segera" dan menolak membukanya.

### `data/cpns/paket/paket-01.json`

```json
{
  "schema": 1,
  "id": "paket-01",
  "title": "Paket 1 — Simulasi Penuh",
  "jenis": "penuh",
  "durasi": 100,
  "sections": [
    {
      "subtest": "twk",
      "questions": [
        {
          "id": "twk-001", "topik": "nasionalisme",
          "q": "…", "opts": ["…"], "key": 2, "why": "…"
        }
      ]
    },
    {
      "subtest": "tkp",
      "questions": [
        {
          "id": "tkp-001", "topik": "pelayanan",
          "q": "…",
          "opts": [{ "t": "…", "score": 5 }, { "t": "…", "score": 2 }],
          "why": "…"
        }
      ]
    }
  ]
}
```

**`id` soal wajib unik dan tidak boleh berubah** setelah dipakai. Itu satu-satunya
cara menghubungkan jawaban lama pengguna dengan soal, dan satu-satunya cara
pembahasan tidak tertukar saat soal disunting.

---

## 3. Memuat data di browser

```
buka aplikasi
  └─ exams.json                     (~1 KB)   selalu
     └─ cpns/manifest.json          (~3 KB)   saat ujian dipilih
        └─ cpns/paket/paket-01.json (~120 KB) saat paket dikerjakan
```

Yang **tidak** terjadi: mengunduh semua paket sekaligus. Pengguna hanya
mengunduh paket yang dikerjakan.

`UI.loadJSON` menyimpan **promise** di cache memori selama tab terbuka. Promise
yang gagal tidak di-cache, sehingga percobaan berikutnya bisa berhasil. Fetch
memakai `cache: 'no-cache'` supaya soal yang baru diubah tidak tertahan cache
HTTP.

Batas yang sudah terukur: satu sesi hanya menyentuh sekitar 120 KB meskipun
total bank soal beberapa megabyte. Ini yang membuat "ribuan soal" tetap wajar
di hosting statis.

**Belum ada** service worker, prefetch saat menganggur, atau cache offline.
Semuanya bisa ditambahkan nanti tanpa mengubah bentuk data; sampai itu ada,
anggaplah setiap kunjungan memuat ulang dari jaringan.

---

## 4. Rute

Router hash, jadi refresh di rute mana pun selalu berhasil tanpa aturan
penulisan ulang di server.

```
#/                        daftar ujian
#/cpns                    ringkasan ujian
#/cpns/materi             daftar subtes
#/cpns/materi/twk         isi materi
#/cpns/tryout             daftar paket + riwayat
#/cpns/tryout/paket-01    sesi ujian
#/cpns/hasil/<id>         skor + pembahasan
```

Tautan lama `#/materi`, `#/materi/<subtes>`, dan `#/tryout` dialihkan ke CPNS.

Handler rute boleh mengembalikan fungsi pembersih. Router memanggilnya sebelum
rute berganti — ini yang mematikan timer ujian supaya tidak tertinggal.

---

## 5. Sesi ujian dan penilaian

Sesi disimpan di `localStorage` dengan kunci `exam/paket`, maksimal 5 sesi.
Setiap perubahan jawaban, posisi soal, atau tanda ragu-ragu langsung disimpan.

- **Timer** dihitung dari `batas` (timestamp), bukan dari hitungan detik di tab. Tab yang ditidurkan browser tidak merusak waktu.
- **Melanjutkan** sesi memeriksa kecocokan daftar id soal dan sidik isi paket. Bila isi paket berubah, sesi lama ditolak dan pengguna diberi pilihan menghapusnya — jawaban tidak dipetakan ke soal yang salah.
- **Kedaluwarsa**: saat halaman dibuka dan `batas` sudah lewat, sesi langsung difinalkan sebagai hasil dengan `auto: true`.
- **Sidik paket** (`sidik`, versi 2): hash ringkas id soal, teks soal, opsi, kunci, dan bobot; disimpan di sesi dan hasil. Dipakai halaman hasil untuk memberi tahu bila isi paket berubah setelah hasil dibuat. Sidik versi lama (hanya id) tetap dibaca agar riwayat lama tidak memicu peringatan palsu.

Skor dihitung `score.js` dari `manifest.scoring`:

| Mode | Perhitungan |
|---|---|
| `key` | `poinBenar` untuk jawaban tepat; salah dan kosong nol |
| `weighted` | bobot opsi terpilih (1–5); kosong nol |

Skor maksimum **dihitung dari soal yang benar-benar ada di paket**, bukan dari
`scoring.max` teoretis. Jadi paket contoh 15 soal berskor maksimum 75, bukan
550, dan ambang kelulusan ujian penuh tidak pernah salah diterapkan ke paket
pendek.

`lulus` bernilai benar hanya bila setiap subtes mencapai ambangnya. Untuk paket
`jenis: "contoh"`, hasil ini tidak ditampilkan sebagai kelulusan.

---

## 6. Penyimpanan di perangkat

`store.js` adalah satu-satunya pintu ke `localStorage`. Skema saat ini **2**.

| Kunci | Isi |
|---|---|
| `skd.schema` | versi skema |
| `skd.progress` | status materi per ujian: `{ "cpns": { "twk-01": "paham" } }` |
| `skd.attempts` | riwayat hasil, maksimal 50, terbaru di depan |
| `skd.sessions` | sesi berjalan, maksimal 5 |
| `skd.exam` | ujian terakhir yang dibuka |

Migrasi 1 → 2 membungkus progres datar lama ke bawah `cpns` dan menambahkan
`exam: "cpns"` pada riwayat lama. Bila bentuk data berubah lagi, naikkan
`SCHEMA` dan tulis migrasinya — jangan hapus data pengguna.

Bila `localStorage` diblokir (mode privat), aplikasi tetap berjalan tetapi
menampilkan peringatan bahwa progres tidak akan tersimpan.

---

## 7. Validator — apa yang diperiksa

`node tools/validate.js` membaca `exams.json`, setiap manifest, materi, dan
paket, lalu keluar dengan kode 1 bila ada kesalahan.

| Bagian | Aturan |
|---|---|
| `exams.json` | id unik; `manifest` ada; status sah |
| manifest | id cocok dengan folder; `scoring` ada; `poinBenar` positif; mode `key`/`weighted`; `max` positif; `threshold` 0..max; setiap subtes punya aturan skor dan sebaliknya; id subtes/paket unik; berkas materi dan paket aktif ada |
| paket | `id` cocok dengan manifest; `jenis` sah; id soal unik **lintas paket**; `key` dalam jangkauan; opsi TKP berbobot 1–5; opsi tidak kosong; jumlah soal cocok dengan manifest (peringatan bila beda) |
| materi | id unik; opsi kuis ≥ 2; `key` dalam jangkauan |

Pemeriksaan `scoring` penting: tanpa itu, paket bisa lolos tetapi mesin ujian
tidak tahu cara menilainya.

---

## 8. Pipeline penulisan isi (tetap tanpa build)

Menulis JSON mentah untuk ribuan soal tidak realistis. Alur yang dituju:

```
Spreadsheet (CSV)  →  tools/csv-to-json.js  →  skd/data/cpns/paket/paket-XX.json
                              ↓
                     node tools/validate.js  →  lolos? commit : perbaiki
```

`validate.js` **sudah ada**. `csv-to-json.js` **belum dibuat**; untuk saat ini
paket ditulis sebagai JSON dan diperiksa validator. Saat alat konversi dibuat,
ia harus melaporkan baris bermasalah, bukan diam.

Ini bukan build step. Ini alat penulis, seperti ejaan otomatis — dipakai saat
menulis, tidak ikut ke produksi.

---

## 9. Yang akan rusak lebih dulu (dan pencegahannya)

| Gejala | Sebab | Pencegahan |
|---|---|---|
| Skor aneh | `key` menunjuk opsi yang tidak ada | validator |
| Pembahasan tertukar | `id` soal diubah setelah dipakai | id tidak boleh berubah |
| Halaman kosong | manifest menyebut berkas yang salah nama | validator |
| Ambang salah diterapkan | `scoring` tidak lengkap atau `max` keliru | validator + skor maksimum dihitung dari paket |
| Jawaban nyasar | sesi lama dipakai untuk paket yang berubah | sidik + daftar id soal |
| Data pengguna hilang | bentuk `localStorage` berubah | skema + migrasi di `store.js` |
| Kuota penuh | riwayat dan sesi menumpuk | batas 50 riwayat + 5 sesi |
| Pengguna melihat soal lama | cache HTTP | `cache: 'no-cache'` (service worker belum ada) |

---

## 10. Batas keras

Tetap tidak mungkin tanpa backend: akun, sinkron antar-perangkat, peringkat,
verifikasi skor, analitik pemakaian, pembayaran.

Bila salah satu itu menjadi wajib, arsitektur ini berhenti — bukan karena
kodenya salah, tapi karena masalahnya berubah menjadi butuh server.
