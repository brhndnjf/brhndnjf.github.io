---
title: "Sistem Terminal untuk Mengurangi Overstimulasi Visual"
slug: sistem-terminal-overstimulasi
status: evergreen
tags: [neurodiversity, code]
created: 2026-11-13
updated: 2026-11-13
summary: "Palet kalem, prompt pendek, dan tata letak yang tidak berisik untuk sesi kerja yang lebih tenang."
---

Terminal adalah tempat saya paling lama berada saat bekerja. Bagi saya, kelelahan sering datang bukan dari tugasnya, melainkan dari layar yang terus bergerak: kursor berkedip, prompt panjang, status bar penuh angka, dan warna yang saling berebut perhatian.

Catatan ini bukan panduan universal. Ini yang akhirnya bekerja untuk saya.

## Prinsipnya

- **Satu warna aksen.** Sisanya abu-abu hangat. Kalau semuanya penting, tidak ada yang penting.
- **Prompt pendek.** Direktori dan penanda git sudah cukup. Tidak perlu nama pengguna, nama mesin, versi bahasa, dan jam sekaligus.
- **Tidak ada animasi.** Kursor yang berkedip dan transisi halus terasa seperti gangguan kecil yang menumpuk.
- **Kontras cukup, bukan menyala.** Latar tidak benar-benar hitam dan teks tidak benar-benar putih.

## Contoh prompt

```bash
PS1='\w \$ '
```

Untuk git, saya menambahkan satu penanda kecil agar tetap tahu sedang di cabang mana tanpa membaca teks panjang:

```bash
parse_git_branch() {
  git branch --show-current 2>/dev/null
}

PS1='\w$(b=$(parse_git_branch); [ -n "$b" ] && printf " (%s)" "$b") \$ '
```

## Yang saya matikan

- Kursor berkedip, bila terminal mendukungnya.
- Judul jendela yang berubah setiap kali direktori berganti.
- Status bar penuh jam, beban CPU, dan daftar sesi. Saya hanya menyisakan nama jendela.
- Notifikasi visual untuk hal yang tidak perlu saya tindak lanjuti saat itu.

## Kalau ingin mencoba

1. Kurangi satu elemen dulu, jangan sepuluh sekaligus.
2. Pakai selama beberapa hari sebelum menilai.
3. Simpan konfigurasi lama agar bisa kembali tanpa rasa kehilangan.

## Bukan aturan

Ada hari ketika terminal yang ramai justru membantu karena memberi banyak informasi di satu tempat. Yang penting adalah pilihan itu sadar, bukan bawaan yang tidak pernah dipertanyakan.
