const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Tambahkan ini
require('dotenv').config();

const { sequelize } = require('./models/Report');
const { User } = require('./models/User'); // Import model User
const reportRoutes = require('./routes/reportRoutes'); 
const authRoutes = require('./routes/authRoutes'); // Import rute auth

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/reports', reportRoutes); 
app.use('/api/auth', authRoutes); // Daftarkan endpoint login

const PORT = process.env.PORT || 5000;

process.on('uncaughtException', (err) => {
  console.error('\n!!! SERVER MATI KARENA ERROR:', err);
});

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
    
    const server = app.listen(PORT, () => {
      console.log(`Server backend berjalan di port ${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n!!! PORT ${PORT} SUDAH DIPAKAI. Ganti PORT di file .env jadi 5001`);
      }
    });
  })
  .catch((err) => {
    console.error('Gagal terkoneksi ke MySQL:', err);
  });