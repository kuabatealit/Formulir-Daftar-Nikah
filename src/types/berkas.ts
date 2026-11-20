import type { Timestamp } from 'firebase/firestore';

export type JenisWilayah = 'Desa' | 'Kelurahan';
export type PihakPengaju = 'pria' | 'wanita' | 'keduanya';
export type StatusBerkas = 'draft' | 'lengkap' | 'diarsipkan';
export type JenisKelamin = 'Laki-laki' | 'Perempuan';
export type StatusHidup = 'Hidup' | 'Almarhum' | 'Almarhumah';
export type JenisWali = 'Wali Nasab' | 'Wali Hakim';
export type PemberiKuasa = 'Catin Pria' | 'Catin Wanita' | 'Keduanya';
export type PemohonSptjm = 'Catin Pria' | 'Catin Wanita';
export type PembayarMaskawin = 'Tunai' | 'Hutang';

export type DocumentTypeId =
  | 'n1'
  | 'n2'
  | 'n4'
  | 'n5'
  | 'sptjm'
  | 'kuasa'
  | 'belum_menikah'
  | 'wali_nikah';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  defaultDesa: string;
  defaultKecamatan: string;
  defaultKabupaten: string;
  defaultProvinsi: string;
  defaultKua: string;
  defaultKepalaDesa: string;
  defaultNipKepalaDesa: string;
  defaultJabatanDesa: string;
  defaultAlamatKantorDesa: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface DesaKuaInfo {
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  jenisWilayah: JenisWilayah;
  alamatKantorDesa: string;
  namaKepalaDesa: string;
  jabatanPejabat: string;
  nipPejabat: string;
  namaKua: string;
  alamatKua: string;
  nomorN1: string;
  nomorWali: string;
  tanggalSurat: string;
  tempatSurat: string;
  pihakPengaju: PihakPengaju;
}

export interface PersonBiodata {
  namaLengkap: string;
  binBinti: string;
  nik: string;
  jenisKelamin: JenisKelamin;
  tempatLahir: string;
  tanggalLahir: string;
  kewarganegaraan: string;
  agama: string;
  pekerjaan: string;
  alamat: string;
  statusPerkawinan: string;
  istriKe: string;
  namaPasanganSebelumnya: string;
}

export interface ParentBiodata {
  namaLengkap: string;
  binBinti: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  kewarganegaraan: string;
  agama: string;
  pekerjaan: string;
  alamat: string;
  statusHidup: StatusHidup;
}

export interface WaliNikahData {
  jenisWali: JenisWali;
  hubunganWali: string;
  sebabWali: string;
  namaLengkap: string;
  bin: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  kewarganegaraan: string;
  agama: string;
  pekerjaan: string;
  alamat: string;
  nomorTelepon: string;
}

export interface RencanaNikahData {
  hariNikah: string;
  tanggalNikah: string;
  jamNikah: string;
  tempatAkad: string;
  alamatAkad: string;
  maskawin: string;
  pembayarMaskawin: PembayarMaskawin;
}

export interface SuratKuasaData {
  pemberiKuasa: PemberiKuasa;
  penerimaNama: string;
  penerimaNik: string;
  penerimaTempatLahir: string;
  penerimaTanggalLahir: string;
  penerimaPekerjaan: string;
  penerimaAlamat: string;
  penerimaHubungan: string;
  keperluanKuasa: string;
}

export interface SptjmData {
  pemohon: PemohonSptjm;
  saksi1Nama: string;
  saksi1Nik: string;
  saksi2Nama: string;
  saksi2Nik: string;
}

export interface BerkasNikahData {
  ownerId: string;
  kodeBerkas: string;
  status: StatusBerkas;
  catatan: string;
  desa: DesaKuaInfo;
  catinPria: PersonBiodata;
  catinWanita: PersonBiodata;
  ayahPria: ParentBiodata;
  ibuPria: ParentBiodata;
  ayahWanita: ParentBiodata;
  ibuWanita: ParentBiodata;
  waliNikah: WaliNikahData;
  rencanaNikah: RencanaNikahData;
  suratKuasa: SuratKuasaData;
  sptjm: SptjmData;
}

