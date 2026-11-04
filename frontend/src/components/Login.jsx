// Simpan di: frontend/src/components/Login.jsx (sesuaikan dengan lokasi file Login Anda)
import { useState } from 'react';
import { createPortal } from 'react-dom';

// Gaya khusus halaman login: latar gelap kalem dengan cahaya yang bergeser sangat pelan
const css = `
.login-bg {
  position: fixed; inset: 0; z-index: 35; /* di bawah menu bawah (z-40) agar tombol Dasbor tetap bisa diketuk */
  overflow-y: auto; overscroll-behavior: contain;
  background: linear-gradient(160deg, #14213d 0%, #0e1830 52%, #0a1020 100%);
}
html.dark .login-bg { background: linear-gradient(160deg, #0d1424 0%, #090e1a 55%, #05080f 100%); }

/* Pinggiran sedikit gelap agar pandangan terpusat ke kartu */
.login-bg::after {
  content: ''; position: fixed; inset: 0; z-index: 1; pointer-events: none;
  background: radial-gradient(ellipse at 50% 42%, transparent 38%, rgba(0, 0, 0, 0.38) 100%);
}

/* Cahaya lembut: warna kalem, hanya bergerak lewat transform (ringan dan mulus) */
.login-blob {
  position: fixed; border-radius: 9999px; pointer-events: none; will-change: transform;
  width: 70vmax; height: 70vmax;
}
html.dark .login-blob { opacity: 0.7; }
.login-blob.b1 { top: -28vmax; left: -22vmax; background: radial-gradient(circle, hsl(216 72% 46% / 0.55) 0%, transparent 65%); animation: loginDrift1 52s ease-in-out infinite alternate; }
.login-blob.b2 { top: -12vmax; right: -32vmax; background: radial-gradient(circle, hsl(258 52% 48% / 0.40) 0%, transparent 65%); animation: loginDrift2 64s ease-in-out infinite alternate; }
.login-blob.b3 { bottom: -34vmax; left: -8vmax; background: radial-gradient(circle, hsl(192 58% 38% / 0.34) 0%, transparent 65%); animation: loginDrift3 58s ease-in-out infinite alternate; }
.login-blob.b4 { bottom: -30vmax; right: -24vmax; width: 55vmax; height: 55vmax; background: radial-gradient(circle, hsl(22 78% 48% / 0.16) 0%, transparent 65%); animation: loginDrift4 72s ease-in-out infinite alternate; }

@keyframes loginDrift1 { to { transform: translate3d(10vw, 8vh, 0) scale(1.08); } }
@keyframes loginDrift2 { to { transform: translate3d(-12vw, 10vh, 0) scale(0.94); } }
@keyframes loginDrift3 { to { transform: translate3d(11vw, -9vh, 0) scale(1.1); } }
@keyframes loginDrift4 { to { transform: translate3d(-9vw, -10vh, 0) scale(1.06); } }

/* Masuk bertahap: kartu naik pelan, isinya menyusul satu per satu */
.login-card { animation: loginCardIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes loginCardIn { from { opacity: 0; transform: translateY(16px) scale(0.985); } to { opacity: 1; transform: none; } }
.login-rise { animation: loginRise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; animation-delay: var(--d, 0s); }
@keyframes loginRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

/* Getaran halus saat gagal masuk */
.login-shake { animation: loginShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
@keyframes loginShake {
  10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-3px); } 40%, 60% { transform: translateX(3px); }
}

/* Isian otomatis browser tetap tampil gelap dan menyatu */
.login-input:-webkit-autofill {
  -webkit-text-fill-color: #fff;
  box-shadow: 0 0 0 1000px rgba(18, 28, 52, 0.95) inset;
  transition: background-color 9999s ease-in-out 0s;
}

@media (prefers-reduced-motion: reduce) {
  .login-blob, .login-card, .login-rise, .login-shake { animation: none !important; }
}
`;

