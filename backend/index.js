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

// Endpoint API
app.use('/api/reports', reportRoutes); 
app.use('/api/auth', authRoutes); 

// Pelacak error
process.on('uncaughtException', (err) => {
  console.error('\n!!! SERVER MATI KARENA ERROR:', err);
});

// Sinkronisasi Database
sequelize.sync()
  .then(async () => {
    console.log('Berhasil terkoneksi ke MySQL!');
    
    // BUAT AKUN ADMIN DEFAULT SECARA OTOMATIS JIKA BELUM ADA
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
    
    // =========================================================
    // UBAHAN UNTUK VERCEL: Bagian app.listen dimatikan (di-comment)
    // karena Vercel Serverless tidak membutuhkan alokasi port manual
    // =========================================================
    
    // const PORT = process.env.PORT || 5005;
    // const server = app.listen(PORT, () => {
    //   console.log(`Server backend berjalan di port ${PORT}`);
    // });

    // server.on('error', (err) => {
    //   if (err.code === 'EADDRINUSE') {
    //     console.error(`\n!!! PORT ${PORT} SUDAH DIPAKAI.`);
    //   }
    // });
    
  })
  .catch((err) => {
    console.error('Gagal terkoneksi ke MySQL:', err);
  });

// =========================================================
// UBAHAN UNTUK VERCEL: Export app agar bisa dibaca oleh sistem Vercel
// =========================================================
module.exports = app;