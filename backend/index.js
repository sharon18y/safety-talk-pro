// Simpan di: backend/index.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Memaksa bundler Vercel membawa modul mysql2
require('mysql2');

const { sequelize } = require('./models/Report');
const { User } = require('./models/User');
const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================================
// 1. ENDPOINT HEALTH CHECK & PING (DI ATAS MIDDLEWARE DB)
// Diletakkan paling atas agar super ringan dan hanya menjalankan
// 1 kali query (tanpa double check) saat dipanggil cron-job.org
// ==========================================================
const handlePing = async (req, res) => {
  try {
    await sequelize.query('SELECT 1');
    res.status(200).json({ status: 'awake', time: new Date().toISOString() });
  } catch (err) {
    console.error('Ping database gagal:', err.message);
    res.status(500).json({ status: 'error', message: 'Database belum siap' });
  }
};

app.get(['/api/ping', '/ping'], handlePing);

app.get(['/api', '/'], (req, res) => {
  res.json({ status: 'ok', message: 'Safety Talk API is running on Vercel!' });
});

// ==========================================================
// 2. INISIALISASI DATABASE (HANYA SEKALI SAAT COLD START)
// ==========================================================
let isTableSynced = false;

async function ensureDbReady() {
  // Jika sudah tersinkronisasi, langsung lewati agar tidak menambah jeda (latency)
  // Urusan koneksi putus sudah ditangani otomatis oleh pool di Report.js
  if (isTableSynced) return;

  await sequelize.sync();
  isTableSynced = true;

  // Pastikan akun admin default tersedia
  const adminExists = await User.findOne({ where: { username: 'admink3' } });
  if (!adminExists) {
    const defaultPass = process.env.DEFAULT_ADMIN_PASS || 'biringkassi2026';
    const hashedPassword = await bcrypt.hash(defaultPass, 10);
    await User.create({
      username: 'admink3',
      password: hashedPassword,
      role: 'superadmin'
    });
    console.log('>>> Akun default admink3 berhasil disiapkan');
  }
}

// Middleware: pastikan tabel DB siap sebelum masuk ke rute laporan/login
app.use(async (req, res, next) => {
  try {
    await ensureDbReady();
    next();
  } catch (err) {
    isTableSynced = false;
    console.error('Inisialisasi MySQL database error:', err.message);
    res.status(503).json({ 
      message: 'Koneksi ke database sedang disiapkan ulang, silakan coba beberapa detik lagi.' 
    });
  }
});

// ==========================================================
// 3. ENDPOINT API UTAMA
// ==========================================================
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);

// Pelacak error tak terduga
process.on('uncaughtException', (err) => {
  console.error('\n!!! SERVER ERROR:', err);
});

module.exports = app;