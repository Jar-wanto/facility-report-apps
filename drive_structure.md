# Struktur Google Drive untuk Facility Report Apps

Aplikasi ini memerlukan struktur Google Drive sebagai berikut:

```
Facility Report Apps/              ← Folder utama di Google Drive
│
├── Evidence/                      ← Folder penyimpanan bukti foto
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

* **Important** sheet name : **Reports**

  * timestamp
  * facilityId
  * facilityName
  * location
  * problem
  * expectedCondition
  * photosUrls
  * status

* **tb_M_Facility**
  Menyimpan master facility:
* **Important** sheet name : **Facilities**

  * facilityId
  * facilityName
  * location

* **tb_M_Users**
  Menyimpan authorized users
* **Important** sheet name : **Users**

  * username
  * password
  * Role
