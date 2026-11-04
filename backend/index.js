// Simpan di: backend/index.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
require('dotenv').config();

const { sequelize } = require('./models/Report');
const { User } = require('./models/User'); 
const reportRoutes = require('./routes/reportRoutes'); 
const authRoutes = require('./routes/authRoutes'); 

const app = express();
app.use(cors());
app.use(express.json());

// Inisialisasi koneksi database aman untuk arsitektur serverless
let isDbInitialized = false;
async function ensureDbReady() {
  if (isDbInitialized) return;
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    isDbInitialized = true;

    // Pastikan akun admin default tersedia
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
  } catch (err) {
    console.error('Koneksi MySQL database error:', err);
  }
}

// Middleware: pastikan DB sinkron sebelum memproses rute
app.use(async (req, res, next) => {
  await ensureDbReady();
  next();
});

// Endpoint API
app.use('/api/reports', reportRoutes); 
app.use('/api/auth', authRoutes); 

// Endpoint cek kesehatan server
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'Safety Talk API is running on Vercel!' });
});

// Pelacak error
process.on('uncaughtException', (err) => {
  console.error('\n!!! SERVER ERROR:', err);
});

module.exports = app;