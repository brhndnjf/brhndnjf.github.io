---
title: "Snippet Shell untuk Automasi Backup"
slug: snippet-backup-shell
status: seedling
tags: [code]
created: 2026-11-13
updated: 2026-11-13
summary: "Skrip pendek untuk menyalin berkas penting tanpa mengingat perintah panjang setiap kali."
---

Ini benih dari kebiasaan yang ingin saya rapikan: menyalin berkas penting ke disk eksternal tanpa harus mengingat perintah `rsync` yang panjang.

## Snippet

```bash
#!/usr/bin/env bash
set -euo pipefail

SRC="$HOME/Documents"
DST="/media/backup/documents"

mkdir -p "$DST"
rsync -av --delete "$SRC/" "$DST/"
```

## Kenapa begini

- `set -euo pipefail` menghentikan skrip saat ada langkah yang gagal, alih-alih melanjutkan diam-diam.
- Garis miring di akhir `$SRC/` berarti isi folder yang disalin, bukan foldernya.
- `--delete` membuat tujuan sama persis dengan sumber. Ini berguna, tetapi juga berbahaya bila salah menulis `$DST`.

Sebelum menjalankan versi yang sebenarnya, coba dulu:

```bash
rsync -av --delete --dry-run "$SRC/" "$DST/"
```

## Yang belum ada

- Pemeriksaan bahwa disk backup benar-benar terpasang.
- Log hasil ke berkas.
- Jadwal otomatis.
- Verifikasi bahwa berkas bisa dibuka kembali.

Sampai semua itu ada, skrip ini hanya alat bantu, bukan backup yang bisa diandalkan sendirian.