export interface BerkasNikahRecord extends BerkasNikahData {
  id: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface DocumentCatalogItem {
  id: DocumentTypeId;
  code: string;
  title: string;
  shortTitle: string;
  regulation: string;
  supportsPartySwitch?: boolean;
}

export const DOCUMENT_CATALOG: DocumentCatalogItem[] = [
  {
    id: 'n1',
    code: 'Model N1',
    title: 'Formulir Pengantar Nikah',
    shortTitle: 'Form N1 — Pengantar Nikah',
    regulation: 'Lampiran IV Kepdirjen Bimas Islam No. 473 Th. 2020',
    supportsPartySwitch: true,
  },
  {
    id: 'n2',
    code: 'Model N2',
    title: 'Formulir Permohonan Kehendak Nikah',
    shortTitle: 'Form N2 — Permohonan Kehendak Nikah',
    regulation: 'Lampiran V Kepdirjen Bimas Islam No. 473 Th. 2020',
  },
  {
    id: 'n4',
    code: 'Model N4',
    title: 'Formulir Persetujuan Calon Pengantin',
    shortTitle: 'Form N4 — Persetujuan Catin',
    regulation: 'Lampiran VI Kepdirjen Bimas Islam No. 473 Th. 2020',
  },
  {
    id: 'n5',
    code: 'Model N5',
    title: 'Formulir Surat Izin Orang Tua',
    shortTitle: 'Form N5 — Izin Orang Tua',
    regulation: 'Lampiran VII Kepdirjen Bimas Islam No. 473 Th. 2020',
    supportsPartySwitch: true,
  },
  {
    id: 'sptjm',
    code: 'SPTJM',
    title: 'Surat Pernyataan Pertanggungjawaban Mutlak',
    shortTitle: 'SPTJM Pemeriksaan Berkas Catin',
    regulation: 'Standar Verifikasi Berkas KUA (PMA Pencatatan Nikah)',
  },
  {
    id: 'kuasa',
    code: 'Kuasa',
    title: 'Surat Kuasa Pengurusan Nikah',
    shortTitle: 'Surat Kuasa Pendaftaran Nikah',
    regulation: 'Kuasa Pendaftaran Kehendak Nikah ke KUA',
  },
  {
    id: 'belum_menikah',
    code: 'Status',
    title: 'Surat Pernyataan Belum Pernah Menikah',
    shortTitle: 'Pernyataan Belum Pernah Menikah',
    regulation: 'Surat Pernyataan Status Perkawinan Bermeterai',
    supportsPartySwitch: true,
  },
  {
    id: 'wali_nikah',
    code: 'Wali',
    title: 'Surat Keterangan Wali Nikah dari Desa',
    shortTitle: 'Surat Keterangan Wali Nikah',
    regulation: 'Keterangan Resmi Kepala Desa / Lurah Setempat',
  },
];

// Helpers for Indonesian date formatting and age calculation
const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const HARI_ID = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
];

export function formatTanggalIndonesia(dateStr?: string): string {
  if (!dateStr) return '....................';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) || month < 0 || month > 11) {
    return dateStr;
  }
  return `${day} ${BULAN_ID[month]} ${year}`;
}

export function getHariIndonesia(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const dt = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10)
  );
  if (Number.isNaN(dt.getTime())) return '';
  return HARI_ID[dt.getDay()];
}

export function hitungUsia(dateStr?: string): number | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const birth = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10)
  );
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export function formatTtl(tempat?: string, tanggal?: string): string {
  const t = (tempat || '').trim();
  const d = tanggal ? formatTanggalIndonesia(tanggal) : '';
  if (!t && !d) return '........................................';
  if (t && d) return `${t}, ${d}`;
  return t || d;
}

export function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function generateKodeBerkas(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(100 + Math.random() * 900);
  return `NK-${y}${m}-${rand}`;
}

