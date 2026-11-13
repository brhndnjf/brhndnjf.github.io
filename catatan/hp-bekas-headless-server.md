---
title: "Repurposing HP Bekas Jadi Headless Server"
slug: hp-bekas-headless-server
status: budding
tags: [hardware, journal]
created: 2026-11-13
updated: 2026-11-13
summary: "Langkah awal menjadikan ponsel lama sebagai server kecil di rumah — daya kecil, manfaat nyata."
---

Ponsel lama biasanya masih punya CPU yang jauh lebih cepat daripada yang dibutuhkan untuk tugas rumah tangga sederhana. Yang sering menjadi masalah bukan performanya, tetapi layar yang rusak, baterai yang menua, dan sistem yang tidak lagi diperbarui.

Catatan ini masih tumbuh. Saya menulis apa yang sudah dicoba, bukan resep yang selesai.

## Kenapa ponsel

- Konsumsi daya kecil dibandingkan laptop yang menyala terus.
- Sudah punya baterai, jadi semacam UPS bawaan.
- Koneksi Wi-Fi dan penyimpanan sudah ada.

Yang perlu diingat: baterai yang terus terisi penuh sambil menyala bisa mengembung. Kalau perangkat akan dipakai menetap, pertimbangkan melepas baterai dan memberi daya langsung bila aman, atau memakai perangkat yang baterainya masih sehat dan tidak ditinggal tanpa pengawasan.

## Dua jalur

### Termux tanpa root

Jalur paling cepat. Termux memberi shell Linux di Android tanpa mengubah sistem.

```bash
pkg update && pkg upgrade
pkg install openssh
passwd
sshd
```

Setelah itu cari alamat IP lokal ponsel dan masuk dari komputer:

```bash
ssh -p 8022 nama-pengguna@192.168.1.x
```

Port bawaan sshd Termux adalah 8022. Jangan membuka port ini ke internet.

### Sistem Linux penuh

Untuk eksperimen yang lebih serius, ponsel bisa dipasangi distribusi Linux. Ini lebih rapuh: dukungan perangkat berbeda-beda, kamera dan modem sering tidak berfungsi, dan pembaruan bisa memutus akses. Saya belum menjadikannya perangkat utama.

## Yang sudah jalan

- SSH dari laptop ke ponsel di jaringan rumah.
- Sinkronisasi berkas kecil secara manual.
- Satu layanan web ringan untuk diakses dari perangkat lain di rumah.

## Jebakan yang saya temui

- Android mematikan proses latar belakang untuk menghemat daya. Termux perlu dikecualikan dari optimasi baterai.
- Alamat IP bisa berubah setelah ponsel tidur. Reservasi DHCP di router membantu.
- Kunci layar dan mode hemat daya bisa memutus sesi SSH.
- Tanpa pendinginan, ponsel bisa panas saat tugas berat.

## Langkah berikutnya

- Menjadwalkan backup otomatis ke disk eksternal.
- Menulis unit layanan yang bisa hidup kembali setelah reboot.
- Mengukur suhu dan daya selama seminggu.

Statusnya masih tumbuh karena bagian terakhir belum selesai.
