# Struktur Google Drive untuk Facility Report Apps

Aplikasi ini memerlukan struktur Google Drive sebagai berikut:

```
Facility Report Apps/              ← Folder utama di Google Drive
│
├── Evidence/                      ← Folder penyimpanan bukti foto
│    └── Image Evidence/           ← Subfolder khusus untuk foto
│
├── Report (Spreadsheet)           ← Sheet utama laporan fasilitas
│
├── tb_M_Facility (Spreadsheet)    ← Master data facility
│
└── tb_M_Users (Spreadsheet)       ← Master data pengguna
```

### Penjelasan:

* **Evidence/Image Evidence**
  Semua foto yang diupload melalui form reporter disimpan dalam folder ini.

* **Report**
  File spreadsheet yang menyimpan laporan berupa:

  * Timestamp
  * Facility ID
  * Facility Name
  * Location
  * Problem
  * Photos
  * Reporter

* **tb_M_Facility**
  Menyimpan master facility:

  * ID
  * Name
  * Location
  * Description

* **tb_M_Users**
  Menyimpan authorized users:

  * User ID
  * Name
  * NIK / Employee ID
  * Role
