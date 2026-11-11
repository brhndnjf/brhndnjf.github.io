# Arsitektur — platform latihan multi-ujian

Tanpa backend, **tanpa build step**, target ribuan soal dan banyak ujian.
Dokumen ini menjelaskan bagaimana itu mungkin, dan di mana batasnya.

---

## 1. Keputusan yang mengunci segalanya

| Keputusan | Konsekuensi |
|---|---|
| Tanpa build | Tidak ada nama berkas ber-hash; cache harus diurus manual |
| Tanpa backend | Tidak ada akun, sinkron, peringkat, atau anti-cheat |
| Banyak ujian | Semua jalur data harus berawalan ujian: `cpns/`, `pppk/`, ... |
| Ribuan soal | Isi **wajib** dipecah; tidak boleh ada satu berkas raksasa |

Dua aturan yang tidak boleh dilanggar:

1. **Satu paket soal = satu berkas.** Maksimal ~150 soal per berkas. Tidak pernah "semua soal dalam satu JSON".
2. **Setiap berkas isi harus lolos validator.** Tanpa build step, validator adalah satu-satunya jaring pengaman; tanpa itu, satu kunci jawaban yang salah akan diam-diam merusak skor ribuan orang.

---

## 2. Tata letak data — sistem berkas sebagai basis data

Host statis tidak bisa "melihat daftar folder". Karena itu setiap tingkat punya **manifest** yang menyebut berkas anaknya secara eksplisit.

```
data/
├── exams.json                        # daftar semua ujian
└── cpns/
    ├── manifest.json                 # subtes + daftar paket ujian ini
    ├── materi/
    │   ├── twk.json
    │   ├── tiu.json
    │   └── tkp.json
    └── paket/
        ├── paket-01.json             # 110 soal
        ├── paket-02.json
        └── ...
```

Aturan penamaan: **huruf kecil, tanda hubung, tanpa spasi**. ID berkas = ID di manifest. Satu salah ketik = 404 yang jelas, bukan data diam-diam kosong.

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

`status`: `aktif` | `segera`. Ujian `segera` tampil tapi tidak bisa dibuka.

### `data/cpns/manifest.json`

```json
{
  "schema": 1,
  "id": "cpns",
  "title": "CPNS",
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
      "id": "paket-01",
      "title": "Paket 1 — Simulasi Penuh",
      "jumlah": 110,
      "durasi": 100,
      "aktif": true,
      "file": "cpns/paket/paket-01.json"
    }
  ]
}
```

### `data/cpns/paket/paket-01.json`

```json
{
  "schema": 1,
  "id": "paket-01",
  "title": "Paket 1 — Simulasi Penuh",
  "durasi": 100,
  "sections": [
    {
      "subtest": "twk",
      "questions": [
        { "id": "twk-001", "topik": "nasionalisme", "q": "…", "opts": ["…"], "key": 2 }
      ]
    },
    {
      "subtest": "tkp",
      "questions": [
        { "id": "tkp-001", "topik": "pelayanan", "q": "…",
          "opts": [{ "t": "…", "score": 5 }, { "t": "…", "score": 2 }] }
      ]
    }
  ]
}
```

**`id` soal wajib unik dan tidak boleh berubah** setelah dipakai. Itu satu-satunya cara menghubungkan jawaban lama pengguna dengan soal, dan satu-satunya cara pembahasan tidak tertukar saat soal disunting.

---

## 3. Bagaimana browser memuat ribuan soal

```
buka aplikasi
  └─ exams.json                     (~1 KB)   selalu
     └─ cpns/manifest.json          (~3 KB)   saat ujian dipilih
        └─ cpns/paket/paket-01.json (~120 KB) saat paket mulai dikerjakan
```

Yang **tidak** terjadi: mengunduh semua paket sekaligus. Pengguna hanya mengunduh paket yang dikerjakan.

