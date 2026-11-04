const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, 
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
  // UBAH: Menjadi tipe TEXT dan bisa dikosongkan (allowNull: true)
  absensi: { type: DataTypes.TEXT, allowNull: true } 
}, {
  tableName: 'reports',
  timestamps: true 
});

module.exports = { sequelize, Report };