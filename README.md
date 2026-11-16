# APJIKI/RamaLabs - Audit dan Prediksi Jurnal 2026 (v5)

Aplikasi static GitHub Pages dengan audit OJS lintas domain melalui Cloudflare Worker, verifikasi Crossref/DataCite, prediksi awal 32 sub-unsur, dan review manual. Copyright © 2026 ramalabs.

**Langkah instalasi:** Unggah `index.html`, `intelligence.js`, `instrumen.json` ke root repo GitHub Pages. Untuk audit OJS yang berfungsi pada situs dengan CORS tertutup, deploy `worker/` sesuai [DEPLOY-WORKER.md](DEPLOY-WORKER.md). Fitur audit OJS **tidak dapat dijamin berfungsi dari GitHub Pages tanpa Worker**; hal ini adalah batas keamanan browser, bukan kesalahan pengaturan tombol.

Perubahan: audit dan prediksi langsung satu klik; opsi `Prediksi 32 sub-unsur` tetap tersedia; metadata DOI mengecek Crossref lalu DataCite, dan membedakan 404 metadata dari DOI tidak valid; token hanya untuk AI. Nilai otomatis adalah hipotesis awal yang wajib ditinjau terhadap bukti. Peringkat resmi tidak dihasilkan oleh aplikasi.