export function createEmptyBerkas(ownerId: string, profile?: UserProfile | null): BerkasNikahData {
  const today = getTodayIso();
  const desaDefault = profile?.defaultDesa || '';
  const kecDefault = profile?.defaultKecamatan || '';
  const kabDefault = profile?.defaultKabupaten || '';
  const provDefault = profile?.defaultProvinsi || '';
  const kuaDefault = profile?.defaultKua || (kecDefault ? `KUA Kecamatan ${kecDefault}` : '');

  return {
    ownerId,
    kodeBerkas: generateKodeBerkas(),
    status: 'draft',
    catatan: '',
    desa: {
      provinsi: provDefault,
      kabupaten: kabDefault,
      kecamatan: kecDefault,
      desa: desaDefault,
      jenisWilayah: profile?.defaultJabatanDesa === 'Lurah' ? 'Kelurahan' : 'Desa',
      alamatKantorDesa: profile?.defaultAlamatKantorDesa || '',
      namaKepalaDesa: profile?.defaultKepalaDesa || '',
      jabatanPejabat: profile?.defaultJabatanDesa || 'Kepala Desa',
      nipPejabat: profile?.defaultNipKepalaDesa || '',
      namaKua: kuaDefault,
      alamatKua: '',
      nomorN1: `474.2 /       / ${new Date().getFullYear()}`,
      nomorWali: `474.2 /       / ${new Date().getFullYear()}`,
      tanggalSurat: today,
      tempatSurat: desaDefault || kabDefault || '',
      pihakPengaju: 'wanita',
    },
    catinPria: {
      namaLengkap: '',
      binBinti: '',
      nik: '',
      jenisKelamin: 'Laki-laki',
      tempatLahir: '',
      tanggalLahir: '',
      kewarganegaraan: 'Indonesia',
      agama: 'Islam',
      pekerjaan: '',
      alamat: '',
      statusPerkawinan: 'Jejaka',
      istriKe: '',
      namaPasanganSebelumnya: '',
    },
    catinWanita: {
      namaLengkap: '',
      binBinti: '',
      nik: '',
      jenisKelamin: 'Perempuan',
      tempatLahir: '',
      tanggalLahir: '',
      kewarganegaraan: 'Indonesia',
      agama: 'Islam',
      pekerjaan: '',
      alamat: '',
      statusPerkawinan: 'Perawan',
      istriKe: '',
      namaPasanganSebelumnya: '',
    },
    ayahPria: {
      namaLengkap: '',
      binBinti: '',
      nik: '',
      tempatLahir: '',
      tanggalLahir: '',
      kewarganegaraan: 'Indonesia',
      agama: 'Islam',
      pekerjaan: '',
      alamat: '',
      statusHidup: 'Hidup',
    },
    ibuPria: {
      namaLengkap: '',
      binBinti: '',
      nik: '',
      tempatLahir: '',
      tanggalLahir: '',
      kewarganegaraan: 'Indonesia',
      agama: 'Islam',
      pekerjaan: '',
      alamat: '',
      statusHidup: 'Hidup',
    },
    ayahWanita: {
      namaLengkap: '',
      binBinti: '',
      nik: '',
      tempatLahir: '',
      tanggalLahir: '',
      kewarganegaraan: 'Indonesia',
      agama: 'Islam',
      pekerjaan: '',
      alamat: '',
      statusHidup: 'Hidup',
    },
    ibuWanita: {
      namaLengkap: '',
      binBinti: '',
      nik: '',
      tempatLahir: '',
      tanggalLahir: '',
      kewarganegaraan: 'Indonesia',
      agama: 'Islam',
      pekerjaan: '',
      alamat: '',
      statusHidup: 'Hidup',
    },
    waliNikah: {
      jenisWali: 'Wali Nasab',
      hubunganWali: 'Ayah Kandung',
      sebabWali: 'Ayah Kandung Masih Hidup dan Memenuhi Syarat Wali Nikah',
      namaLengkap: '',
      bin: '',
      nik: '',
      tempatLahir: '',
      tanggalLahir: '',
      kewarganegaraan: 'Indonesia',
      agama: 'Islam',
      pekerjaan: '',
      alamat: '',
      nomorTelepon: '',
    },
    rencanaNikah: {
      hariNikah: '',
      tanggalNikah: '',
      jamNikah: '09.00 WIB',
      tempatAkad: 'Di Luar KUA (Rumah Mempelai Wanita)',
      alamatAkad: '',
      maskawin: 'Seperangkat Alat Sholat dan Perhiasan Emas 5 Gram',
      pembayarMaskawin: 'Tunai',
    },
    suratKuasa: {
      pemberiKuasa: 'Catin Wanita',
      penerimaNama: '',
      penerimaNik: '',
      penerimaTempatLahir: '',
      penerimaTanggalLahir: '',
      penerimaPekerjaan: '',
      penerimaAlamat: '',
      penerimaHubungan: 'Keluarga / Perwakilan',
      keperluanKuasa:
        'Mendaftarkan kehendak nikah, menyerahkan kelengkapan berkas persyaratan nikah (N1–N5 dan lampiran terkait), serta mengurus proses administrasi pencatatan nikah pada Kantor Urusan Agama (KUA) Kecamatan terkait.',
    },
    sptjm: {
      pemohon: 'Catin Wanita',
      saksi1Nama: '',
      saksi1Nik: '',
      saksi2Nama: '',
      saksi2Nik: '',
    },
  };
}

