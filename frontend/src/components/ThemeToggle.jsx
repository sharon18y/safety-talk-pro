import { useState, useRef } from 'react';
import { flushSync } from 'react-dom';

// Ambil tema awal: pilihan tersimpan, kalau belum ada ikuti pengaturan sistem
const getInitialDark = () => {
  try {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
  } catch (e) {
    /* abaikan */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const d = getInitialDark();
    document.documentElement.classList.toggle('dark', d);
    return d;
  });
  const btnRef = useRef(null);

  const toggle = (e) => {
    const next = !dark;
    const root = document.documentElement;
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch (err) {
      /* abaikan */
    }

    const apply = () => {
      root.classList.toggle('dark', next);
      flushSync(() => setDark(next));
    };

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Browser tanpa View Transitions: ganti warna dengan fade halus
    if (!document.startViewTransition || reduce) {
      if (!reduce) {
        root.classList.add('theme-fade');
        setTimeout(() => root.classList.remove('theme-fade'), 450);
      }
      apply();
      return;
    }

    // Titik asal lingkaran = posisi klik (atau tengah tombol jika lewat keyboard)
    let x = e.clientX;
    let y = e.clientY;
    if (!x && !y) {
      const r = btnRef.current.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }
    // Radius sampai sudut layar terjauh, supaya seluruh layar pasti tertutup
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(apply);
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          {
            duration: 750,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      })
      .catch(() => {});
  };

  const iconBase =
    'absolute w-5 h-5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]';

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
      aria-pressed={dark}
      className="relative w-10 h-10 rounded-full grid place-items-center bg-[#767680]/15 text-gray-900 dark:text-white active:scale-90 transition-transform"
    >
      {/* Matahari tampil saat gelap (klik untuk terang) */}
      <svg
        className={`${iconBase} ${dark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      {/* Bulan tampil saat terang (klik untuk gelap) */}
      <svg
        className={`${iconBase} ${dark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
      </svg>
    </button>
  );
}