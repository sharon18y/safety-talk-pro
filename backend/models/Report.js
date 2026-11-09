// Simpan di: backend/models/Report.js
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,

    // Pengaturan Pool khusus Serverless (Vercel + Aiven Free Tier)
    pool: {
      max: 2,          // Maksimal 2 koneksi per fungsi serverless agar limit Aiven tidak penuh
      min: 0,          // Izinkan 0 koneksi saat sedang tidak ada yang membuka web
      acquire: 30000,  // Waktu tunggu maksimal mencari koneksi (30 detik)
      idle: 5000,      // Tutup koneksi secara bersih jika menganggur 5 detik (sebelum diputus paksa oleh Aiven)
      evict: 1000      // Cek dan buang koneksi yang sudah mati setiap 1 detik
    },

    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      connectTimeout: 60000,   // Toleransi waktu sambung awal 60 detik
      enableKeepAlive: true,   // Kirim sinyal detak jantung agar koneksi tidak dianggap mati
      keepAliveInitialDelay: 10000
    }
  }
);

const Report = sequelize.define('Report', {
  tanggal: { type: DataTypes.DATEONLY, allowNull: false },
  unit_nama: { type: DataTypes.STRING, allowNull: false },
  shift: { type: DataTypes.STRING, allowNull: false },
  nama_koordinator: { type: DataTypes.STRING, allowNull: false },
  materi: { type: DataTypes.STRING, allowNull: false },
  jml_personil: { type: DataTypes.INTEGER, allowNull: false },
  jml_hadir: { type: DataTypes.INTEGER, allowNull: false },
  jml_tidak_hadir: { type: DataTypes.INTEGER, allowNull: false },
  foto_url: { type: DataTypes.STRING, allowNull: false },
  absensi: { type: DataTypes.TEXT, allowNull: true } 
}, {
  tableName: 'reports',
  timestamps: true 
});

module.exports = { sequelize, Report };