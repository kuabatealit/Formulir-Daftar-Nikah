import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { FileCheck2, FileText, ShieldCheck, BookOpen } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';

const HERO_IMAGE = '/src/assets/images/login_hero_heritage_1795135922179.jpg';

const DOCUMENT_LIST = [
  '01. Form N1 — Pengantar Nikah Desa/Kelurahan',
  '02. Form N2 — Permohonan Kehendak Nikah',
  '03. Form N4 — Persetujuan Calon Pengantin',
  '04. Form N5 — Surat Izin Orang Tua',
  '05. SPTJM Pemeriksaan Berkas Catin',
  '06. Surat Kuasa Pengurusan Nikah ke KUA',
  '07. Surat Pernyataan Belum Pernah Menikah',
  '08. Surat Keterangan Wali Nikah dari Desa',
];

export function LoginView() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal masuk dengan akun Google.';
      if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('Jendela login ditutup sebelum selesai. Silakan coba kembali.');
      } else if (msg.includes('popup-blocked')) {
        setErrorMsg('Popup login diblokir oleh peramban. Izinkan popup lalu coba lagi.');
      } else {
        setErrorMsg('Gagal melakukan autentikasi Google. Periksa koneksi lalu coba kembali.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <div className="flex-1 grid lg:grid-cols-12 items-stretch">
        {/* Left Editorial Column */}
        <div className="lg:col-span-6 relative bg-slate-900 text-white overflow-hidden flex flex-col justify-between min-h-[340px] lg:min-h-screen">
          {!imgFailed ? (
            <img
              src={HERO_IMAGE}
              alt="Meja administrasi pemberkasan nikah resmi"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 flex items-center justify-center">
              <BookOpen className="w-20 h-20 text-emerald-800/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-slate-950/25" />

          <div className="relative z-10 p-8 lg:p-12">
            <div className="text-sm font-medium text-emerald-200 tracking-wide">
              form-daftar-nikah.vercel.app
            </div>
          </div>

          <div className="relative z-10 p-8 lg:p-12 space-y-6 max-w-xl">
            <h1
              className="text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight"
              style={{ textWrap: 'balance' }}
            >
              Sekali input data catin, seluruh 8 berkas nikah A4 langsung siap cetak.
            </h1>
            <p className="text-sm lg:text-base text-slate-200 leading-relaxed">
              Dirancang untuk mempermudah petugas Desa/Kelurahan, Modin, KUA, dan calon pengantin
              menyusun dokumen pemberkasan nikah sesuai PMA Pencatatan Pernikahan dan Kepdirjen
              Bimas Islam No. 473 Tahun 2020.
            </p>

            <div className="pt-4 border-t border-white/15 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-200">
              {DOCUMENT_LIST.map((item) => (
                <div key={item} className="leading-relaxed">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sign-In Column */}
        <div className="lg:col-span-6 flex items-center justify-center p-8 lg:p-16 bg-white">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2.5 text-emerald-900">
                <div className="w-9 h-9 rounded-lg bg-emerald-900 text-white flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold font-display tracking-tight text-slate-900">
                  Form Daftar Nikah
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Masuk ke Dasbor Pemberkasan
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Seluruh data calon pengantin, orang tua, dan wali nikah tersimpan otomatis pada akun
                Anda, dapat dilihat kembali, diedit kapan saja, dan diekspor ke Word (.docx) atau PDF
                ukuran A4.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-medium text-sm transition-colors disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.48-1.73 4.35-5.27 4.35-3.17 0-5.76-2.62-5.76-5.87s2.59-5.87 5.76-5.87c1.81 0 3.02.77 3.71 1.43l2.53-2.44C16.78 4.1 14.69 3.2 12.17 3.2 7.21 3.2 3.2 7.21 3.2 12.5s4.01 9.3 8.97 9.3c5.18 0 8.61-3.64 8.61-8.77 0-.59-.07-1.04-.15-1.48l.72-.45z"
                  />
                </svg>
                {loading ? 'Menghubungkan ke Akun Google...' : 'Masuk dengan Akun Google'}
              </button>
            </div>

            <div className="pt-6 border-t border-slate-200 space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                <span>
                  Data berkas bersifat privat per akun login dan dilindungi aturan akses berbasis
                  identitas akun.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                <span>
                  Output dokumen resmi berformat kertas A4 (210 × 297 mm) siap cetak maupun diedit
                  ulang di Microsoft Word.
                </span>
              </div>
            </div>

            <footer className="pt-4 text-xs text-slate-400 flex items-center justify-between">
              <span>Form Daftar Nikah</span>
              <span className="font-mono-tabular">form-daftar-nikah.vercel.app</span>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