- **Prafetch** paket berikutnya setelah paket pertama selesai dimuat, saat koneksi menganggur (`requestIdleCallback`).
- **Cache memori** selama tab terbuka; **Cache Storage** (service worker) antar-kunjungan.
- **Batas**: 5.000 soal ≈ 5–6 MB total, tapi satu sesi hanya menyentuh ±120 KB. Ini yang membuat "ribuan soal" tetap wajar di hosting statis.

---

## 4. Cache tanpa nama berkas ber-hash

Tanpa build, nama berkas tidak bisa diberi hash. Tiga lapis penanganan:

1. `Cache-Control` dari GitHub Pages sudah `max-age=600` — cukup untuk CSS/JS biasa.
2. **Service worker** memakai strategi berbeda per jenis:
   - `exams.json`, `manifest.json`, `paket/*.json` → *network first, cache fallback* (isi sering berubah)
   - `*.css`, `*.js` → *stale-while-revalidate* (jarang berubah, harus cepat)
3. `data/version.json` berisi `{ "v": 3 }` yang dinaikkan setiap kali isi berubah massal; service worker membandingkan dan membersihkan cache lama.

Konsekuensi yang harus diterima: setelah Anda mengubah soal, pengguna bisa melihat versi lama hingga satu kali reload. Itu wajar untuk situs statis, dan jauh lebih baik daripada tidak bisa offline.

---

## 5. Pipeline penulisan isi (tetap tanpa build)

Menulis JSON mentah untuk 5.000 soal tidak realistis. Alur yang dipakai:

```
Spreadsheet (CSV)  →  tools/csv-to-json.js  →  data/cpns/paket/paket-XX.json
                              ↓
                     tools/validate.js  →  lolos? commit : perbaiki
```

- Menulis di spreadsheet: satu baris = satu soal, kolom `id, topik, soal, A, B, C, D, kunci, pembahasan`.
- `csv-to-json.js` mengubah dan **melaporkan** baris bermasalah, bukan diam.
- `validate.js` memeriksa seluruh isi repo sebelum di-commit.
- Keduanya dijalankan manual oleh Anda. Situs tetap statis; tidak ada build saat deploy.

Ini bukan build step. Ini alat penulis, seperti ejaan otomatis — dipakai saat menulis, tidak ikut ke produksi.

---

## 6. Validator — apa yang diperiksa

| Berkas | Aturan |
|---|---|
| `exams.json` | id unik; `manifest` ada; status sah |
| `manifest.json` | id subtes unik; berkas materi ada; id paket unik; paket `aktif` wajib punya berkas |
| materi | id materi unik; opsi kuis ≥ 2; `key` dalam jangkauan |
| paket | id soal unik **lintas paket**; `key` dalam jangkauan; opsi TKP berbobot 1–5; jumlah soal cocok dengan manifest (peringatan bila beda); tidak ada opsi kosong |

Keluar dengan kode 1 bila ada kesalahan — sehingga bisa dipasang di GitHub Actions sebagai penjaga, tanpa mengubah cara deploy.

---

## 7. Yang akan rusak lebih dulu (dan pencegahannya)

| Gejala | Sebab | Pencegahan |
|---|---|---|
| Skor aneh | `key` menunjuk opsi yang tidak ada | validator |
| Pembahasan tertukar | `id` soal diubah setelah dipakai | id tidak boleh berubah |
| Halaman kosong | manifest menyebut berkas yang salah nama | validator |
| Pengguna melihat soal lama | cache service worker | `version.json` |
| Data pengguna hilang | bentuk `localStorage` berubah | skema + migrasi di `store.js` |
| Kuota penuh | riwayat ujian menumpuk | batas 50 + IndexedDB bila perlu |

---

## 8. Batas keras

Tetap tidak mungkin tanpa backend: akun, sinkron antar-perangkat, peringkat, verifikasi skor, analitik pemakaian, pembayaran.

Bila salah satu itu menjadi wajib, arsitektur ini berhenti — bukan karena kodenya salah, tapi karena masalahnya berubah menjadi butuh server.