export function createSampleBerkas(ownerId: string): BerkasNikahData {
  return {
    ownerId,
    kodeBerkas: generateKodeBerkas(),
    status: 'lengkap',
    catatan: 'Berkas lengkap, siap cetak dan diajukan ke KUA Kecamatan Batealit.',
    desa: {
      provinsi: 'Jawa Tengah',
      kabupaten: 'Jepara',
      kecamatan: 'Batealit',
      desa: 'Mindahan',
      jenisWilayah: 'Desa',
      alamatKantorDesa: 'Jl. Raya Mindahan KM 4, Kec. Batealit, Kab. Jepara, Kode Pos 59461',
      namaKepalaDesa: 'H. Sutrisno, S.Sos.',
      jabatanPejabat: 'Kepala Desa Mindahan',
      nipPejabat: '',
      namaKua: 'KUA Kecamatan Batealit',
      alamatKua: 'Jl. Raya Batealit No. 12, Kec. Batealit, Kab. Jepara',
      nomorN1: '474.2 / 148 / XI / 2026',
      nomorWali: '474.2 / 149 / XI / 2026',
      tanggalSurat: getTodayIso(),
      tempatSurat: 'Mindahan',
      pihakPengaju: 'wanita',
    },
    catinPria: {
      namaLengkap: 'Ahmad Fauzi Pratama',
      binBinti: 'H. Slamet Raharjo',
      nik: '3320081405990003',
      jenisKelamin: 'Laki-laki',
      tempatLahir: 'Jepara',
      tanggalLahir: '1999-05-14',
      kewarganegaraan: 'Indonesia',
      agama: 'Islam',
      pekerjaan: 'Karyawan Swasta',
      alamat: 'Desa Pekalongan RT 003 / RW 002, Kec. Batealit, Kab. Jepara',
      statusPerkawinan: 'Jejaka',
      istriKe: '',
      namaPasanganSebelumnya: '',
    },
    catinWanita: {
      namaLengkap: 'Siti Aisyah Rahmawati',
      binBinti: 'Drs. Muhammad Ridwan',
      nik: '3320085809060002',
      jenisKelamin: 'Perempuan',
      tempatLahir: 'Jepara',
      tanggalLahir: '2006-09-18',
      kewarganegaraan: 'Indonesia',
      agama: 'Islam',
      pekerjaan: 'Mahasiswi',
      alamat: 'Desa Mindahan RT 004 / RW 001, Kec. Batealit, Kab. Jepara',
      statusPerkawinan: 'Perawan',
      istriKe: '',
      namaPasanganSebelumnya: '',
    },
    ayahPria: {
      namaLengkap: 'H. Slamet Raharjo',
      binBinti: 'Karsono',
      nik: '3320081003700001',
      tempatLahir: 'Jepara',
      tanggalLahir: '1970-03-10',
      kewarganegaraan: 'Indonesia',
      agama: 'Islam',
      pekerjaan: 'Wiraswasta',
      alamat: 'Desa Pekalongan RT 003 / RW 002, Kec. Batealit, Kab. Jepara',
      statusHidup: 'Hidup',
    },
    ibuPria: {
      namaLengkap: 'Hj. Aminah',
      binBinti: 'Suyoto',
      nik: '3320084507730004',
      tempatLahir: 'Jepara',
      tanggalLahir: '1973-07-05',
      kewarganegaraan: 'Indonesia',
      agama: 'Islam',
      pekerjaan: 'Mengurus Rumah Tangga',
      alamat: 'Desa Pekalongan RT 003 / RW 002, Kec. Batealit, Kab. Jepara',
      statusHidup: 'Hidup',
    },
    ayahWanita: {
      namaLengkap: 'Drs. Muhammad Ridwan',
      binBinti: 'H. Abdul Karim',
      nik: '3320081208710002',
      tempatLahir: 'Jepara',
      tanggalLahir: '1971-08-12',
      kewarganegaraan: 'Indonesia',
      agama: 'Islam',
      pekerjaan: 'Pegawai Negeri Sipil',
      alamat: 'Desa Mindahan RT 004 / RW 001, Kec. Batealit, Kab. Jepara',
      statusHidup: 'Hidup',
    },
    ibuWanita: {
      namaLengkap: 'Sri Wahyuni, S.Pd.',
      binBinti: 'Supardi',
      nik: '3320085204750001',
      tempatLahir: 'Kudus',
      tanggalLahir: '1975-04-12',
      kewarganegaraan: 'Indonesia',
      agama: 'Islam',
      pekerjaan: 'Guru',
      alamat: 'Desa Mindahan RT 004 / RW 001, Kec. Batealit, Kab. Jepara',
      statusHidup: 'Hidup',
    },
    waliNikah: {
      jenisWali: 'Wali Nasab',
      hubunganWali: 'Ayah Kandung',
      sebabWali: 'Ayah Kandung Masih Hidup dan Memenuhi Syarat sebagai Wali Nikah',
      namaLengkap: 'Drs. Muhammad Ridwan',
      bin: 'H. Abdul Karim',
      nik: '3320081208710002',
      tempatLahir: 'Jepara',
      tanggalLahir: '1971-08-12',
      kewarganegaraan: 'Indonesia',
      agama: 'Islam',
      pekerjaan: 'Pegawai Negeri Sipil',
      alamat: 'Desa Mindahan RT 004 / RW 001, Kec. Batealit, Kab. Jepara',
      nomorTelepon: '0812-2845-7710',
    },
    rencanaNikah: {
      hariNikah: 'Minggu',
      tanggalNikah: '2026-12-20',
      jamNikah: '09.00 WIB',
      tempatAkad: 'Di Luar KUA (Kediaman Mempelai Wanita)',
      alamatAkad: 'Desa Mindahan RT 004 / RW 001, Kec. Batealit, Kab. Jepara',
      maskawin: 'Seperangkat Alat Sholat dan Perhiasan Emas 10 Gram',
      pembayarMaskawin: 'Tunai',
    },
    suratKuasa: {
      pemberiKuasa: 'Catin Wanita',
      penerimaNama: 'K.H. Nur Hasyim',
      penerimaNik: '3320080504680005',
      penerimaTempatLahir: 'Jepara',
      penerimaTanggalLahir: '1968-04-05',
      penerimaPekerjaan: 'Modin / Perangkat Desa',
      penerimaAlamat: 'Desa Mindahan RT 002 / RW 001, Kec. Batealit, Kab. Jepara',
      penerimaHubungan: 'Modin / Perwakilan Keluarga',
      keperluanKuasa:
        'Mendaftarkan kehendak nikah, menyerahkan kelengkapan berkas persyaratan nikah (N1, N2, N4, N5, SPTJM, Surat Keterangan Wali Nikah, dan lampiran Kependudukan), serta mengurus proses pemeriksaan berkas nikah pada Kantor Urusan Agama (KUA) Kecamatan Batealit.',
    },
    sptjm: {
      pemohon: 'Catin Wanita',
      saksi1Nama: 'Drs. Muhammad Ridwan',
      saksi1Nik: '3320081208710002',
      saksi2Nama: 'H. Slamet Raharjo',
      saksi2Nik: '3320081003700001',
    },
  };
}

