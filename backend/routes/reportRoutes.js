// Simpan di: backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { Report } = require('../models/Report');

// GET: Mengambil semua laporan
router.get('/', async (req, res) => {
  try {
    const reports = await Report.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data laporan', error: error.message });
  }
});

// POST: Menerima laporan baru
router.post('/', async (req, res) => {
  try {
    const { 
      tanggal, unit_nama, shift, nama_koordinator, materi, 
      jml_personil, jml_hadir, jml_tidak_hadir, foto_url, absensi 
    } = req.body;

    // VALIDASI: Mencegah duplikasi
    const existingReport = await Report.findOne({ where: { tanggal, unit_nama, shift } });
    if (existingReport) {
      return res.status(400).json({ 
        message: `Laporan untuk unit ${unit_nama} pada shift ${shift} tanggal ${tanggal} sudah pernah dikirim.` 
      });
    }

    // SIMPAN DATA
    const newReport = await Report.create({
      tanggal, unit_nama, shift, nama_koordinator, materi, 
      jml_personil, jml_hadir, jml_tidak_hadir, foto_url, absensi
    });

    res.status(201).json({ message: 'Laporan berhasil disimpan!', data: newReport });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menyimpan laporan', error: error.message });
  }
});

// PUT: Mengubah/mengedit laporan yang sudah ada
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      tanggal, unit_nama, shift, nama_koordinator, materi, 
      jml_personil, jml_hadir, jml_tidak_hadir, absensi 
    } = req.body;

    // Cari laporan berdasarkan ID
    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    // Update data laporan
    await report.update({
      tanggal, unit_nama, shift, nama_koordinator, materi, 
      jml_personil, jml_hadir, jml_tidak_hadir, absensi
    });

    res.status(200).json({ message: 'Laporan berhasil diperbarui', data: report });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui laporan', error: error.message });
  }
});

// DELETE: Menghapus laporan
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Hapus data dari tabel berdasarkan ID
    const deletedCount = await Report.destroy({
      where: { id: id }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    res.status(200).json({ message: 'Laporan berhasil dihapus' });
  } catch (error) {
    console.error('Error hapus laporan:', error);
    res.status(500).json({ message: 'Kesalahan server saat menghapus laporan', error: error.message });
  }
});

module.exports = router;