const fieldCls =
  'login-input w-full rounded-xl bg-white/[0.07] border border-white/15 px-4 py-3.5 text-[15px] text-white placeholder-white/40 outline-none transition-[background-color,border-color,box-shadow] duration-300 focus:bg-white/[0.11] focus:border-[#64A8FF]/70 focus:ring-4 focus:ring-[#0A84FF]/20';
const labelCls = 'block text-[13px] font-medium text-white/70 mb-1.5 ml-1';

export default function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [caps, setCaps] = useState(false);

  // Alamat backend: ubah lewat VITE_API_URL di file .env frontend jika bukan localhost:5001
  const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/login`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Simpan token ke penyimpanan lokal browser
        localStorage.setItem('safety_token', data.token);
        onLoginSuccess();
      } else {
        setError(data.message || 'Login gagal');
      }
    } catch (err) {
      setError('Gagal menghubungi server');
    } finally {
      setLoading(false);
    }
  };

  // Dirender lewat portal ke <body>: tidak terpengaruh animasi perpindahan halaman, dan menu bawah tetap di atasnya
  return createPortal(
    <div className="login-bg">
      <style>{css}</style>
      <span className="login-blob b1" />
      <span className="login-blob b2" />
      <span className="login-blob b3" />
      <span className="login-blob b4" />

      <div className="relative z-10 min-h-[100dvh] flex items-center justify-center p-5 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <div className="login-card w-full max-w-[380px] rounded-[28px] px-7 py-9 sm:px-8 bg-white/[0.08] backdrop-blur-2xl backdrop-saturate-150 border border-white/[0.14] shadow-[0_24px_64px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]">
          <div className="login-rise text-center mb-8" style={{ '--d': '0.1s' }}>
            <div className="w-14 h-14 mx-auto rounded-[18px] bg-gradient-to-b from-[#FF9F0A] to-[#FF6B00] text-white grid place-items-center shadow-[0_8px_24px_rgba(255,107,0,0.28),inset_0_1px_0_rgba(255,255,255,0.3)] mb-5">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h1 className="text-[24px] font-semibold tracking-tight text-white">SafetyTalk</h1>
            <p className="text-[14px] text-white/60 mt-1">Masuk untuk melanjutkan</p>
          </div>

          {error && (
            <div
              key={error}
              role="alert"
              className="login-shake mb-5 px-4 py-3 rounded-xl bg-[#FF453A]/15 border border-[#FF453A]/30 text-[#FFB4AE] text-[13px] font-medium text-center"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="login-rise" style={{ '--d': '0.2s' }}>
              <label htmlFor="login-username" className={labelCls}>Username</label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={fieldCls}
              />
            </div>

            <div className="login-rise" style={{ '--d': '0.3s' }}>
              <label htmlFor="login-password" className={labelCls}>Kata sandi</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onKeyUp={(e) => setCaps(e.getModifierState?.('CapsLock') ?? false)}
                  onBlur={() => setCaps(false)}
                  className={`${fieldCls} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-full text-white/55 hover:text-white active:scale-90 transition"
                >
                  {showPass ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {caps && <p className="mt-1.5 ml-1 text-[12px] font-medium text-[#FFD60A]/90">Caps Lock sedang aktif</p>}
            </div>

            <div className="login-rise pt-1" style={{ '--d': '0.4s' }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white text-[16px] font-semibold bg-[#0A84FF] hover:bg-[#2B93FF] active:bg-[#0A74E0] shadow-[0_8px_24px_rgba(10,132,255,0.32),inset_0_1px_0_rgba(255,255,255,0.22)] active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed transition duration-300"
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Memverifikasi...
                  </span>
                ) : (
                  'Masuk'
                )}
              </button>
            </div>
          </form>

          <p className="login-rise mt-7 text-center text-[12px] text-white/40" style={{ '--d': '0.5s' }}>
            Khusus petugas PT. Biringkassi Raya
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}