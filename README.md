<<<<<<< HEAD
# Facility Report Apps – Google Apps Script Project

Aplikasi **Facility Report Apps** adalah sistem pelaporan fasilitas berbasis **Google Apps Script**, **Google Drive**, dan **Google Spreadsheet**.
Aplikasi ini terdiri dari:

* Form pelapor (ReporterForm)
* Dashboard Admin (AdminDashboard)
* Progress Viewer
* Integrasi dengan penyimpanan foto di Google Drive
* Master data facility & user dalam Spreadsheet

## 📁 Struktur Repository

```
facility-report-apps/
│
├── src/                 # Semua source code Apps Script
│    ├── Code.gs
│    ├── Index.html
│    ├── AdminDashboard.html
│    ├── ProgressViewer.html
│    ├── ReporterForm.html
│    └── appsscript.json
│
├── drive_structure.md   # Struktur folder Google Drive yang digunakan aplikasi
└── .clasp.json          # Konfigurasi CLASP untuk sinkronisasi Apps Script
```

## 🚀 Deployment & CLASP

Untuk melakukan sinkronisasi kode:

### Clone project dari Apps Script

```
clasp clone <SCRIPT_ID>
```

### Push perubahan ke Apps Script

```
clasp push
```

### Pull perubahan dari Apps Script

```
clasp pull
```

Pastikan sudah login:

```
clasp login
```

## 🗃 Integrasi Google Drive & Spreadsheet

Aplikasi ini menggunakan struktur Google Drive berikut:

* Folder **Evidence/Image Evidence** untuk menyimpan foto laporan
* Spreadsheet **Report** untuk mencatat laporan
* Spreadsheet **tb_M_Facility** untuk master facility
* Spreadsheet **tb_M_Users** untuk master user

Detail lengkap ada di `drive_structure.md`.

## 🧩 Teknologi

* Google Apps Script (HTML Service + Web App)
* Google Spreadsheet
* Google Drive
=======
# Facility-Report-Apps
Simple Apps for Facility Reporting using Google Appscript.
>>>>>>> 1e9acee4f675928f231d47be2ba4224417dbe9ad
