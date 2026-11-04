// Simpan di: frontend/src/data/units.js
//
// Daftar unit kerja PT. Biringkassi Raya, urutannya sama dengan ceklist kertas.
// shifts: ['Day']  = 1 laporan per hari
//         ['I','II'] atau ['I','II','III'] = 1 laporan untuk setiap shift
// Nama unit harus persis sama dengan yang tersimpan di database (kolom unit_nama).
// Jumlah shift per unit dibaca dari foto ceklist: cek ulang kalau ada yang tidak sesuai.

export const SHIFT_LABEL = { Day: 'Harian', I: 'Shift I', II: 'Shift II', III: 'Shift III' };

export const GROUPS = [
  { id: 'harian', title: 'Pemeliharaan & umum' },
  { id: 'shift', title: 'Operasional lapangan' },
  { id: 'luar', title: 'Unit luar (PP / UPS)' },
];

const H = ['Day'];
const S2 = ['I', 'II'];
const S3 = ['I', 'II', 'III'];

export const UNITS = [
  { name: 'Penunjang Workshop/DC BKS', group: 'harian', shifts: H },
  { name: 'Cleaning Industrial Biringkassi', group: 'harian', shifts: H },
  { name: 'Silo Pantai', group: 'harian', shifts: H },
  { name: 'Pemeliharaan Otonomus', group: 'harian', shifts: H },
  { name: 'Pemeliharaan Dust Collector Tonasa/PUP', group: 'harian', shifts: H },
  { name: 'Pemeliharaan Peralatan Pabrik & Koreseri', group: 'harian', shifts: H },

  { name: 'Pemuatan Clinker BKS', group: 'shift', shifts: S3 },
  { name: 'Pemuatan Semen Curah BKS', group: 'shift', shifts: S3 },
  { name: 'Excavator D2 Bks (Operator)', group: 'shift', shifts: S3 },
  { name: 'Silo Pabrik', group: 'shift', shifts: S3 },
  { name: 'Pengantongan Biringkassi (Packer)', group: 'shift', shifts: S3 },
  { name: 'Pengantongan Pabrik 2/3', group: 'shift', shifts: S3 },
  { name: 'Pengantongan Pabrik 5', group: 'shift', shifts: S3 },
  { name: 'Master Loading / Pengawas Kade Biringkassi', group: 'shift', shifts: S3 },

  { name: 'UPS Palu', group: 'luar', shifts: S2 },
  { name: 'PP Bali', group: 'luar', shifts: S3 },
  { name: 'PP Banjarmasin', group: 'luar', shifts: S3 },
  { name: 'PP Balikpapan', group: 'luar', shifts: S2 },
  { name: 'UPS Makassar', group: 'luar', shifts: S2 },

  { name: 'Alat Berat Dermaga 2', group: 'shift', shifts: S3 },
  { name: 'Penjumboan T4', group: 'shift', shifts: S2 },

  { name: 'PP Sorong', group: 'luar', shifts: H },
  { name: 'PP Bitung', group: 'luar', shifts: H },
  { name: 'PP Mamuju', group: 'luar', shifts: H },
  { name: 'PP Samarinda', group: 'luar', shifts: H },
  { name: 'PP Oba Maluku Utara', group: 'luar', shifts: H },
  { name: 'PP Ambon', group: 'luar', shifts: H },
  { name: 'PP Pontianak', group: 'luar', shifts: H },
  { name: 'PP Kendari', group: 'luar', shifts: H },
];

export const UNIT_NAMES = UNITS.map((u) => u.name);
export const unitByName = Object.fromEntries(UNITS.map((u) => [u.name, u]));