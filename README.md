<div align="center">

---

## Daftar Isi

1. [Tentang Proyek](#1-tentang-proyek)
2. [Fitur](#2-fitur)
3. [Teknologi](#3-teknologi)
4. [Struktur Proyek](#4-struktur-proyek)
5. [Prasyarat](#5-prasyarat)
6. [Instalasi dan Menjalankan](#6-instalasi-dan-menjalankan)
7. [Konfigurasi](#7-konfigurasi)
8. [Panduan Penggunaan](#8-panduan-penggunaan)
9. [Arsitektur dan Alur Data](#9-arsitektur-dan-alur-data)
10. [Database](#10-database)
11. [Referensi REST API](#11-referensi-rest-api)
12. [Arsitektur Frontend](#12-arsitektur-frontend)
13. [Deployment](#13-deployment)
14. [Backup dan Restore](#14-backup-dan-restore)
15. [Keamanan](#15-keamanan)
16. [Troubleshooting](#16-troubleshooting)
17. [Batasan yang Diketahui dan Pengembangan Lanjutan](#17-batasan-yang-diketahui-dan-pengembangan-lanjutan)

---

## 1. Tentang Proyek

Dompetku adalah aplikasi web full-stack untuk mengelola keuangan pribadi dalam periode bulanan. Semua angka di dashboard dihitung dari transaksi yang benar-benar kamu catat. Aplikasi ini **tidak menggunakan data dummy**. Kategori dan budget awal hanyalah contoh yang bisa diubah atau dihapus.

Mata uang yang digunakan adalah Rupiah (IDR) dengan format `Rp1.000.000`.

Proyek ini terdiri dari tiga lapisan:

| Lapisan  | Teknologi                   | Peran                                |
| -------- | --------------------------- | ------------------------------------ |
| Frontend | React + Vite + Chart.js     | Tampilan, interaksi, dan grafik      |
| Backend  | Node.js + Express           | REST API dan validasi data           |
| Database | SQLite (`better-sqlite3`) | Penyimpanan permanen dalam satu file |

---

## 2. Fitur

### Dashboard

- Empat kartu ringkasan: **Total Pemasukan**, **Total Pengeluaran**, **Sisa Saldo** (termasuk saldo awal), dan **Total Transaksi**.
- Empat grafik interaktif:
  - Pemasukan vs pengeluaran per tanggal (batang)
  - Pengeluaran per kategori beserta persentasenya (doughnut)
  - Tren pengeluaran harian (garis)
  - Aktivitas: hari dengan pengeluaran tertinggi dan terendah
- Daftar lima transaksi terbaru.

### Transaksi

- Form tambah dan edit dengan **subkategori yang berubah otomatis** mengikuti kategori.
- Jenis: pemasukan atau pengeluaran. Metode bayar: Cash, Transfer, E-Wallet, atau Lainnya.
- Kolom deskripsi bisa dipakai sebagai nama kegiatan manual (misalnya untuk kategori Date Bareng Pacar).
- Validasi nominal (harus lebih dari 0) di frontend dan backend. Setiap transaksi punya ID unik (UUID).

### Riwayat Transaksi

- Urut dari tanggal terbaru, dengan pembeda warna untuk pemasukan (hijau) dan pengeluaran (merah).
- Pencarian nama atau deskripsi, filter jenis, filter kategori, dan pilihan **bulan terpilih** atau **semua bulan**.
- Edit dan hapus langsung dari daftar.

### Kategori

- Kategori dan subkategori untuk pemasukan dan pengeluaran bisa **ditambah, diedit, dan dihapus**.
- Mengganti nama kategori ikut memperbarui transaksi lama dan budget terkait.

### Budget Bulanan

- Batas pengeluaran per kategori yang bisa diubah kapan saja.
- Persentase pemakaian, sisa budget, indikator oranye saat pemakaian mencapai 80% atau lebih, dan peringatan merah saat melebihi budget.

### Analisis Keuangan

- Insight otomatis dari data nyata: kategori terbesar, total pengeluaran bersama teman, total pengeluaran date, rata-rata per hari, hari tertinggi, pemasukan vs pengeluaran, persentase uang yang ditabung, dan kategori paling sering dipakai.
- Tabel **rekapitulasi semua bulan** untuk membandingkan kondisi keuangan antarbulan.

### Pengaturan dan Data

- Saldo awal, tema terang atau gelap (mengikuti pengaturan perangkat secara default).
- **Unduh CSV** (bisa dibuka di Excel) dan **unduh backup JSON**.
- Restore dari file `.json` atau teks, dan reset semua data.

### Desain

- Layout sidebar kiri, kartu bersudut membulat, animasi ringan antar halaman.
- Responsif untuk desktop, tablet, dan smartphone (sidebar berubah menjadi bar navigasi bawah di layar kecil).

---

## 3. Teknologi

| Bagian     | Paket                              | Versi      |
| ---------- | ---------------------------------- | ---------- |
| UI         | `react`, `react-dom`           | ^18.3      |
| Build tool | `vite`, `@vitejs/plugin-react` | ^5.4, ^4.3 |
| Grafik     | `chart.js`, `react-chartjs-2`  | ^4.4, ^5.2 |
| Server     | `express`                        | ^4.19      |
| Database   | `better-sqlite3`                 | ^11.3      |

---

## 4. Struktur Proyek

```
dompetku/
├── server.js                  # Backend: Express, REST API, SQLite
├── package.json               # Dependensi backend dan script utama
├── README.md
├── data/                      # (otomatis) berisi dompetku.db
│
├── client/                    # Frontend React (Vite)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js         # Proxy /api ke localhost:3000 saat development
│   └── src/
│       ├── main.jsx           # Entry point
│       ├── App.jsx            # Layout, pemilih bulan, pergantian halaman
│       ├── store.jsx          # State global dan semua panggilan API (useFinance)
│       ├── ui.jsx             # Toast, dialog input/konfirmasi, tema (useUI)
│       ├── api.js             # Helper fetch
│       ├── utils.js           # Format Rupiah, tanggal, helper hitung
│       ├── defaults.js        # Kategori dan budget awal
│       ├── chartSetup.js      # Registrasi dan tema Chart.js
│       ├── styles.css         # Seluruh gaya (design tokens, light/dark)
│       ├── components/        # Komponen reusable
│       │   ├── Sidebar.jsx
│       │   ├── SummaryCard.jsx
│       │   ├── ChartCard.jsx
│       │   ├── TxRow.jsx
│       │   ├── TxForm.jsx
│       │   └── Modal.jsx
│       └── pages/             # Satu file per halaman
│           ├── Dashboard.jsx
│           ├── History.jsx
│           ├── Categories.jsx
│           ├── Budget.jsx
│           ├── Analysis.jsx
│           └── Settings.jsx
│
└── standalone/
    └── dompetku.html          # Versi satu file tanpa backend (localStorage)
```

---

## 5. Prasyarat

- **Node.js 18 atau lebih baru** (cek dengan `node -v`)
- **npm** (sudah termasuk dalam Node.js)
- Koneksi internet saat `npm install` (untuk mengunduh paket, termasuk binary prebuilt `better-sqlite3`)

---

## 6. Instalasi dan Menjalankan

### Mode produksi (satu server)

```bash
# 1. Masuk ke folder proyek
cd dompetku

# 2. Pasang dependensi backend dan frontend
npm run install:all

# 3. Build frontend React menjadi client/dist
npm run build

# 4. Jalankan server
npm start
```

Buka **http://localhost:3000**. Express menyajikan API sekaligus hasil build React, dan file database `data/dompetku.db` dibuat otomatis saat pertama kali jalan.

### Mode development (hot reload)

Buka dua terminal:

```bash
# Terminal 1: backend di http://localhost:3000
npm run server

# Terminal 2: frontend di http://localhost:5173
npm run client
```

Buka **http://localhost:5173**. Vite meneruskan semua request `/api/*` ke backend di port 3000.

### Script yang tersedia

| Perintah                           | Fungsi                                         |
| ---------------------------------- | ---------------------------------------------- |
| `npm run install:all`            | Memasang dependensi root dan `client/`       |
| `npm run build`                  | Build frontend ke `client/dist`              |
| `npm start` / `npm run server` | Menjalankan backend (dan frontend hasil build) |
| `npm run client`                 | Menjalankan Vite dev server                    |

---

## 7. Konfigurasi

Konfigurasi dilakukan lewat environment variable:

| Variabel         | Default                | Keterangan                                                                                               |
| ---------------- | ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `PORT`         | `3000`               | Port server                                                                                              |
| `DB_FILE`      | `./data/dompetku.db` | Lokasi file database SQLite                                                                              |
| `APP_PASSWORD` | *(kosong)*           | Jika diisi, seluruh aplikasi dilindungi Basic Auth. Username bebas, password harus sama dengan nilai ini |

Contoh:

```bash
PORT=8080 DB_FILE=/var/data/dompetku.db APP_PASSWORD=rahasia123 npm start
```

---

## 8. Panduan Penggunaan

1. **Pilih bulan** lewat pemilih bulan di kanan atas. Semua halaman mengikuti bulan yang dipilih, dan data bulan lain tetap tersimpan.
2. **Atur kategori** (opsional) di menu *Kategori*. Sesuaikan dengan kebiasaanmu sebelum mulai mencatat.
3. **Isi saldo awal** (opsional) di *Pengaturan* jika ingin saldo awal ikut dihitung di Sisa Saldo.
4. **Catat transaksi** lewat tombol **+ Tambah Transaksi** (tersedia di sidebar dan pojok kanan atas). Pilih jenis, isi nominal, kategori, subkategori, tanggal, dan deskripsi.
5. **Pantau budget** di *Budget Bulanan*. Isi batas per kategori, lalu perhatikan indikator warna:
   - 🟢 hijau: di bawah 80%
   - 🟠 oranye: 80% sampai 100%
   - 🔴 merah: melebihi budget
6. **Cari dan koreksi transaksi** di *Riwayat Transaksi* dengan filter dan tombol ✏️ atau 🗑️.
7. **Lihat insight** dan perbandingan antarbulan di *Analisis Keuangan*.
8. **Amankan data** secara berkala lewat *Pengaturan* dengan **Unduh Backup JSON**.

---

## 9. Arsitektur dan Alur Data

```
┌──────────────────────────┐        HTTP / JSON         ┌─────────────────────────┐
│  React (browser)         │  ───────────────────────▶  │  Express (server.js)    │
│  store.jsx (useFinance)  │  ◀───────────────────────  │  validasi + REST API    │
└──────────────────────────┘                            └───────────┬─────────────┘
                                                                    │ better-sqlite3
                                                        ┌───────────▼─────────────┐
                                                        │  SQLite: dompetku.db    │
                                                        └─────────────────────────┘
```

- Saat aplikasi dibuka, frontend memanggil `GET /api/data` dan menyimpan hasilnya di state React.
- **Transaksi** disimpan dulu ke server (`POST /api/tx`). State di browser baru diperbarui setelah server berhasil, sehingga tampilan selalu sama dengan isi database.
- **Pengaturan** (saldo awal, budget, kategori) disimpan ke server dengan jeda singkat (debounce 250 ms) supaya tidak membanjiri server saat mengetik.
- Seluruh ringkasan dan grafik dihitung di frontend dari data transaksi, sehingga langsung berubah setiap ada perubahan.
- Pada pertama kali dibuka dengan database kosong, frontend mengirim kategori dan budget awal ke server.

---

## 10. Database

SQLite dengan mode WAL. Skema dibuat otomatis oleh `server.js`.

### Tabel `transactions`

| Kolom      | Tipe     | Keterangan                                                 |
| ---------- | -------- | ---------------------------------------------------------- |
| `id`     | TEXT, PK | UUID transaksi                                             |
| `ts`     | INTEGER  | Waktu pembuatan (ms) untuk pengurutan                      |
| `type`   | TEXT     | `income` atau `expense`                                |
| `amount` | INTEGER  | Rupiah, **harus lebih dari 0** (constraint database) |
| `cat`    | TEXT     | Nama kategori                                              |
| `sub`    | TEXT     | Nama subkategori (boleh kosong)                            |
| `date`   | TEXT     | Format `YYYY-MM-DD`, ber-index                           |
| `desc`   | TEXT     | Deskripsi / nama kegiatan (maks. 120 karakter)             |
| `method` | TEXT     | Cash, Transfer, E-Wallet, atau Lainnya                     |

### Tabel `kv`

Menyimpan pengaturan sebagai JSON:

| Key           | Isi                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| `saldoAwal` | Angka saldo awal                                                                                          |
| `budget`    | Objek `{ "Nama Kategori": nominal }`. Berlaku sama untuk semua bulan                                    |
| `cats`      | Objek `{ income: {...}, expense: {...} }`, tiap kategori berisi `{ i: "emoji", s: ["sub1", "sub2"] }` |

---

## 11. Referensi REST API

Semua request dan response berformat JSON, kecuali endpoint unduhan.

### `GET /api/data`

Mengambil seluruh data.

```json
{
  "tx": [{ "id": "…", "ts": 1795076552062, "type": "expense", "amount": 25000,
           "cat": "Makan di Luar", "sub": "Makan Siang", "date": "2026-11-19",
           "desc": "Nasi goreng", "method": "Cash" }],
  "saldoAwal": 0,
  "budget": { "Makan di Luar": 400000 },
  "cats": { "income": { }, "expense": { } }
}
```

`cats` bernilai `null` jika database masih kosong.

### `POST /api/tx`

Menambah transaksi baru atau memperbarui transaksi dengan `id` yang sama.

```bash
curl -X POST http://localhost:3000/api/tx \
  -H "Content-Type: application/json" \
  -d '{"id":"abc-1","type":"expense","amount":25000,"cat":"Makan di Luar",
       "sub":"Sarapan","date":"2026-11-19","desc":"Bubur","method":"Cash"}'
```

| Respons                | Keterangan                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `200 {"ok":true}`    | Berhasil                                                                                               |
| `400 {"error":"…"}` | Validasi gagal: nominal ≤ 0, tanggal bukan `YYYY-MM-DD`, jenis tidak valid, ID atau kategori kosong |

### `DELETE /api/tx/:id`

Menghapus transaksi. Respons: `{"ok":true}`.

### `PUT /api/settings`

Menyimpan saldo awal, budget, dan kategori.

```json
{ "saldoAwal": 500000, "budget": { "Token Listrik": 100000 }, "cats": { "income": {}, "expense": {} } }
```

### `POST /api/rename`

Mengganti nama kategori pada semua transaksi lama.

```json
{ "type": "expense", "from": "Transportasi", "to": "Transport" }
```

### `POST /api/restore`

Mengganti **seluruh** isi database dengan data backup (dalam satu transaksi database; jika ada satu baris tidak valid, tidak ada yang berubah). Body berformat sama dengan hasil `GET /api/backup.json`.

### `GET /api/backup.json`

Mengunduh file `dompetku-backup.json`.

### `GET /api/export.csv`

Mengunduh `laporan-keuangan.csv` (UTF-8 dengan BOM agar terbaca benar di Excel) dengan kolom: Tanggal, Jenis, Kategori, Subkategori, Deskripsi, Metode, Nominal.

---

## 12. Arsitektur Frontend

- **`store.jsx`** menyediakan `useFinance()`: `S` (data), `M` (bulan terpilih), `monthTx` (transaksi bulan terpilih), serta aksi `saveTx`, `delTx`, `upd` (ubah pengaturan), `renameCat`, dan `restore`. Semua komunikasi ke backend hanya lewat file ini.
- **`ui.jsx`** menyediakan `useUI()`: `toast(pesan)`, `ask(judul, nilaiAwal, konfirmasi)` yang mengembalikan Promise (menggantikan `prompt` dan `confirm` bawaan browser), serta `theme` dan `setTheme`.
- **Komponen reusable** ada di `components/`, sedangkan **halaman** ada di `pages/`, masing-masing satu file.
- **Tema** memakai CSS variables di `styles.css`. Mode gelap otomatis mengikuti perangkat, dan bisa diubah manual di Pengaturan.

Menambah halaman baru: buat file di `pages/`, daftarkan di objek `PAGES` pada `App.jsx`, lalu tambahkan menunya di `components/Sidebar.jsx`.

---

## 13. Deployment

Karena aplikasi memakai SQLite (file lokal), pilih hosting yang menyediakan **penyimpanan persisten** (VPS, atau platform dengan volume).

### VPS dengan PM2

```bash
npm run install:all && npm run build
npm install -g pm2
APP_PASSWORD=rahasia123 PORT=3000 pm2 start server.js --name dompetku
pm2 save && pm2 startup
```

Letakkan Nginx atau Caddy di depannya untuk HTTPS.

### GitHub Pages (mode demo, tanpa backend)

GitHub Pages hanya menyajikan file statis, jadi Express dan SQLite tidak bisa berjalan di sana. Sebagai gantinya, frontend React punya **mode statis** (`VITE_STATIC=true`): API ditiru di `client/src/api.js` dengan `localStorage`, sehingga seluruh fitur tetap berfungsi. Data tersimpan **di browser masing-masing pengunjung**, bukan di server.

Deploy otomatis sudah disiapkan di `.github/workflows/pages.yml`:

1. Push proyek ke GitHub (branch `master` atau `main`).
2. Buka repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Setiap push akan membangun dan men-deploy ke `https://<username>.github.io/<nama-repo>/`.

Mencoba build mode ini secara lokal (PowerShell):

```powershell
cd client
$env:VITE_STATIC="true"; $env:VITE_BASE="/Dompetku/"
npm run build
npm run preview
```

### Platform PaaS (Railway, Render, Fly.io, dan sejenisnya)

- Build command: `npm run install:all && npm run build`
- Start command: `npm start`
- Pasang **volume persisten** dan arahkan `DB_FILE` ke dalamnya (misalnya `DB_FILE=/data/dompetku.db`). Tanpa volume, database akan hilang setiap deploy ulang.
- Set `APP_PASSWORD` di pengaturan environment.

---

## 14. Backup dan Restore

**Dari aplikasi (disarankan):** menu *Pengaturan* → **Unduh Backup JSON**. Untuk memulihkan, pilih file `.json` atau tempel isinya, lalu klik **Restore**.

**Dari server:** hentikan server, lalu salin file `data/dompetku.db` (beserta `dompetku.db-wal` dan `dompetku.db-shm` jika ada).

> ⚠️ Restore dan *Hapus semua data* menimpa seluruh isi database. Unduh backup terlebih dahulu.

---

## 15. Keamanan

- Aplikasi **belum memiliki sistem akun pengguna**. Satu server berarti satu set data keuangan.
- Jika diakses dari internet, **aktifkan `APP_PASSWORD`** dan pasang **HTTPS**, karena Basic Auth mengirim password dalam bentuk yang mudah dibaca jika tanpa HTTPS.
- Query database memakai prepared statement, sehingga aman dari SQL injection. Teks yang tampil di UI di-escape oleh React.
- Backend memvalidasi ulang semua input, tidak hanya mengandalkan validasi di browser.

---

## 16. Troubleshooting

| Masalah                                        | Penyebab dan solusi                                                                                                                                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm install` gagal pada `better-sqlite3`  | Pastikan Node.js 18 atau lebih baru. Jika tidak ada binary prebuilt untuk platformmu, pasang build tools (Windows: *Visual Studio Build Tools*, Linux: `build-essential` dan `python3`), lalu ulangi |
| Halaman menampilkan "Server tidak terjangkau"  | Backend belum jalan. Jalankan `npm start` (atau `npm run server` saat development)                                                                                                                     |
| Halaman kosong / `Cannot GET /`              | Frontend belum di-build. Jalankan `npm run build`                                                                                                                                                        |
| `EADDRINUSE` (port dipakai)                  | Gunakan port lain: `PORT=3001 npm start`                                                                                                                                                                 |
| Data tidak muncul setelah pindah server        | Database ada di `data/dompetku.db` per server. Pindahkan file tersebut atau gunakan backup JSON                                                                                                          |
| Setelah deploy data hilang                     | Platform tidak punya penyimpanan persisten. Pasang volume dan set `DB_FILE`                                                                                                                              |
| Perubahan frontend tidak terlihat di port 3000 | Port 3000 menyajikan hasil build. Jalankan `npm run build` lagi, atau gunakan port 5173 saat development                                                                                                 |

---

## 17. Batasan yang Diketahui dan Pengembangan Lanjutan

**Batasan saat ini**

- Single-user, tanpa login per akun.
- Budget berlaku sama untuk semua bulan (belum ada budget terpisah per bulan).
- Belum ada pengujian otomatis (unit atau end-to-end).

**Ide pengembangan**

- Autentikasi multi-user (misalnya JWT) dengan data terpisah per pengguna.
- Budget per bulan dan transaksi berulang (langganan, cicilan).
- Target tabungan dan notifikasi budget.
- Migrasi ke PostgreSQL atau Supabase untuk penggunaan multi-perangkat dengan banyak pengguna.
- Impor transaksi dari CSV atau mutasi bank, serta dukungan upload struk.
- Pengujian dengan Vitest dan Playwright.

---

<div align="center">
