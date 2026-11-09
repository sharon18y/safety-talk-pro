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

// Penanda apakah tabel sudah disinkronisasi
let isTableSynced = false;

async function ensureDbReady() {
  try {
    // 1. Selalu cek apakah jalur ke Aiven masih hidup (jika mati, pool akan otomatis membuat jalur baru)
    await sequelize.authenticate();

    // 2. Sinkronisasi tabel dan cek admin cukup dijalankan sekali saat server baru menyala
    if (!isTableSynced) {
      await sequelize.sync();
      isTableSynced = true;

      const adminExists = await User.findOne({ where: { username: 'admink3' } });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('biringkassi2026', 10);
        await User.create({
          username: 'admink3',
          password: hashedPassword,
          role: 'superadmin'
        });
        console.log('>>> Akun default dibuat: Username: admink3 | Pass: biringkassi2026');
      }
    }
  } catch (err) {
    // Jika terjadi putus koneksi mendadak, reset status agar dicoba ulang pada request berikutnya
    isTableSynced = false;
    console.error('Koneksi MySQL database error:', err);
  }
}

// Middleware: pastikan DB terhubung sebelum rute dieksekusi
app.use(async (req, res, next) => {
  await ensureDbReady();
  next();
});

// Endpoint API
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);

// Endpoint tes
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'Safety Talk API is running on Vercel!' });
});

// Pelacak error
process.on('uncaughtException', (err) => {
  console.error('\n!!! SERVER ERROR:', err);
});

module.exports = app;