// Defensive sanitizer matching firebase-blueprint.json & firestore.rules maxLength bounds verbatim
function clampStr(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.slice(0, maxLen);
}

export function sanitizeBerkasData(data: BerkasNikahData, ownerId: string): BerkasNikahData {
  const validJenisWilayah: JenisWilayah = data.desa.jenisWilayah === 'Kelurahan' ? 'Kelurahan' : 'Desa';
  const validPihak: PihakPengaju =
    data.desa.pihakPengaju === 'pria' || data.desa.pihakPengaju === 'keduanya'
      ? data.desa.pihakPengaju
      : 'wanita';
  const validStatus: StatusBerkas =
    data.status === 'lengkap' || data.status === 'diarsipkan' ? data.status : 'draft';
  const validWali: JenisWali = data.waliNikah.jenisWali === 'Wali Hakim' ? 'Wali Hakim' : 'Wali Nasab';
  const validPemberi: PemberiKuasa =
    data.suratKuasa.pemberiKuasa === 'Catin Pria' || data.suratKuasa.pemberiKuasa === 'Keduanya'
      ? data.suratKuasa.pemberiKuasa
      : 'Catin Wanita';
  const validPemohon: PemohonSptjm =
    data.sptjm.pemohon === 'Catin Pria' ? 'Catin Pria' : 'Catin Wanita';
  const validBayar: PembayarMaskawin =
    data.rencanaNikah.pembayarMaskawin === 'Hutang' ? 'Hutang' : 'Tunai';

  const sanitizeParent = (p: ParentBiodata, defaultAlive: StatusHidup): ParentBiodata => ({
    namaLengkap: clampStr(p.namaLengkap, 120),
    binBinti: clampStr(p.binBinti, 120),
    nik: clampStr(p.nik, 24),
    tempatLahir: clampStr(p.tempatLahir, 80),
    tanggalLahir: clampStr(p.tanggalLahir, 30),
    kewarganegaraan: clampStr(p.kewarganegaraan || 'Indonesia', 60),
    agama: clampStr(p.agama || 'Islam', 40),
    pekerjaan: clampStr(p.pekerjaan, 80),
    alamat: clampStr(p.alamat, 250),
    statusHidup:
      p.statusHidup === 'Hidup' || p.statusHidup === 'Almarhum' || p.statusHidup === 'Almarhumah'
        ? p.statusHidup
        : defaultAlive,
  });

  const sanitizePerson = (p: PersonBiodata, gender: JenisKelamin): PersonBiodata => ({
    namaLengkap: clampStr(p.namaLengkap, 120),
    binBinti: clampStr(p.binBinti, 120),
    nik: clampStr(p.nik, 24),
    jenisKelamin: gender,
    tempatLahir: clampStr(p.tempatLahir, 80),
    tanggalLahir: clampStr(p.tanggalLahir, 30),
    kewarganegaraan: clampStr(p.kewarganegaraan || 'Indonesia', 60),
    agama: clampStr(p.agama || 'Islam', 40),
    pekerjaan: clampStr(p.pekerjaan, 80),
    alamat: clampStr(p.alamat, 250),
    statusPerkawinan: clampStr(p.statusPerkawinan, 40),
    istriKe: clampStr(p.istriKe, 20),
    namaPasanganSebelumnya: clampStr(p.namaPasanganSebelumnya, 120),
  });

  return {
    ownerId: clampStr(ownerId, 128),
    kodeBerkas: clampStr(data.kodeBerkas || generateKodeBerkas(), 40),
    status: validStatus,
    catatan: clampStr(data.catatan, 500),
    desa: {
      provinsi: clampStr(data.desa.provinsi, 100),
      kabupaten: clampStr(data.desa.kabupaten, 100),
      kecamatan: clampStr(data.desa.kecamatan, 100),
      desa: clampStr(data.desa.desa, 100),
      jenisWilayah: validJenisWilayah,
      alamatKantorDesa: clampStr(data.desa.alamatKantorDesa, 200),
      namaKepalaDesa: clampStr(data.desa.namaKepalaDesa, 120),
      jabatanPejabat: clampStr(data.desa.jabatanPejabat, 80),
      nipPejabat: clampStr(data.desa.nipPejabat, 50),
      namaKua: clampStr(data.desa.namaKua, 120),
      alamatKua: clampStr(data.desa.alamatKua, 200),
      nomorN1: clampStr(data.desa.nomorN1, 80),
      nomorWali: clampStr(data.desa.nomorWali, 80),
      tanggalSurat: clampStr(data.desa.tanggalSurat, 30),
      tempatSurat: clampStr(data.desa.tempatSurat, 100),
      pihakPengaju: validPihak,
    },
    catinPria: sanitizePerson(data.catinPria, 'Laki-laki'),
    catinWanita: sanitizePerson(data.catinWanita, 'Perempuan'),
    ayahPria: sanitizeParent(data.ayahPria, 'Hidup'),
    ibuPria: sanitizeParent(data.ibuPria, 'Hidup'),
    ayahWanita: sanitizeParent(data.ayahWanita, 'Hidup'),
    ibuWanita: sanitizeParent(data.ibuWanita, 'Hidup'),
    waliNikah: {
      jenisWali: validWali,
      hubunganWali: clampStr(data.waliNikah.hubunganWali, 80),
      sebabWali: clampStr(data.waliNikah.sebabWali, 160),
      namaLengkap: clampStr(data.waliNikah.namaLengkap, 120),
      bin: clampStr(data.waliNikah.bin, 120),
      nik: clampStr(data.waliNikah.nik, 24),
      tempatLahir: clampStr(data.waliNikah.tempatLahir, 80),
      tanggalLahir: clampStr(data.waliNikah.tanggalLahir, 30),
      kewarganegaraan: clampStr(data.waliNikah.kewarganegaraan || 'Indonesia', 60),
      agama: clampStr(data.waliNikah.agama || 'Islam', 40),
      pekerjaan: clampStr(data.waliNikah.pekerjaan, 80),
      alamat: clampStr(data.waliNikah.alamat, 250),
      nomorTelepon: clampStr(data.waliNikah.nomorTelepon, 30),
    },
    rencanaNikah: {
      hariNikah: clampStr(data.rencanaNikah.hariNikah, 30),
      tanggalNikah: clampStr(data.rencanaNikah.tanggalNikah, 30),
      jamNikah: clampStr(data.rencanaNikah.jamNikah, 30),
      tempatAkad: clampStr(data.rencanaNikah.tempatAkad, 100),
      alamatAkad: clampStr(data.rencanaNikah.alamatAkad, 250),
      maskawin: clampStr(data.rencanaNikah.maskawin, 160),
      pembayarMaskawin: validBayar,
    },
    suratKuasa: {
      pemberiKuasa: validPemberi,
      penerimaNama: clampStr(data.suratKuasa.penerimaNama, 120),
      penerimaNik: clampStr(data.suratKuasa.penerimaNik, 24),
      penerimaTempatLahir: clampStr(data.suratKuasa.penerimaTempatLahir, 80),
      penerimaTanggalLahir: clampStr(data.suratKuasa.penerimaTanggalLahir, 30),
      penerimaPekerjaan: clampStr(data.suratKuasa.penerimaPekerjaan, 80),
      penerimaAlamat: clampStr(data.suratKuasa.penerimaAlamat, 250),
      penerimaHubungan: clampStr(data.suratKuasa.penerimaHubungan, 80),
      keperluanKuasa: clampStr(data.suratKuasa.keperluanKuasa, 300),
    },
    sptjm: {
      pemohon: validPemohon,
      saksi1Nama: clampStr(data.sptjm.saksi1Nama, 120),
      saksi1Nik: clampStr(data.sptjm.saksi1Nik, 24),
      saksi2Nama: clampStr(data.sptjm.saksi2Nama, 120),
      saksi2Nik: clampStr(data.sptjm.saksi2Nik, 24),
    },
  };
}

export function sanitizeUserProfile(profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>, uid: string) {
  return {
    uid: clampStr(uid, 128),
    displayName: clampStr(profile.displayName, 120),
    email: clampStr(profile.email, 160),
    defaultDesa: clampStr(profile.defaultDesa, 100),
    defaultKecamatan: clampStr(profile.defaultKecamatan, 100),
    defaultKabupaten: clampStr(profile.defaultKabupaten, 100),
    defaultProvinsi: clampStr(profile.defaultProvinsi, 100),
    defaultKua: clampStr(profile.defaultKua, 120),
    defaultKepalaDesa: clampStr(profile.defaultKepalaDesa, 120),
    defaultNipKepalaDesa: clampStr(profile.defaultNipKepalaDesa, 50),
    defaultJabatanDesa: clampStr(profile.defaultJabatanDesa, 80),
    defaultAlamatKantorDesa: clampStr(profile.defaultAlamatKantorDesa, 200),
  };
}
