import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import CloudinaryUpload from './CloudinaryUpload';
import { UNIT_NAMES, unitByName, SHIFT_LABEL, GROUPS, UNITS } from '../data/units';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/reports`;

const inputCls =
  'w-full rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] px-4 py-3.5 text-[15px] text-gray-900 dark:text-white placeholder-[#8E8E93] outline-none transition duration-200 focus:bg-[#E5E5EA] dark:focus:bg-[#3A3A3C] focus:ring-2 focus:ring-[#007AFF]/30';
const labelCls = 'block text-[13px] font-semibold text-[#6C6C70] dark:text-[#98989D] mb-1.5 ml-1';
const sectionCls =
  'bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-black/[0.04] dark:border-white/[0.06] transition duration-200';

// Tanggal hari ini menurut jam perangkat (bukan UTC), supaya laporan dini hari tidak tercatat di hari kemarin
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const emptyForm = () => ({
  tanggal: todayLocal(),
  unit_nama: UNIT_NAMES[0],
  shift: unitByName[UNIT_NAMES[0]].shifts[0],
  nama_koordinator: '',
  materi: '',
  jml_personil: '',
  jml_hadir: '',
  jml_tidak_hadir: 0,
  foto_url: '',
  absensi: '', // keterangan tidak hadir: teks bebas
});

export default function FormInput() {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState({ tipe: '', teks: '' });

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerClosing, setPickerClosing] = useState(false);
  const [searchUnit, setSearchUnit] = useState('');
  const closePickerRef = useRef();

  const shiftUnit = unitByName[formData.unit_nama]?.shifts || ['Day'];

  // Tampilkan pesan & gulir ke atas agar pesan terlihat (tombol kirim ada di paling bawah)
  const showPesan = (tipe, teks) => {
    setPesan({ tipe, teks });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closePicker = () => {
    if (pickerClosing) return;
    setPickerClosing(true);
    setTimeout(() => {
      setIsPickerOpen(false);
      setPickerClosing(false);
      setSearchUnit('');
    }, 240);
  };
  closePickerRef.current = closePicker;

  // Saat pemilih unit terbuka: kunci scroll halaman & tutup dengan Esc
  useEffect(() => {
    if (!isPickerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && closePickerRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isPickerOpen]);

  const filteredUnits = useMemo(() => {
    if (!searchUnit.trim()) return UNITS;
    return UNITS.filter((u) => u.name.toLowerCase().includes(searchUnit.toLowerCase()));
  }, [searchUnit]);

  const selectUnit = (unitName) => {
    setFormData((prev) => {
      const updated = { ...prev, unit_nama: unitName };
      const shifts = unitByName[unitName]?.shifts || ['Day'];
      if (!shifts.includes(updated.shift)) {
        updated.shift = shifts[0];
      }
      return updated;
    });
    closePicker();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'jml_personil' || name === 'jml_hadir') {
        const personil = Number(name === 'jml_personil' ? value : updated.jml_personil) || 0;
        const hadir = Number(name === 'jml_hadir' ? value : updated.jml_hadir) || 0;
        updated.jml_tidak_hadir = Math.max(0, personil - hadir);

        // Hapus keterangan jika tidak ada yang absen
        if (updated.jml_tidak_hadir === 0) {
          updated.absensi = '';
        }
      }

      return updated;
    });
  };

  const handleUploadSuccess = useCallback((url) => {
    setFormData((prev) => ({ ...prev, foto_url: url }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPesan({ tipe: '', teks: '' });

    if (!formData.foto_url) {
      showPesan('error', 'Silakan lampirkan foto dokumentasi kegiatan terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const resData = await response.json();

      if (response.ok) {
        showPesan('success', 'Laporan briefing K3 berhasil disimpan ke database!');
        setFormData(emptyForm());
      } else {
        showPesan('error', resData.message || 'Gagal menyimpan laporan.');
      }
    } catch (error) {
      showPesan('error', 'Koneksi ke backend port 5001 gagal. Pastikan server aktif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 pb-28">
      <div className="mb-6 px-1">
        <h2 className="text-[28px] sm:text-[34px] font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
          Form Input Safety Talk
        </h2>
        <p className="text-[14px] text-[#8E8E93] dark:text-[#98989D] mt-1 font-normal">
          PT. Biringkassi Raya - Pencatatan Briefing K3 Lapangan
        </p>
      </div>

      {pesan.teks && (
        <div
          role="status"
          className={`reveal p-4 mb-5 rounded-2xl text-[14px] font-medium ${
            pesan.tipe === 'success'
              ? 'bg-[#34C759]/[0.12] text-[#1E8E3E] dark:text-[#30D158] border border-[#34C759]/20'
              : 'bg-[#FF3B30]/10 text-[#D70015] dark:text-[#FF453A] border border-[#FF3B30]/20'
          }`}
        >
          {pesan.teks}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Pemilihan Unit & Shift */}
        <div className={sectionCls}>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Unit Kerja / Area</label>
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="w-full flex items-center justify-between rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] px-4 py-3.5 text-[15px] text-gray-900 dark:text-white transition duration-200 hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] active:scale-[0.99] text-left"
              >
                <div className="flex flex-col truncate pr-2">
                  <span className="truncate font-semibold text-gray-900 dark:text-white">
                    {formData.unit_nama}
                  </span>
                  <span className="text-[12px] text-[#8E8E93] mt-0.5">
                    {unitByName[formData.unit_nama]?.shifts.length > 1
                      ? 'Operasional Berjadwal Shift'
                      : 'Non-Shift / Rutin Harian'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-[#007AFF]">
                  <span className="text-[13px] font-medium hidden sm:inline">Pilih</span>
                  <svg className="w-4 h-4 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>

            <div>
              <label className={labelCls}>Shift Operasional</label>
              <div className="relative">
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleChange}
                  className={`${inputCls} appearance-none pr-10 font-medium cursor-pointer`}
                >
                  {shiftUnit.map((s) => (
                    <option key={s} value={s}>
                      {s === 'Day' ? 'Harian / Non-Shift' : SHIFT_LABEL[s]}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#8E8E93]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Tanggal, Koordinator & Materi */}
        <div className={sectionCls}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tanggal Pelaksanaan</label>
                <input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Nama Koordinator / Pengawas</label>
                <input
                  type="text"
                  name="nama_koordinator"
                  placeholder="Contoh: Haeruddin"
                  value={formData.nama_koordinator}
                  onChange={handleChange}
                  required
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Materi Briefing K3</label>
              <textarea
                name="materi"
                rows="3"
                placeholder="Tuliskan poin bahasan keselamatan kerja harian..."
                value={formData.materi}
                onChange={handleChange}
                required
                className={`${inputCls} resize-none leading-relaxed`}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Data Kehadiran */}
        <div className={sectionCls}>
          <label className={labelCls}>Statistik Personil</label>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-2xl p-3 text-center">
              <span className="block text-[11px] font-semibold uppercase text-[#8E8E93] tracking-wide">
                Total
              </span>
              <input
                type="number"
                name="jml_personil"
                min="1"
                placeholder="0"
                inputMode="numeric"
                value={formData.jml_personil}
                onChange={handleChange}
                required
                className="w-full bg-transparent text-center text-xl font-bold text-gray-900 dark:text-white outline-none mt-1"
              />
            </div>

            <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-2xl p-3 text-center">
              <span className="block text-[11px] font-semibold uppercase text-[#34C759] tracking-wide">
                Hadir
              </span>
              <input
                type="number"
                name="jml_hadir"
                min="0"
                max={formData.jml_personil || undefined}
                placeholder="0"
                inputMode="numeric"
                value={formData.jml_hadir}
                onChange={handleChange}
                required
                className="w-full bg-transparent text-center text-xl font-bold text-[#34C759] outline-none mt-1"
              />
            </div>

            <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-2xl p-3 text-center">
              <span className="block text-[11px] font-semibold uppercase text-[#FF3B30] tracking-wide">
                Absen
              </span>
              <span className="block text-xl font-bold text-[#FF3B30] mt-1">
                {formData.jml_tidak_hadir}
              </span>
            </div>
          </div>

          {/* Kolom Teks Bebas Keterangan Tidak Hadir (Opsional) */}
          {Number(formData.jml_tidak_hadir) > 0 && (
            <div className="reveal mt-4 rounded-2xl bg-[#FF3B30]/[0.06] dark:bg-[#FF453A]/10 p-4 border border-[#FF3B30]/15 space-y-2">
              <label className="block text-[12px] font-bold uppercase tracking-wider text-[#D70015] dark:text-[#FF453A]">
                Keterangan Ketidakhadiran ({formData.jml_tidak_hadir} Orang)
              </label>
              <textarea
                name="absensi"
                rows="2"
                placeholder="Contoh: 1 orang sakit, 2 orang izin urusan keluarga..."
                value={formData.absensi}
                onChange={handleChange}
                className={`${inputCls} resize-none !bg-white/90 dark:!bg-[#2C2C2E]/90 border border-black/[0.06] dark:border-white/10`}
              />
            </div>
          )}
        </div>

        {/* Section 4: Foto Bukti Dokumentasi */}
        <div className={sectionCls}>
          <label className={labelCls}>Dokumentasi Safety Talk</label>
          <CloudinaryUpload onUploadSuccess={handleUploadSuccess} />
          {formData.foto_url && (
            <div className="reveal flex items-center gap-2 mt-3 ml-1 text-[#34C759] text-[13px] font-medium">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              Foto dokumentasi berhasil dilampirkan
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-2xl text-white text-[16px] font-semibold tracking-wide transition duration-200 active:scale-[0.98] ${
            loading
              ? 'bg-[#007AFF]/50 cursor-not-allowed'
              : 'bg-[#007AFF] hover:bg-[#006ee6] active:bg-[#0062CC] shadow-[0_4px_16px_rgba(0,122,255,0.3)]'
          }`}
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Menyimpan Laporan...
            </span>
          ) : (
            'Kirim Laporan'
          )}
        </button>
      </form>

      {/* iOS Action Sheet / Modal Pemilih Unit Kerja */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className={`${pickerClosing ? 'fade-out' : 'fade-in'} fixed inset-0 bg-black/40 backdrop-blur-sm`}
            onClick={closePicker}
          />

          <div
            role="dialog"
            aria-modal="true"
            className={`${pickerClosing ? 'sheet-out' : 'sheet-in'} relative w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-t-[32px] sm:rounded-[28px] max-h-[85vh] flex flex-col shadow-2xl border border-black/[0.08] dark:border-white/[0.08] z-10`}
          >
            <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-3 sm:hidden" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[17px] font-bold text-gray-900 dark:text-white">Pilih Unit Kerja</h3>
                  <p className="text-[12px] text-[#8E8E93]">Pilih salah satu unit operasional lapangan</p>
                </div>
                <button
                  type="button"
                  onClick={closePicker}
                  aria-label="Tutup"
                  className="w-8 h-8 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E]">
                <svg className="w-4 h-4 text-[#8E8E93] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Ketik untuk memfilter unit..."
                  value={searchUnit}
                  onChange={(e) => setSearchUnit(e.target.value)}
                  className="w-full bg-transparent text-[14px] text-gray-900 dark:text-white outline-none placeholder-[#8E8E93]"
                  // Di HP jangan langsung memunculkan keyboard (menutupi daftar unit)
                  autoFocus={typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches}
                />
                {searchUnit && (
                  <button type="button" onClick={() => setSearchUnit('')} className="text-[#8E8E93] text-xs">
                    Hapus
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto p-3 space-y-4 max-h-[60vh]">
              {GROUPS.map((grp) => {
                const groupUnits = filteredUnits.filter((u) => u.group === grp.id);
                if (groupUnits.length === 0) return null;

                return (
                  <div key={grp.id} className="space-y-1">
                    <span className="block px-3 text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                      {grp.title}
                    </span>
                    <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-2xl overflow-hidden divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                      {groupUnits.map((item) => {
                        const isSelected = formData.unit_nama === item.name;
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => selectUnit(item.name)}
                            className={`w-full flex items-center justify-between px-4 py-3.5 text-[14px] text-left transition duration-150 ${
                              isSelected
                                ? 'bg-[#007AFF] text-white font-semibold'
                                : 'text-gray-900 dark:text-gray-100 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
                            }`}
                          >
                            <span className="truncate pr-2">{item.name}</span>
                            {isSelected && (
                              <svg className="w-4 h-4 ml-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {filteredUnits.length === 0 && (
                <div className="text-center py-8 text-[13px] text-[#8E8E93]">
                  Tidak ada unit yang sesuai dengan &quot;{searchUnit}&quot;
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}