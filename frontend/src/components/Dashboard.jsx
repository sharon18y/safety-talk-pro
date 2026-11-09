// Simpan di: frontend/src/components/Dashboard.jsx
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UNITS, GROUPS, SHIFT_LABEL, UNIT_NAMES, unitByName } from '../data/units';

// Rute API
const API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/reports`
  : '/api/reports';

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const cardCls = 'bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
const inputCls = 'w-full rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] px-3.5 py-2.5 text-[15px] text-gray-900 dark:text-white placeholder-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF]/40 transition';
const muted = 'text-[#6C6C70] dark:text-[#98989D]';
const labelCls = `block text-[13px] font-medium ${muted} mb-1.5 ml-1`;
const roundBtn = 'w-10 h-10 rounded-full grid place-items-center bg-[#767680]/15 text-gray-900 dark:text-white active:scale-90 transition shrink-0 disabled:opacity-30';

const STATE = {
  full: { glyph: '✓', color: '#34C759', text: 'text-[#1E8E3E] dark:text-[#30D158]' },
  part: { glyph: '!', color: '#FF9F0A', text: 'text-[#C93400] dark:text-[#FF9F0A]' },
  none: { glyph: '✕', color: '#FF3B30', text: 'text-[#D70015] dark:text-[#FF453A]' },
};
const ORDER = { none: 0, part: 1, full: 2 };

const pad = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const shiftDay = (k, n) => {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
};
const fmtLong = (k) => {
  const d = fromKey(k);
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
};
const dateOf = (r) => String(r.tanggal).slice(0, 10);

const Chevron = ({ dir }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={dir === 'l' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
  </svg>
);

function Segmented({ options, value, onChange }) {
  return (
    <div className="flex p-1 rounded-xl bg-[#767680]/[0.12]">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`flex-1 py-2 rounded-[9px] text-[13px] font-semibold transition ${
            value === o.id ? 'bg-white dark:bg-[#636366] shadow-sm text-gray-900 dark:text-white' : muted
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function Info({ label, children }) {
  return (
    <div>
      <p className={`text-[12px] font-medium ${muted}`}>{label}</p>
      <p className="text-[15px] text-gray-900 dark:text-white mt-0.5 whitespace-pre-wrap break-words">{children}</p>
    </div>
  );
}

function UnitCard({ r, onOpen }) {
  const st = STATE[r.state];
  const single = r.slots.length === 1;
  const text = r.state === 'full'
    ? single ? 'Sudah melapor' : 'Semua shift lengkap'
    : r.state === 'part' ? `${r.done} dari ${r.slots.length} shift` : 'Belum melapor';
  const showChips = !single || r.slots[0].report;

  return (
    <div className={`${cardCls} p-4`}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="w-9 h-9 shrink-0 rounded-full grid place-items-center text-white font-bold text-sm"
          style={{ backgroundColor: st.color }}
        >
          {st.glyph}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-[15px] leading-snug text-gray-900 dark:text-white">{r.name}</p>
          <p className={`text-[13px] font-medium ${st.text}`}>{text}</p>
        </div>
      </div>
      {showChips && (
        <div className="flex flex-wrap gap-2 mt-3 pl-12">
          {r.slots.map(({ shift, report }) => (
            <button
              key={shift}
              type="button"
              disabled={!report}
              onClick={() => report && onOpen(report)}
              className={`h-9 px-3.5 rounded-full text-[13px] font-semibold transition ${
                report
                  ? 'bg-[#34C759]/15 text-[#1E8E3E] dark:text-[#30D158] active:scale-95'
                  : 'bg-[#767680]/[0.12] text-[#6C6C70] dark:text-[#98989D]'
              }`}
            >
              {report ? '✓ ' : ''}
              {single ? 'Lihat laporan' : SHIFT_LABEL[shift]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Detail laporan (Dengan Animasi & Toast) ----------
function DetailSheet({ report, onClose, onSaved, onDeleted, showToast }) {
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({});

  // State untuk animasi penghapusan
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false); // true = tampilkan animasi "laporan dihapus"

  const closeRef = useRef();

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 240);
  };
  closeRef.current = close;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const startEdit = () => {
    const base = {
      tanggal: dateOf(report),
      unit_nama: report.unit_nama,
      shift: report.shift,
      nama_koordinator: report.nama_koordinator,
      materi: report.materi,
      jml_personil: report.jml_personil,
      jml_hadir: report.jml_hadir,
    };
    if (!Array.isArray(report.absensi)) base.absensi = report.absensi || '';
    setForm(base);
    setEditing(true);
  };

  const changeUnit = (name) => {
    const shifts = unitByName[name]?.shifts || [];
    setForm((f) => ({ ...f, unit_nama: name, shift: shifts.includes(f.shift) ? f.shift : shifts[0] }));
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const tidakHadir = Math.max(0, Number(form.jml_personil) - Number(form.jml_hadir));
    const body = { ...form, jml_tidak_hadir: tidakHadir };
    if ('absensi' in body && tidakHadir === 0) body.absensi = '';

    try {
      const res = await fetch(`${API}/${report.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const out = await res.json();
        onSaved(out.data || { ...report, ...body });
        showToast('Perubahan berhasil disimpan', 'success');
        close();
      } else {
        showToast('Gagal menyimpan perubahan data', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setBusy(false);
    }
  };

  const executeDel = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`${API}/${report.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDeleted(report.id);
        showToast('Laporan berhasil dihapus', 'success');
        // Tampilkan animasi centang sebentar, baru tutup sheet dengan mulus
        setDeleted(true);
        setTimeout(close, 850);
      } else {
        showToast('Gagal menghapus laporan dari database', 'error');
        setIsDeleting(false);
        setConfirmDelete(false);
      }
    } catch {
      showToast('Koneksi terputus, gagal menghapus', 'error');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const absenList = Array.isArray(report.absensi) ? report.absensi : [];
  const absenText = typeof report.absensi === 'string' ? report.absensi.trim() : '';
  const allowedShifts = Array.from(new Set([...(unitByName[form.unit_nama]?.shifts || ['Day', 'I', 'II', 'III']), form.shift]));

  // Kurva gerak ala iOS, dipakai untuk semua transisi hapus
  const ease = 'cubic-bezier(.32,.72,0,1)';

  return (
    <div
      className={`${closing ? 'fade-out' : 'fade-in'} fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4`}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`${closing ? 'sheet-out' : 'sheet-in'} w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-[#1C1C1E] rounded-t-[28px] sm:rounded-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl`}
      >
        <div className="sm:hidden w-10 h-1.5 rounded-full bg-[#8E8E93]/40 mx-auto mb-4" />

        {!editing ? (
          <div className="relative">
            {/* Isi detail: memudar & mengecil halus saat laporan sudah terhapus */}
            <div
              className="space-y-4"
              style={{
                opacity: deleted ? 0 : 1,
                transform: deleted ? 'scale(.96)' : 'scale(1)',
                pointerEvents: deleted ? 'none' : 'auto',
                transition: `opacity .25s ease, transform .4s ${ease}`,
              }}
            >
              <div>
                <p className={`text-[13px] font-medium ${muted}`}>
                  {SHIFT_LABEL[report.shift] || report.shift}, {fmtLong(dateOf(report))}
                </p>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mt-0.5">{report.unit_nama}</h2>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  ['Personil', report.jml_personil, 'text-gray-900 dark:text-white'],
                  ['Hadir', report.jml_hadir, STATE.full.text],
                  ['Tidak hadir', report.jml_tidak_hadir, Number(report.jml_tidak_hadir) > 0 ? STATE.none.text : muted],
                ].map(([l, v, c]) => (
                  <div key={l} className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] py-3 text-center">
                    <p className={`text-2xl font-bold tabular-nums ${c}`}>{v}</p>
                    <p className={`text-[12px] font-medium ${muted}`}>{l}</p>
                  </div>
                ))}
              </div>

              <Info label="Materi">{report.materi}</Info>
              <Info label="Koordinator">{report.nama_koordinator}</Info>

              {(absenText || absenList.length > 0) && (
                <div>
                  <p className={`text-[12px] font-medium ${muted} mb-1.5`}>Keterangan tidak hadir</p>
                  {absenText ? (
                    <p className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] px-3.5 py-3 text-[14px] text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                      {absenText}
                    </p>
                  ) : (
                    <ul className="divide-y divide-black/5 dark:divide-white/10 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E]">
                      {absenList.map((a, i) => (
                        <li key={i} className="flex justify-between gap-3 px-3.5 py-2.5 text-[14px] text-gray-900 dark:text-white">
                          <span>{a.nama}</span>
                          <span className={muted}>{a.keterangan}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {report.foto_url && (
                <a href={report.foto_url} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={report.foto_url}
                    alt="Dokumentasi safety talk"
                    loading="lazy"
                    className="w-full max-h-64 object-cover rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E]"
                  />
                </a>
              )}

              {/* Area tombol: Edit/Hapus mengecil, konfirmasi hapus mengembang (animasi mulus) */}
              <div className="mt-4">
                <div
                  aria-hidden={confirmDelete}
                  className="grid motion-reduce:transition-none"
                  style={{
                    gridTemplateRows: confirmDelete ? '0fr' : '1fr',
                    opacity: confirmDelete ? 0 : 1,
                    transition: `grid-template-rows .4s ${ease}, opacity .25s ease`,
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        tabIndex={confirmDelete ? -1 : 0}
                        onClick={startEdit}
                        className="py-3.5 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] font-semibold text-[16px] active:scale-[0.98] transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        tabIndex={confirmDelete ? -1 : 0}
                        onClick={() => setConfirmDelete(true)}
                        className="py-3.5 rounded-2xl bg-[#FF3B30]/[0.12] text-[#D70015] dark:text-[#FF453A] font-semibold text-[16px] active:scale-[0.98] transition"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  aria-hidden={!confirmDelete}
                  className="grid motion-reduce:transition-none"
                  style={{
                    gridTemplateRows: confirmDelete ? '1fr' : '0fr',
                    opacity: confirmDelete ? 1 : 0,
                    transition: `grid-template-rows .4s ${ease}, opacity .3s ease ${confirmDelete ? '.08s' : '0s'}`,
                  }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="p-4 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-center"
                      style={{
                        transform: confirmDelete ? 'translateY(0) scale(1)' : 'translateY(10px) scale(.97)',
                        transition: `transform .45s ${ease}`,
                      }}
                    >
                      <div className="w-11 h-11 rounded-full bg-[#FF3B30]/15 grid place-items-center mx-auto mb-2.5">
                        <svg className="w-5 h-5 text-[#D70015] dark:text-[#FF453A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" />
                        </svg>
                      </div>
                      <p className="text-[#D70015] dark:text-[#FF453A] font-semibold text-[14.5px] leading-tight mb-3 px-2">
                        Yakin ingin menghapus laporan ini? Data akan hilang permanen.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          tabIndex={confirmDelete ? 0 : -1}
                          onClick={() => setConfirmDelete(false)}
                          disabled={isDeleting}
                          className="py-3 rounded-xl bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white font-semibold text-[15px] shadow-sm active:scale-95 transition disabled:opacity-50"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          tabIndex={confirmDelete ? 0 : -1}
                          onClick={executeDel}
                          disabled={isDeleting}
                          className="py-3 rounded-xl bg-[#FF3B30] text-white font-semibold text-[15px] flex justify-center items-center gap-2 shadow-sm active:scale-95 transition disabled:opacity-70"
                        >
                          {isDeleting ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Menghapus</span>
                            </>
                          ) : (
                            'Ya, Hapus'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Animasi sukses: lingkaran hijau membesar, lalu centang tergambar */}
            <div
              role="status"
              aria-live="polite"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
              style={{ opacity: deleted ? 1 : 0, transition: 'opacity .3s ease .1s' }}
            >
              <div
                className="w-[76px] h-[76px] rounded-full bg-[#34C759] grid place-items-center shadow-[0_8px_24px_rgba(52,199,89,0.35)]"
                style={{
                  transform: deleted ? 'scale(1)' : 'scale(.5)',
                  transition: 'transform .55s cubic-bezier(.34,1.56,.64,1) .1s',
                }}
              >
                <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    pathLength="1"
                    style={{
                      strokeDasharray: 1,
                      strokeDashoffset: deleted ? 0 : 1,
                      transition: 'stroke-dashoffset .4s ease-out .35s',
                    }}
                  />
                </svg>
              </div>
              <p className="text-[17px] font-semibold text-gray-900 dark:text-white">{deleted ? 'Laporan dihapus' : ''}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={save} className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Edit laporan</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tanggal">
                <input type="date" required value={form.tanggal} onChange={(e) => set('tanggal', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Shift">
                <select value={form.shift} onChange={(e) => set('shift', e.target.value)} className={inputCls}>
                  {allowedShifts.map((s) => (
                    <option key={s} value={s}>{SHIFT_LABEL[s] || s}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Unit kerja">
              <select value={form.unit_nama} onChange={(e) => changeUnit(e.target.value)} className={inputCls}>
                {UNIT_NAMES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </Field>
            <Field label="Nama koordinator">
              <input type="text" required value={form.nama_koordinator} onChange={(e) => set('nama_koordinator', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Materi">
              <input type="text" required value={form.materi} onChange={(e) => set('materi', e.target.value)} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Personil">
                <input type="number" inputMode="numeric" min="1" required value={form.jml_personil} onChange={(e) => set('jml_personil', e.target.value)} className={`${inputCls} text-center`} />
              </Field>
              <Field label="Hadir">
                <input type="number" inputMode="numeric" min="0" max={form.jml_personil || undefined} required value={form.jml_hadir} onChange={(e) => set('jml_hadir', e.target.value)} className={`${inputCls} text-center`} />
              </Field>
            </div>
            {'absensi' in form && Number(form.jml_personil) > Number(form.jml_hadir) && (
              <Field label="Keterangan ketidakhadiran">
                <textarea rows="2" value={form.absensi} onChange={(e) => set('absensi', e.target.value)} className={`${inputCls} resize-none`} />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button type="button" onClick={() => setEditing(false)} className="py-3.5 rounded-2xl bg-[#767680]/15 text-gray-900 dark:text-white font-semibold text-[16px] active:scale-[0.98] transition">
                Batal
              </button>
              <button type="submit" disabled={busy} className="py-3.5 rounded-2xl bg-[#007AFF] disabled:opacity-50 text-white font-semibold text-[16px] active:scale-[0.98] transition">
                {busy ? 'Menyimpan...' : 'Simpan perubahan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------- Halaman utama ----------
export default function Dashboard() {
  const now = new Date();
  const todayKey = toKey(now);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const [view, setView] = useState('hari');
  const [date, setDate] = useState(todayKey);
  const [filter, setFilter] = useState('belum');
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [sheet, setSheet] = useState(null);
  const todayRef = useRef(todayKey);

  // State untuk notifikasi Toast yang elegan
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
      setError(false);
      setUpdatedAt(new Date());
    } catch (e) {
      console.error('Gagal mengambil data:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const t = setInterval(() => {
      fetchReports();
      const k = toKey(new Date());
      if (k !== todayRef.current) {
        const old = todayRef.current;
        todayRef.current = k;
        setDate((d) => (d === old ? k : d));
      }
    }, 60000);
    return () => clearInterval(t);
  }, []);

  const byKey = useMemo(() => {
    const m = new Map();
    reports.forEach((r) => {
      const k = `${dateOf(r)}|${r.unit_nama}|${r.shift}`;
      if (!m.has(k)) m.set(k, r);
    });
    return m;
  }, [reports]);

  const day = useMemo(() => {
    const rows = UNITS.map((u) => {
      const slots = u.shifts.map((s) => ({ shift: s, report: byKey.get(`${date}|${u.name}|${s}`) }));
      const done = slots.filter((s) => s.report).length;
      return { ...u, slots, done, state: done === 0 ? 'none' : done === slots.length ? 'full' : 'part' };
    });
    return {
      rows,
      full: rows.filter((r) => r.state === 'full').length,
      slotsTotal: rows.reduce((a, r) => a + r.slots.length, 0),
      slotsDone: rows.reduce((a, r) => a + r.done, 0),
    };
  }, [byKey, date]);

  const dim = new Date(month.y, month.m + 1, 0).getDate();
  const days = Array.from({ length: dim }, (_, i) => i + 1);
  const monthKey = (d) => `${month.y}-${pad(month.m + 1)}-${pad(d)}`;
  const compliance = useMemo(() => {
    let exp = 0;
    let got = 0;
    UNITS.forEach((u) =>
      u.shifts.forEach((s) => {
        for (let d = 1; d <= dim; d++) {
          const k = `${month.y}-${pad(month.m + 1)}-${pad(d)}`;
          if (k > todayKey) break;
          exp++;
          if (byKey.has(`${k}|${u.name}|${s}`)) got++;
        }
      })
    );
    return { exp, got, pct: exp ? Math.round((got / exp) * 100) : null };
  }, [byKey, month, dim, todayKey]);

  const moveMonth = (n) =>
    setMonth(({ y, m }) => {
      const d = new Date(y, m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const { y: yr, m } = month;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MONITORING PELAKSANAAN SAFETY TALK PT. BIRINGKASSI RAYA', 148, 11, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Bulan: ${BULAN[m]} ${yr}`, 14, 16);

    const nums = Array.from({ length: 31 }, (_, i) => i + 1);
    const mark = (name, shift, d) => (byKey.has(`${yr}-${pad(m + 1)}-${pad(d)}|${name}|${shift}`) ? 'CHECK' : '');
    const unitRows = new Set();
    const body = [];
    UNITS.forEach((u, i) => {
      if (u.shifts.length === 1) {
        body.push([i + 1, u.name, ...nums.map((d) => mark(u.name, u.shifts[0], d)), '']);
        return;
      }
      unitRows.add(body.length);
      body.push([i + 1, u.name, ...nums.map(() => ''), '']);
      u.shifts.forEach((s) => body.push(['', `   ${SHIFT_LABEL[s]}`, ...nums.map((d) => mark(u.name, s, d)), '']));
    });

    autoTable(doc, {
      startY: 19,
      head: [['No', 'Unit / Shift', ...nums.map(String), 'Keterangan']],
      body,
      theme: 'grid',
      headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 6, halign: 'center', cellPadding: 0.8, lineWidth: 0.1, lineColor: [0, 0, 0] },
      styles: { fontSize: 5.5, cellPadding: 0.6, valign: 'middle', lineWidth: 0.1, lineColor: [180, 180, 180], textColor: [0, 0, 0] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 7 },
        1: { cellWidth: 50 },
        ...Object.fromEntries(nums.map((n) => [n + 1, { halign: 'center', cellWidth: 6.2 }])),
        33: { cellWidth: 16 },
      },
      didParseCell: (d) => {
        if (d.section === 'body') {
          if (unitRows.has(d.row.index)) {
            d.cell.styles.fontStyle = 'bold';
            d.cell.styles.fillColor = [242, 242, 247];
          }
          // Kosongkan teks agar tidak ada huruf/angka yang tercetak
          if (d.cell.raw === 'CHECK') {
            d.cell.text = [''];
          }
        }
      },
      didDrawCell: (d) => {
        // Menggambar simbol centang (✓) vektor langsung di kanvas PDF
        if (d.section === 'body' && d.cell.raw === 'CHECK') {
          const cx = d.cell.x + d.cell.width / 2;
          const cy = d.cell.y + d.cell.height / 2;

          doc.saveGraphicsState();
          doc.setDrawColor(30, 142, 62); // Warna hijau K3 (#1E8E3E)
          doc.setLineWidth(0.35);

          // Gambar centang: titik awal kiri -> sudut bawah -> ujung kanan atas
          doc.line(cx - 1.1, cy - 0.1, cx - 0.3, cy + 0.9);
          doc.line(cx - 0.3, cy + 0.9, cx + 1.2, cy - 1.0);

          doc.restoreGraphicsState();
        }
      },
    });

    let fy = doc.lastAutoTable.finalY + 7;
    if (fy > 170) {
      doc.addPage();
      fy = 20;
    }
    doc.setFontSize(7.5);
    [
      [30, 'Diketahui,', 'Direktur Operasi', 'Rifki S. Pradipta, S.Kom'],
      [135, 'Mengetahui,', 'Kadiv LGRC', "H. Ma'rang"],
      [240, 'Dibuat,', 'Kanit K3', 'Haeruddin'],
    ].forEach(([x, a, b, c]) => {
      doc.setFont('helvetica', 'normal');
      doc.text(a, x, fy);
      doc.text(b, x, fy + 4);
      doc.setFont('helvetica', 'bold');
      doc.text(c, x, fy + 18);
    });

    doc.save(`Monitoring_Safety_Talk_${BULAN[m]}_${yr}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-16 text-[#8E8E93]">
        <div className="w-7 h-7 rounded-full border-[3px] border-[#8E8E93]/30 border-t-[#007AFF] animate-spin" />
        <span className="text-sm font-medium">Memuat status unit...</span>
      </div>
    );
  }

  if (error && reports.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4">
        <div className={`${cardCls} p-6 text-center`}>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tidak bisa terhubung ke server</h2>
          <p className={`text-sm mt-1 ${muted}`}>Status unit tidak bisa ditampilkan. Pastikan backend menyala, lalu coba lagi.</p>
          <button onClick={fetchReports} className="mt-4 w-full py-3 rounded-2xl bg-[#007AFF] text-white font-semibold active:scale-[0.98] transition">
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  const pct = day.slotsTotal ? Math.round((day.slotsDone / day.slotsTotal) * 100) : 0;
  const nBelum = UNITS.length - day.full;
  const groups = GROUPS.map((g) => ({
    ...g,
    items: day.rows
      .filter((r) => r.group === g.id && (filter === 'semua' || (filter === 'sudah') === (r.state === 'full')))
      .sort((a, b) => ORDER[a.state] - ORDER[b.state]),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">

      {/* Toast Notification Floating (Muncul saat berhasil hapus/edit) */}
      {toast && (
        <div className="fade-in fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-[14.5px] font-semibold text-white tracking-wide" style={{ backgroundColor: toast.type === 'error' ? '#FF3B30' : '#34C759' }}>
          <span className="text-lg leading-none">{toast.type === 'error' ? '!' : '✓'}</span>
          {toast.message}
        </div>
      )}

      <div className="px-1 mb-4">
        <h1 className="text-[30px] sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Status Safety Talk</h1>
        <p className={`text-[15px] mt-1 ${muted}`}>
          Unit mana yang sudah melapor, diperbarui otomatis
          {updatedAt && `, terakhir ${updatedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
        </p>
      </div>

      <Segmented
        value={view}
        onChange={setView}
        options={[
          { id: 'hari', label: 'Status harian' },
          { id: 'bulan', label: 'Rekap bulanan' },
        ]}
      />

      {error && (
        <div className="mt-3 rounded-2xl bg-[#FF9F0A]/15 text-[#C93400] dark:text-[#FF9F0A] text-[13px] font-medium px-4 py-3">
          Gagal memperbarui data. Yang tampil adalah data terakhir yang berhasil dimuat.
        </div>
      )}

      {view === 'hari' ? (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Hari sebelumnya" className={roundBtn} onClick={() => setDate(shiftDay(date, -1))}>
              <Chevron dir="l" />
            </button>
            <label className={`${cardCls} relative flex-1 h-10 grid place-items-center text-[15px] font-semibold text-gray-900 dark:text-white`}>
              {date === todayKey ? `Hari ini, ${fmtLong(date)}` : fmtLong(date)}
              <input
                type="date"
                aria-label="Pilih tanggal"
                value={date}
                max={todayKey}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </label>
            <button type="button" aria-label="Hari berikutnya" className={roundBtn} disabled={date >= todayKey} onClick={() => setDate(shiftDay(date, 1))}>
              <Chevron dir="r" />
            </button>
          </div>
          {date !== todayKey && (
            <button type="button" onClick={() => setDate(todayKey)} className="block mx-auto text-[14px] font-semibold text-[#007AFF] active:opacity-60">
              Kembali ke hari ini
            </button>
          )}

          <div className={`${cardCls} p-5`}>
            <p className="text-[34px] font-bold tracking-tight leading-none tabular-nums text-gray-900 dark:text-white">
              {day.full}
              <span className={`text-xl font-semibold ${muted}`}> dari {UNITS.length} unit lengkap</span>
            </p>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-label="Laporan shift yang sudah masuk"
              className="mt-4 h-2.5 rounded-full bg-[#767680]/15 overflow-hidden"
            >
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#34C759' : '#007AFF' }}
              />
            </div>
            <p className={`text-[13px] font-medium mt-2 ${muted}`}>
              {day.slotsDone} dari {day.slotsTotal} laporan shift sudah masuk
            </p>
          </div>

          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { id: 'belum', label: `Belum (${nBelum})` },
              { id: 'sudah', label: `Sudah (${day.full})` },
              { id: 'semua', label: 'Semua' },
            ]}
          />

          {groups.length === 0 ? (
            <div className={`${cardCls} p-10 text-center text-sm ${muted}`}>
              {filter === 'belum' ? 'Semua unit sudah melapor lengkap.' : 'Belum ada unit yang melapor lengkap.'}
            </div>
          ) : (
            groups.map((g) => (
              <section key={g.id}>
                <h2 className={`text-[14px] font-semibold ${muted} mb-2 ml-1`}>
                  {g.title} ({g.items.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {g.items.map((r) => (
                    <UnitCard key={r.name} r={r} onOpen={setSheet} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Bulan sebelumnya" className={roundBtn} onClick={() => moveMonth(-1)}>
              <Chevron dir="l" />
            </button>
            <div className={`${cardCls} flex-1 h-10 grid place-items-center text-[15px] font-semibold text-gray-900 dark:text-white`}>
              {BULAN[month.m]} {month.y}
            </div>
            <button
              type="button"
              aria-label="Bulan berikutnya"
              className={roundBtn}
              disabled={month.y === now.getFullYear() && month.m >= now.getMonth()}
              onClick={() => moveMonth(1)}
            >
              <Chevron dir="r" />
            </button>
          </div>

          <div className={`${cardCls} p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}>
            <div>
              <p className="text-2xl font-bold tracking-tight tabular-nums text-gray-900 dark:text-white">
                {compliance.pct === null ? '-' : `${compliance.pct}%`}
                <span className={`text-base font-semibold ${muted}`}> laporan shift terpenuhi</span>
              </p>
              <p className={`text-[13px] font-medium ${muted}`}>
                {compliance.got} dari {compliance.exp} laporan, dihitung sampai hari ini
              </p>
            </div>
            <button
              type="button"
              onClick={exportPDF}
              className="inline-flex items-center justify-center gap-2 bg-[#007AFF] active:bg-[#0062CC] text-white font-semibold text-[15px] px-5 py-3 rounded-2xl shadow-[0_4px_14px_rgba(0,122,255,0.3)] active:scale-[0.98] transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Unduh ceklist PDF
            </button>
          </div>

          <div className={`${cardCls} overflow-hidden`}>
            <div className="overflow-auto max-h-[68vh]">
              <table className="border-separate border-spacing-0 text-[12px]">
                <thead>
                  <tr>
                    <th className="sticky top-0 left-0 z-30 bg-white dark:bg-[#1C1C1E] text-left px-3 py-2 font-semibold text-gray-900 dark:text-white min-w-[160px] max-w-[160px] border-b border-black/10 dark:border-white/10">
                      Unit / shift
                    </th>
                    {days.map((d) => (
                      <th
                        key={d}
                        className={`sticky top-0 z-20 bg-white dark:bg-[#1C1C1E] min-w-[28px] py-2 font-semibold tabular-nums border-b border-black/10 dark:border-white/10 ${
                          monthKey(d) === todayKey ? 'text-[#007AFF]' : muted
                        }`}
                      >
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {UNITS.map((u) => {
                    const multi = u.shifts.length > 1;
                    return (
                      <Fragment key={u.name}>
                        {multi && (
                          <tr>
                            <th colSpan={dim + 1} className="text-left bg-[#F2F2F7] dark:bg-[#2C2C2E] py-1.5 font-semibold text-gray-900 dark:text-white">
                              <div className="sticky left-0 w-max px-3">{u.name}</div>
                            </th>
                          </tr>
                        )}
                        {u.shifts.map((s) => (
                          <tr key={s}>
                            <th className="sticky left-0 z-10 bg-white dark:bg-[#1C1C1E] text-left px-3 py-1 leading-tight min-w-[160px] max-w-[160px] border-b border-black/5 dark:border-white/5">
                              {multi ? (
                                <span className={`pl-3 font-medium ${muted}`}>{SHIFT_LABEL[s]}</span>
                              ) : (
                                <span className="font-semibold text-gray-900 dark:text-white">{u.name}</span>
                              )}
                            </th>
                            {days.map((d) => {
                              const k = monthKey(d);
                              const rep = byKey.get(`${k}|${u.name}|${s}`);
                              return (
                                <td
                                  key={d}
                                  className={`p-0 border-b border-black/5 dark:border-white/5 ${k === todayKey ? 'bg-[#007AFF]/[0.08]' : ''}`}
                                >
                                  {rep ? (
                                    <button
                                      type="button"
                                      onClick={() => setSheet(rep)}
                                      aria-label={`${u.name}, ${SHIFT_LABEL[s]}, tanggal ${d}: lihat laporan`}
                                      className="w-7 h-7 grid place-items-center font-bold text-[#1E8E3E] dark:text-[#30D158] active:scale-90"
                                    >
                                      ✓
                                    </button>
                                  ) : (
                                    <span
                                      title={k > todayKey ? '' : 'Belum melapor'}
                                      className={`block w-7 h-7 ${k > todayKey ? '' : 'bg-[#FF3B30]/[0.07]'}`}
                                    />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className={`text-[12px] ${muted} px-1`}>
            Tanda ✓ berarti sudah melapor dan bisa diketuk untuk melihat detail. Kotak merah muda berarti belum melapor.
          </p>
        </div>
      )}

      {sheet && (
        <DetailSheet
          report={sheet}
          onClose={() => setSheet(null)}
          onSaved={(rep) => setReports((rs) => rs.map((r) => (r.id === rep.id ? rep : r)))}
          onDeleted={(id) => setReports((rs) => rs.filter((r) => r.id !== id))}
          showToast={showToast}
        />
      )}
    </div>
  );
}