import { useEffect, useRef } from 'react';

export default function CloudinaryUpload({ onUploadSuccess }) {
  const widgetRef = useRef(null);

  useEffect(() => {
    // 1. Cegah error jika script Cloudinary belum selesai dimuat oleh browser
    if (!window.cloudinary) {
      console.error('Script Cloudinary belum termuat. Pastikan tag <script> sudah ada di index.html');
      return;
    }

    // 2. Mencegah error pembuatan widget berulang kali (React Strict Mode preventer)
    if (!widgetRef.current) {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: 'xkcij8vr',      
          uploadPreset: 'ml_default', 
          
          multiple: false, 
          resourceType: 'image',
          clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
          maxFileSize: 5000000, // Tolak file awal yang lebih dari 5MB

          // ==========================================
          // FITUR KOMPRESI OTOMATIS (Mencegah storage penuh)
          // ==========================================
          
          // A. Resize gambar di browser HP sebelum dikirim (Hemat kuota internet lapangan)
          maxImageWidth: 1200,
          maxImageHeight: 1200,

          // B. Transformasi otomatis di Server Cloudinary
          // Mengubah format ke WebP kualitas Auto (Foto 3MB akan menjadi sekitar 80KB-150KB tanpa pecah)
          transformation: [
            { quality: 'auto', fetch_format: 'webp', crop: 'limit', width: 1200 }
          ],
        },
        (error, result) => {
          if (!error && result && result.event === 'success') {
            console.log('Upload sukses:', result.info.secure_url);
            onUploadSuccess(result.info.secure_url);
          } else if (error) {
            console.error('Cloudinary Widget Error:', error);
          }
        }
      );
    }
  }, [onUploadSuccess]);

  const handleOpenWidget = () => {
    if (widgetRef.current) {
      widgetRef.current.open();
    } else {
      alert('Sistem uploader sedang disiapkan atau koneksi tidak stabil. Tunggu sebentar atau muat ulang halaman (Ctrl+F5).');
    }
  };

  return (
    <button
      type="button"
      onClick={handleOpenWidget}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] font-semibold text-[15px] active:scale-[0.98] active:bg-[#007AFF]/20 transition duration-200 cursor-pointer"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
      </svg>
      Unggah Foto Dokumentasi
    </button>
  );
}