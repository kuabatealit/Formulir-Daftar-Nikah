import { useEffect, useRef, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarHeart,
  Check,
  Copy,
  FileCheck2,
  Printer,
  Save,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  type BerkasNikahData,
  type ParentBiodata,
  type PersonBiodata,
  createSampleBerkas,
  getHariIndonesia,
  hitungUsia,
} from '../types/berkas';

interface Props {
  ownerId: string;
  initialData: BerkasNikahData;
  recordId: string | null;
  onSave: (data: BerkasNikahData, existingId: string | null) => Promise<string>;
  onArchive?: (recordId: string) => Promise<void>;
  onOpenPreview: (data: BerkasNikahData, savedId: string | null) => void;
  onBack: () => void;
}

type StepKey = 'desa' | 'catin' | 'ortu' | 'wali' | 'akad' | 'tambahan';

const STEPS: { key: StepKey; label: string; short: string; icon: typeof Building2 }[] = [
  { key: 'desa', label: '01. Desa, KUA & Surat', short: 'Desa & KUA', icon: Building2 },
  { key: 'catin', label: '02. Data Calon Pengantin', short: 'Calon Pengantin', icon: Users },
  { key: 'ortu', label: '03. Orang Tua Catin', short: 'Orang Tua', icon: Users },
  { key: 'wali', label: '04. Wali Nikah', short: 'Wali Nikah', icon: UserCheck },
  { key: 'akad', label: '05. Rencana Akad Nikah', short: 'Rencana Akad', icon: CalendarHeart },
  { key: 'tambahan', label: '06. SPTJM & Surat Kuasa', short: 'SPTJM & Kuasa', icon: ShieldCheck },
];

const HUBUNGAN_WALI_OPTIONS = [
  'Ayah Kandung',
  'Kakek dari Pihak Ayah (Ayah dari Ayah)',
  'Saudara Laki-laki Sekandung',
  'Saudara Laki-laki Seayah',
  'Anak Laki-laki dari Saudara Laki-laki Sekandung',
  'Paman Sekandung (Saudara Ayah)',
  'Paman Seayah',
  'Wali Hakim (Kepala KUA)',
];

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 transition-colors disabled:bg-slate-50 disabled:text-slate-500';

const LABEL_CLASS = 'block text-xs font-medium text-slate-700 mb-1.5';

export function BerkasFormView({
  ownerId,
  initialData,
  recordId,
  onSave,
  onArchive,
  onOpenPreview,
  onBack,
}: Props) {
  const [form, setForm] = useState<BerkasNikahData>(initialData);
  const [currentId, setCurrentId] = useState<string | null>(recordId);
  const [activeStep, setActiveStep] = useState<StepKey>('desa');
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedText, setLastSavedText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const isArchived = form.status === 'diarsipkan';
  const hasMounted = useRef(false);
  const isDirtyRef = useRef(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync if user switches record externally
  useEffect(() => {
    setForm(initialData);
    setCurrentId(recordId);
    hasMounted.current = false;
    isDirtyRef.current = false;
  }, [initialData, recordId]);

  const markDirty = () => {
    isDirtyRef.current = true;
  };

  // Automatic debounced save to Firestore whenever user edits data
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (!isDirtyRef.current || isArchived) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      // Auto-save automatically once either record exists OR user filled at least one catin name
      const hasMinimalData =
        Boolean(currentId) ||
        form.catinPria.namaLengkap.trim().length >= 2 ||
        form.catinWanita.namaLengkap.trim().length >= 2;
      if (!hasMinimalData) return;

      setSavingState('saving');
      setErrorMsg(null);
      try {
        const savedId = await onSave(form, currentId);
        setCurrentId(savedId);
        isDirtyRef.current = false;
        setSavingState('saved');
        const now = new Date();
        setLastSavedText(
          `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        );
      } catch (err) {
        setSavingState('error');
        setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan otomatis.');
      }
    }, 1500);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [form, currentId, isArchived, onSave]);

  const handleManualSave = async (nextStatus?: 'draft' | 'lengkap') => {
    if (isArchived) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    const payload: BerkasNikahData = nextStatus ? { ...form, status: nextStatus } : form;
    if (nextStatus) setForm(payload);

    setSavingState('saving');
    setErrorMsg(null);
    try {
      const savedId = await onSave(payload, currentId);
      setCurrentId(savedId);
      isDirtyRef.current = false;
      setSavingState('saved');
      const now = new Date();
      setLastSavedText(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
      return savedId;
    } catch (err) {
      setSavingState('error');
      setErrorMsg('Gagal menyimpan berkas ke akun Anda. Periksa koneksi lalu coba kembali.');
      return currentId;
    }
  };

  const handleSaveAndPreview = async () => {
    const savedId = isArchived ? currentId : await handleManualSave();
    onOpenPreview(form, savedId ?? currentId);
  };

  const handleFillSample = () => {
    if (isArchived) return;
    const sample = createSampleBerkas(ownerId);
    sample.kodeBerkas = form.kodeBerkas || sample.kodeBerkas;
    markDirty();
    setForm(sample);
  };

  const updateDesa = <K extends keyof BerkasNikahData['desa']>(
    field: K,
    value: BerkasNikahData['desa'][K]
  ) => {
    markDirty();
    setForm((prev) => ({
      ...prev,
      desa: {
        ...prev.desa,
        [field]: value,
        ...(field === 'desa' && !prev.desa.tempatSurat ? { tempatSurat: String(value) } : {}),
      },
    }));
  };

  const updatePerson = <K extends keyof PersonBiodata>(
    target: 'catinPria' | 'catinWanita',
    field: K,
    value: PersonBiodata[K]
  ) => {
    markDirty();
    setForm((prev) => ({
      ...prev,
      [target]: { ...prev[target], [field]: value },
    }));
  };

  const updateParent = <K extends keyof ParentBiodata>(
    target: 'ayahPria' | 'ibuPria' | 'ayahWanita' | 'ibuWanita',
    field: K,
    value: ParentBiodata[K]
  ) => {
    markDirty();
    setForm((prev) => {
      const next: BerkasNikahData = {
        ...prev,
        [target]: { ...prev[target], [field]: value },
      };
      // Helpful auto-sync: fill catin Bin/Binti if empty when typing Ayah name
      if (target === 'ayahPria' && field === 'namaLengkap' && !prev.catinPria.binBinti) {
        next.catinPria = { ...prev.catinPria, binBinti: String(value) };
      }
      if (target === 'ayahWanita' && field === 'namaLengkap' && !prev.catinWanita.binBinti) {
        next.catinWanita = { ...prev.catinWanita, binBinti: String(value) };
      }
      return next;
    });
  };

  const copyAyahWanitaToWali = () => {
    markDirty();
    setForm((prev) => ({
      ...prev,
      waliNikah: {
        ...prev.waliNikah,
        jenisWali: 'Wali Nasab',
        hubunganWali: 'Ayah Kandung',
        sebabWali: 'Ayah Kandung Masih Hidup dan Memenuhi Syarat sebagai Wali Nikah',
        namaLengkap: prev.ayahWanita.namaLengkap,
        bin: prev.ayahWanita.binBinti,
        nik: prev.ayahWanita.nik,
        tempatLahir: prev.ayahWanita.tempatLahir,
        tanggalLahir: prev.ayahWanita.tanggalLahir,
        kewarganegaraan: prev.ayahWanita.kewarganegaraan || 'Indonesia',
        agama: prev.ayahWanita.agama || 'Islam',
        pekerjaan: prev.ayahWanita.pekerjaan,
        alamat: prev.ayahWanita.alamat,
      },
    }));
  };

  const copyAddressToParents = (side: 'pria' | 'wanita') => {
    markDirty();
    if (side === 'pria') {
      const addr = form.catinPria.alamat;
      setForm((prev) => ({
        ...prev,
        ayahPria: { ...prev.ayahPria, alamat: addr },
        ibuPria: { ...prev.ibuPria, alamat: addr },
      }));
    } else {
      const addr = form.catinWanita.alamat;
      setForm((prev) => ({
        ...prev,
        ayahWanita: { ...prev.ayahWanita, alamat: addr },
        ibuWanita: { ...prev.ibuWanita, alamat: addr },
      }));
    }
  };

  const copyAyahToSaksi = () => {
    markDirty();
    setForm((prev) => ({
      ...prev,
      sptjm: {
        ...prev.sptjm,
        saksi1Nama: prev.ayahWanita.namaLengkap,
        saksi1Nik: prev.ayahWanita.nik,
        saksi2Nama: prev.ayahPria.namaLengkap,
        saksi2Nik: prev.ayahPria.nik,
      },
    }));
  };

  const usiaPria = hitungUsia(form.catinPria.tanggalLahir);
  const usiaWanita = hitungUsia(form.catinWanita.tanggalLahir);
  const currentStepIdx = STEPS.findIndex((s) => s.key === activeStep);

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Kembali ke Dasbor"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono-tabular">
              <span>{form.kodeBerkas}</span>
              <span aria-hidden="true">·</span>
              <span>
                {savingState === 'saving'
                  ? 'Menyimpan ke akun...'
                  : savingState === 'saved'
                    ? `Tersimpan otomatis pukul ${lastSavedText}`
                    : isArchived
                      ? 'Diarsipkan (Hanya Baca)'
                      : currentId
                        ? 'Tersimpan di akun Anda'
                        : 'Berkas baru (otomatis tersimpan setelah diisi)'}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 truncate">
              {form.catinPria.namaLengkap || 'Calon Pengantin Pria'} &amp;{' '}
              {form.catinWanita.namaLengkap || 'Calon Pengantin Wanita'}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!isArchived && (
            <>
              <button
                type="button"
                onClick={handleFillSample}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Isi Contoh Data
              </button>

              <select
                value={form.status}
                onChange={(e) => {
                  const val = e.target.value as 'draft' | 'lengkap';
                  void handleManualSave(val);
                }}
                aria-label="Status Berkas"
                className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-700 cursor-pointer"
              >
                <option value="draft">Status: Draft</option>
                <option value="lengkap">Status: Lengkap</option>
              </select>

              <button
                type="button"
                onClick={() => void handleManualSave()}
                disabled={savingState === 'saving'}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
              >
                {savingState === 'saved' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Simpan
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => void handleSaveAndPreview()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Pratinjau &amp; Ekspor 8 Berkas A4
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      {/* Stepper Navigation */}
      <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex items-center gap-1 overflow-x-auto">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const active = activeStep === step.key;
          return (
            <button
              key={step.key}
              type="button"
              onClick={() => setActiveStep(step.key)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-emerald-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{step.short}</span>
            </button>
          );
        })}
      </div>

      {/* Main Step Content */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 lg:p-8 space-y-8">
        {/* STEP 1: DESA, KUA & SURAT */}
        {activeStep === 'desa' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                01. Informasi Kantor Desa/Kelurahan, KUA &amp; Penomoran Surat
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Data ini digunakan otomatis untuk Kop Surat, Formulir N1, N2, Surat Pernyataan Belum
                Menikah, dan Surat Keterangan Wali Nikah.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={LABEL_CLASS}>Jenis Wilayah Administrasi</label>
                <select
                  disabled={isArchived}
                  value={form.desa.jenisWilayah}
                  onChange={(e) => updateDesa('jenisWilayah', e.target.value as 'Desa' | 'Kelurahan')}
                  className={INPUT_CLASS}
                >
                  <option value="Desa">Desa</option>
                  <option value="Kelurahan">Kelurahan</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Nama {form.desa.jenisWilayah}</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.desa.desa}
                  onChange={(e) => updateDesa('desa', e.target.value)}
                  placeholder="Contoh: Mindahan"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Kecamatan</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.desa.kecamatan}
                  onChange={(e) => updateDesa('kecamatan', e.target.value)}
                  placeholder="Contoh: Batealit"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Kabupaten / Kota</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.desa.kabupaten}
                  onChange={(e) => updateDesa('kabupaten', e.target.value)}
                  placeholder="Contoh: Jepara"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Provinsi</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.desa.provinsi}
                  onChange={(e) => updateDesa('provinsi', e.target.value)}
                  placeholder="Contoh: Jawa Tengah"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>KUA Tujuan</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.desa.namaKua}
                  onChange={(e) => updateDesa('namaKua', e.target.value)}
                  placeholder="Contoh: KUA Kecamatan Batealit"
                  className={INPUT_CLASS}
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className={LABEL_CLASS}>Alamat Kantor {form.desa.jenisWilayah} (untuk Kop Surat)</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.desa.alamatKantorDesa}
                  onChange={(e) => updateDesa('alamatKantorDesa', e.target.value)}
                  placeholder="Jl. Raya Desa No. 1, Kecamatan, Kabupaten, Kode Pos"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 grid md:grid-cols-3 gap-4">
              <div>
                <label className={LABEL_CLASS}>Jabatan Penandatangan Desa</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.desa.jabatanPejabat}
                  onChange={(e) => updateDesa('jabatanPejabat', e.target.value)}
                  placeholder="Kepala Desa / Lurah / Pj. Kepala Desa"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Nama Lengkap Kepala Desa / Lurah</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.desa.namaKepalaDesa}
                  onChange={(e) => updateDesa('namaKepalaDesa', e.target.value)}
                  placeholder="Nama lengkap beserta gelar"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>NIP Pejabat (Opsional — khusus Lurah/PNS)</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.desa.nipPejabat}
                  onChange={(e) => updateDesa('nipPejabat', e.target.value)}
                  placeholder="Kosongkan jika Kepala Desa non-PNS"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={LABEL_CLASS}>Nomor Surat Pengantar Nikah (N1)</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.desa.nomorN1}
                  onChange={(e) => updateDesa('nomorN1', e.target.value)}
                  placeholder="474.2 / 001 / XI / 2026"
                  className={`${INPUT_CLASS} font-mono-tabular`}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Nomor Surat Keterangan Wali Nikah</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.desa.nomorWali}
                  onChange={(e) => updateDesa('nomorWali', e.target.value)}
                  placeholder="474.2 / 002 / XI / 2026"
                  className={`${INPUT_CLASS} font-mono-tabular`}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Tempat Surat</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.desa.tempatSurat}
                  onChange={(e) => updateDesa('tempatSurat', e.target.value)}
                  placeholder="Nama Desa / Kota"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Tanggal Surat</label>
                <input
                  disabled={isArchived}
                  type="date"
                  value={form.desa.tanggalSurat}
                  onChange={(e) => updateDesa('tanggalSurat', e.target.value)}
                  className={`${INPUT_CLASS} font-mono-tabular`}
                />
              </div>
              <div className="md:col-span-2">
                <label className={LABEL_CLASS}>Pihak Pemohon Berkas (untuk Paket Cetak N1, N5, Belum Menikah)</label>
                <select
                  disabled={isArchived}
                  value={form.desa.pihakPengaju}
                  onChange={(e) =>
                    updateDesa('pihakPengaju', e.target.value as 'pria' | 'wanita' | 'keduanya')
                  }
                  className={INPUT_CLASS}
                >
                  <option value="wanita">Catin Wanita (Umumnya lokasi akad &amp; wali di pihak wanita)</option>
                  <option value="pria">Catin Pria (N1 / N5 / Belum Menikah atas nama Pria)</option>
                  <option value="keduanya">Keduanya (Cetak N1, N5 &amp; Belum Menikah untuk Pria &amp; Wanita)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={LABEL_CLASS}>Kode Berkas Internal</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.kodeBerkas}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({ ...prev, kodeBerkas: e.target.value }));
                  }}
                  className={`${INPUT_CLASS} font-mono-tabular`}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CALON PENGANTIN */}
        {activeStep === 'catin' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                02. Biodata Calon Pengantin Pria &amp; Wanita
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Masukkan data sesuai KTP-el dan Kartu Keluarga. Usia dihitung otomatis untuk
                mendeteksi kebutuhan Surat Izin Orang Tua (Form N5 bagi usia di bawah 21 tahun).
              </p>
            </div>

            <div className="grid xl:grid-cols-2 gap-8">
              {/* Catin Pria */}
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Calon Pengantin Pria (Suami)</h4>
                  {usiaPria !== null && (
                    <span className="text-xs font-mono-tabular text-slate-600">
                      Usia: {usiaPria} tahun
                      {usiaPria < 21 ? ' · Perlu Form N5' : ''}
                    </span>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>Nama Lengkap (Sesuai KTP)</label>
                    <input
                      disabled={isArchived}
                      type="text"
                      value={form.catinPria.namaLengkap}
                      onChange={(e) => updatePerson('catinPria', 'namaLengkap', e.target.value)}
                      placeholder="Nama lengkap tanpa disingkat"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Bin (Nama Ayah Kandung)</label>
                    <input
                      disabled={isArchived}
                      type="text"
                      value={form.catinPria.binBinti}
                      onChange={(e) => updatePerson('catinPria', 'binBinti', e.target.value)}
                      placeholder="Nama ayah kandung"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>NIK (16 Digit)</label>
                    <input
                      disabled={isArchived}
                      type="text"
                      maxLength={20}
                      value={form.catinPria.nik}
                      onChange={(e) => updatePerson('catinPria', 'nik', e.target.value)}
                      placeholder="3320..."
                      className={`${INPUT_CLASS} font-mono-tabular`}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Tempat Lahir</label>
                    <input
                      disabled={isArchived}
                      type="text"
                      value={form.catinPria.tempatLahir}
                      onChange={(e) => updatePerson('catinPria', 'tempatLahir', e.target.value)}
                      placeholder="Kota/Kabupaten lahir"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Tanggal Lahir</label>
                    <input
                      disabled={isArchived}
                      type="date"
                      value={form.catinPria.tanggalLahir}
                      onChange={(e) => updatePerson('catinPria', 'tanggalLahir', e.target.value)}
                      className={`${INPUT_CLASS} font-mono-tabular`}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Kewarganegaraan</label>
                    <input
                      disabled={isArchived}
                      type="text"
                      value={form.catinPria.kewarganegaraan}
                      onChange={(e) => updatePerson('catinPria', 'kewarganegaraan', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Agama</label>
                    <input
                      disabled={isArchived}
                      type="text"
                      value={form.catinPria.agama}
                      onChange={(e) => updatePerson('catinPria', 'agama', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Pekerjaan</label>
                    <input
                      disabled={isArchived}
                      type="text"
                      value={form.catinPria.pekerjaan}
                      onChange={(e) => updatePerson('catinPria', 'pekerjaan', e.target.value)}
                      placeholder="Contoh: Karyawan Swasta / Wiraswasta"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Status Perkawinan</label>
                    <select
                      disabled={isArchived}
                      value={form.catinPria.statusPerkawinan}
                      onChange={(e) => updatePerson('catinPria', 'statusPerkawinan', e.target.value)}
                      className={INPUT_CLASS}
                    >
                      <option value="Jejaka">Jejaka (Belum Pernah Menikah)</option>
                      <option value="Duda Cerai Hidup">Duda Cerai Hidup</option>
                      <option value="Duda Cerai Mati">Duda Cerai Mati</option>
                      <option value="Beristri">Beristri</option>
                    </select>
                  </div>
                  {form.catinPria.statusPerkawinan !== 'Jejaka' && (
                    <>
                      <div>
                        <label className={LABEL_CLASS}>Nama Istri Terdahulu</label>
                        <input
                          disabled={isArchived}
                          type="text"
                          value={form.catinPria.namaPasanganSebelumnya}
                          onChange={(e) =>
                            updatePerson('catinPria', 'namaPasanganSebelumnya', e.target.value)
                          }
                          className={INPUT_CLASS}
                        />
                      </div>
                      {form.catinPria.statusPerkawinan === 'Beristri' && (
                        <div>
                          <label className={LABEL_CLASS}>Beristri Ke-</label>
                          <input
                            disabled={isArchived}
                            type="text"
                            value={form.catinPria.istriKe}
                            onChange={(e) => updatePerson('catinPria', 'istriKe', e.target.value)}
                            placeholder="Contoh: 2"
                            className={INPUT_CLASS}
                          />
                        </div>
                      )}
                    </>
                  )}
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>Alamat Lengkap (Sesuai KTP)</label>
                    <textarea
                      disabled={isArchived}
                      rows={2}
                      value={form.catinPria.alamat}
                      onChange={(e) => updatePerson('catinPria', 'alamat', e.target.value)}
                      placeholder="Desa/Kelurahan, RT/RW, Kecamatan, Kabupaten"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              </div>

              {/* Catin Wanita */}
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Calon Pengantin Wanita (Istri)</h4>
                  {usiaWanita !== null && (
                    <span className="text-xs font-mono-tabular text-slate-600">
                      Usia: {usiaWanita} tahun
                      {usiaWanita < 21 ? ' · Perlu Form N5' : ''}
                    </span>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>Nama Lengkap (Sesuai KTP)</label>
                    <input
                      disabled={isArchived}
                      type="text"
                      value={form.catinWanita.namaLengkap}
                      onChange={(e) => updatePerson('catinWanita', 'namaLengkap', e.target.value)}
                      placeholder="Nama lengkap tanpa disingkat"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Binti (Nama Ayah Kandung)</label>
                    <input
                      disabled={isArchived}
                      type="text"
                      value={form.catinWanita.binBinti}
                      onChange={(e) => updatePerson('catinWanita', 'binBinti', e.target.value)}
                      placeholder="Nama ayah kandung"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>NIK (16 Digit)</label>
                    <input
                      disabled={isArchived}
                      type="text"
                      maxLength={20}
                      value={form.catinWanita.nik}
                      onChange={(e) => updatePerson('catinWanita', 'nik', e.target.value)}
                      placeholder="3320..."
                      className={`${INPUT_CLASS} font-mono-tabular`}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Tempat Lahir</label>
                    <input
                      disabled={isArchived}
                      type="text"
                      value={form.catinWanita.tempatLahir}
                      onChange={(e) => updatePerson('catinWanita', 'tempatLahir', e.target.value)}
                      placeholder="Kota/Kabupaten lahir"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Tanggal Lahir</label>
                    <input
                      disabled={isArchived}
                      type="date"
                      value={form.catinWanita.tanggalLahir}
                      onChange={(e) => updatePerson('catinWanita', 'tanggalLahir', e.target.value)}
                      className={`${INPUT_CLASS} font-mono-tabular`}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Kewarganegaraan</label>
                    <input
                      disabled={isArchived}
                      type="text"
                      value={form.catinWanita.kewarganegaraan}
                      onChange={(e) => updatePerson('catinWanita', 'kewarganegaraan', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Agama</label>
                    <input
                      disabled={isArchived}
                      type="text"
                      value={form.catinWanita.agama}
                      onChange={(e) => updatePerson('catinWanita', 'agama', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Pekerjaan</label>
                    <input
                      disabled={isArchived}
                      type="text"
                      value={form.catinWanita.pekerjaan}
                      onChange={(e) => updatePerson('catinWanita', 'pekerjaan', e.target.value)}
                      placeholder="Contoh: Mahasiswi / Karyawan Swasta"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Status Perkawinan</label>
                    <select
                      disabled={isArchived}
                      value={form.catinWanita.statusPerkawinan}
                      onChange={(e) => updatePerson('catinWanita', 'statusPerkawinan', e.target.value)}
                      className={INPUT_CLASS}
                    >
                      <option value="Perawan">Perawan (Belum Pernah Menikah)</option>
                      <option value="Janda Cerai Hidup">Janda Cerai Hidup</option>
                      <option value="Janda Cerai Mati">Janda Cerai Mati</option>
                    </select>
                  </div>
                  {form.catinWanita.statusPerkawinan !== 'Perawan' && (
                    <div className="sm:col-span-2">
                      <label className={LABEL_CLASS}>Nama Suami Terdahulu</label>
                      <input
                        disabled={isArchived}
                        type="text"
                        value={form.catinWanita.namaPasanganSebelumnya}
                        onChange={(e) =>
                          updatePerson('catinWanita', 'namaPasanganSebelumnya', e.target.value)
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>Alamat Lengkap (Sesuai KTP)</label>
                    <textarea
                      disabled={isArchived}
                      rows={2}
                      value={form.catinWanita.alamat}
                      onChange={(e) => updatePerson('catinWanita', 'alamat', e.target.value)}
                      placeholder="Desa/Kelurahan, RT/RW, Kecamatan, Kabupaten"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ORANG TUA CATIN */}
        {activeStep === 'ortu' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                03. Data Orang Tua Calon Pengantin Pria &amp; Wanita
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Digunakan otomatis untuk Formulir N1 (Pengantar Nikah) dan Formulir N5 (Surat Izin
                Orang Tua).
              </p>
            </div>

            {/* Orang Tua Pria */}
            <div className="space-y-5">
              <div className="pb-2 border-b border-slate-200 flex items-center justify-between gap-4">
                <h4 className="text-sm font-bold text-slate-900">
                  A. Orang Tua Calon Pengantin Pria ({form.catinPria.namaLengkap || 'Pria'})
                </h4>
                {!isArchived && (
                  <button
                    type="button"
                    onClick={() => copyAddressToParents('pria')}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 hover:text-emerald-950 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Salin Alamat Catin Pria
                  </button>
                )}
              </div>

              <div className="grid xl:grid-cols-2 gap-8">
                <ParentFieldsGroup
                  title="Ayah Catin Pria"
                  binLabel="Bin"
                  data={form.ayahPria}
                  disabled={isArchived}
                  deceasedLabel="Almarhum"
                  onChange={(f, v) => updateParent('ayahPria', f, v)}
                />
                <ParentFieldsGroup
                  title="Ibu Catin Pria"
                  binLabel="Binti"
                  data={form.ibuPria}
                  disabled={isArchived}
                  deceasedLabel="Almarhumah"
                  onChange={(f, v) => updateParent('ibuPria', f, v)}
                />
              </div>
            </div>

            {/* Orang Tua Wanita */}
            <div className="pt-6 border-t border-slate-200 space-y-5">
              <div className="pb-2 border-b border-slate-200 flex items-center justify-between gap-4">
                <h4 className="text-sm font-bold text-slate-900">
                  B. Orang Tua Calon Pengantin Wanita ({form.catinWanita.namaLengkap || 'Wanita'})
                </h4>
                {!isArchived && (
                  <button
                    type="button"
                    onClick={() => copyAddressToParents('wanita')}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 hover:text-emerald-950 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Salin Alamat Catin Wanita
                  </button>
                )}
              </div>

              <div className="grid xl:grid-cols-2 gap-8">
                <ParentFieldsGroup
                  title="Ayah Catin Wanita"
                  binLabel="Bin"
                  data={form.ayahWanita}
                  disabled={isArchived}
                  deceasedLabel="Almarhum"
                  onChange={(f, v) => updateParent('ayahWanita', f, v)}
                />
                <ParentFieldsGroup
                  title="Ibu Catin Wanita"
                  binLabel="Binti"
                  data={form.ibuWanita}
                  disabled={isArchived}
                  deceasedLabel="Almarhumah"
                  onChange={(f, v) => updateParent('ibuWanita', f, v)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: WALI NIKAH */}
        {activeStep === 'wali' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  04. Data Wali Nikah (Calon Pengantin Wanita)
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Digunakan untuk Surat Keterangan Wali Nikah dari Desa/Kelurahan.
                </p>
              </div>
              {!isArchived && (
                <button
                  type="button"
                  onClick={copyAyahWanitaToWali}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Salin dari Data Ayah Catin Wanita
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={LABEL_CLASS}>Jenis Wali Nikah</label>
                <select
                  disabled={isArchived}
                  value={form.waliNikah.jenisWali}
                  onChange={(e) => {
                    markDirty();
                    const jenis = e.target.value as 'Wali Nasab' | 'Wali Hakim';
                    setForm((prev) => ({
                      ...prev,
                      waliNikah: {
                        ...prev.waliNikah,
                        jenisWali: jenis,
                        hubunganWali:
                          jenis === 'Wali Hakim' ? 'Wali Hakim (Kepala KUA)' : prev.waliNikah.hubunganWali,
                      },
                    }));
                  }}
                  className={INPUT_CLASS}
                >
                  <option value="Wali Nasab">Wali Nasab</option>
                  <option value="Wali Hakim">Wali Hakim</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Hubungan Wali dengan Catin Wanita</label>
                <select
                  disabled={isArchived}
                  value={form.waliNikah.hubunganWali}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      waliNikah: { ...prev.waliNikah, hubunganWali: e.target.value },
                    }));
                  }}
                  className={INPUT_CLASS}
                >
                  {HUBUNGAN_WALI_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Nomor Telepon / HP Wali</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.waliNikah.nomorTelepon}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      waliNikah: { ...prev.waliNikah, nomorTelepon: e.target.value },
                    }));
                  }}
                  placeholder="08xx-xxxx-xxxx"
                  className={`${INPUT_CLASS} font-mono-tabular`}
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className={LABEL_CLASS}>Dasar / Sebab Perwalian</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.waliNikah.sebabWali}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      waliNikah: { ...prev.waliNikah, sebabWali: e.target.value },
                    }));
                  }}
                  placeholder="Contoh: Ayah Kandung Masih Hidup / Ayah Kandung Meninggal Dunia sehingga hak wali beralih ke Saudara Laki-laki Sekandung"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Nama Lengkap Wali Nikah</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.waliNikah.namaLengkap}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      waliNikah: { ...prev.waliNikah, namaLengkap: e.target.value },
                    }));
                  }}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Bin (Ayah dari Wali)</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.waliNikah.bin}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      waliNikah: { ...prev.waliNikah, bin: e.target.value },
                    }));
                  }}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>NIK Wali Nikah</label>
                <input
                  disabled={isArchived}
                  type="text"
                  maxLength={20}
                  value={form.waliNikah.nik}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      waliNikah: { ...prev.waliNikah, nik: e.target.value },
                    }));
                  }}
                  className={`${INPUT_CLASS} font-mono-tabular`}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Tempat Lahir</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.waliNikah.tempatLahir}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      waliNikah: { ...prev.waliNikah, tempatLahir: e.target.value },
                    }));
                  }}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Tanggal Lahir</label>
                <input
                  disabled={isArchived}
                  type="date"
                  value={form.waliNikah.tanggalLahir}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      waliNikah: { ...prev.waliNikah, tanggalLahir: e.target.value },
                    }));
                  }}
                  className={`${INPUT_CLASS} font-mono-tabular`}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Pekerjaan</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.waliNikah.pekerjaan}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      waliNikah: { ...prev.waliNikah, pekerjaan: e.target.value },
                    }));
                  }}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Kewarganegaraan</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.waliNikah.kewarganegaraan}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      waliNikah: { ...prev.waliNikah, kewarganegaraan: e.target.value },
                    }));
                  }}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Agama</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.waliNikah.agama}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      waliNikah: { ...prev.waliNikah, agama: e.target.value },
                    }));
                  }}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className={LABEL_CLASS}>Alamat Lengkap Wali Nikah</label>
                <textarea
                  disabled={isArchived}
                  rows={2}
                  value={form.waliNikah.alamat}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      waliNikah: { ...prev.waliNikah, alamat: e.target.value },
                    }));
                  }}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: RENCANA AKAD */}
        {activeStep === 'akad' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                05. Rencana Pelaksanaan Akad Nikah
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Digunakan untuk Formulir N2 (Permohonan Kehendak Nikah) dan referensi berkas KUA.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className={LABEL_CLASS}>Tanggal Akad Nikah</label>
                <input
                  disabled={isArchived}
                  type="date"
                  value={form.rencanaNikah.tanggalNikah}
                  onChange={(e) => {
                    markDirty();
                    const dt = e.target.value;
                    const hari = getHariIndonesia(dt);
                    setForm((prev) => ({
                      ...prev,
                      rencanaNikah: {
                        ...prev.rencanaNikah,
                        tanggalNikah: dt,
                        hariNikah: hari || prev.rencanaNikah.hariNikah,
                      },
                    }));
                  }}
                  className={`${INPUT_CLASS} font-mono-tabular`}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Hari (Otomatis dari Tanggal)</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.rencanaNikah.hariNikah}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      rencanaNikah: { ...prev.rencanaNikah, hariNikah: e.target.value },
                    }));
                  }}
                  placeholder="Contoh: Minggu"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Waktu / Jam Akad</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.rencanaNikah.jamNikah}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      rencanaNikah: { ...prev.rencanaNikah, jamNikah: e.target.value },
                    }));
                  }}
                  placeholder="Contoh: 09.00 WIB"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="md:col-span-2">
                <label className={LABEL_CLASS}>Tempat Pelaksanaan Akad</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.rencanaNikah.tempatAkad}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      rencanaNikah: { ...prev.rencanaNikah, tempatAkad: e.target.value },
                    }));
                  }}
                  placeholder="Di KUA / Di Luar KUA (Kediaman Mempelai Wanita / Masjid)"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Pembayaran Maskawin</label>
                <select
                  disabled={isArchived}
                  value={form.rencanaNikah.pembayarMaskawin}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      rencanaNikah: {
                        ...prev.rencanaNikah,
                        pembayarMaskawin: e.target.value as 'Tunai' | 'Hutang',
                      },
                    }));
                  }}
                  className={INPUT_CLASS}
                >
                  <option value="Tunai">Tunai</option>
                  <option value="Hutang">Hutang</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Alamat Lengkap Lokasi Akad Nikah
                  </label>
                  {!isArchived && form.catinWanita.alamat && (
                    <button
                      type="button"
                      onClick={() => {
                        markDirty();
                        setForm((prev) => ({
                          ...prev,
                          rencanaNikah: {
                            ...prev.rencanaNikah,
                            alamatAkad: prev.catinWanita.alamat,
                          },
                        }));
                      }}
                      className="text-xs font-medium text-emerald-800 hover:text-emerald-950 cursor-pointer"
                    >
                      Salin Alamat Catin Wanita
                    </button>
                  )}
                </div>
                <textarea
                  disabled={isArchived}
                  rows={2}
                  value={form.rencanaNikah.alamatAkad}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      rencanaNikah: { ...prev.rencanaNikah, alamatAkad: e.target.value },
                    }));
                  }}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="md:col-span-3">
                <label className={LABEL_CLASS}>Maskawin (Mahar)</label>
                <input
                  disabled={isArchived}
                  type="text"
                  value={form.rencanaNikah.maskawin}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      rencanaNikah: { ...prev.rencanaNikah, maskawin: e.target.value },
                    }));
                  }}
                  placeholder="Contoh: Seperangkat Alat Sholat dan Perhiasan Emas 5 Gram"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: SPTJM & SURAT KUASA */}
        {activeStep === 'tambahan' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                06. Data SPTJM Pemeriksaan Berkas &amp; Surat Kuasa
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Lengkapi saksi SPTJM dan penerima kuasa pendaftaran berkas (misal: Modin / P3N /
                Perwakilan Keluarga).
              </p>
            </div>

            {/* SPTJM Section */}
            <div className="space-y-4">
              <div className="pb-2 border-b border-slate-200 flex items-center justify-between gap-4">
                <h4 className="text-sm font-bold text-slate-900">
                  A. Surat Pernyataan Pertanggungjawaban Mutlak (SPTJM)
                </h4>
                {!isArchived && (
                  <button
                    type="button"
                    onClick={copyAyahToSaksi}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 hover:text-emerald-950 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Isi Saksi dari Ayah Kedua Catin
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Pemohon / Penandatangan SPTJM</label>
                  <select
                    disabled={isArchived}
                    value={form.sptjm.pemohon}
                    onChange={(e) => {
                      markDirty();
                      setForm((prev) => ({
                        ...prev,
                        sptjm: {
                          ...prev.sptjm,
                          pemohon: e.target.value as 'Catin Pria' | 'Catin Wanita',
                        },
                      }));
                    }}
                    className={INPUT_CLASS}
                  >
                    <option value="Catin Wanita">Catin Wanita</option>
                    <option value="Catin Pria">Catin Pria</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Nama Saksi I</label>
                  <input
                    disabled={isArchived}
                    type="text"
                    value={form.sptjm.saksi1Nama}
                    onChange={(e) => {
                      markDirty();
                      setForm((prev) => ({
                        ...prev,
                        sptjm: { ...prev.sptjm, saksi1Nama: e.target.value },
                      }));
                    }}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>NIK Saksi I</label>
                  <input
                    disabled={isArchived}
                    type="text"
                    maxLength={20}
                    value={form.sptjm.saksi1Nik}
                    onChange={(e) => {
                      markDirty();
                      setForm((prev) => ({
                        ...prev,
                        sptjm: { ...prev.sptjm, saksi1Nik: e.target.value },
                      }));
                    }}
                    className={`${INPUT_CLASS} font-mono-tabular`}
                  />
                </div>
                <div className="hidden md:block" />
                <div>
                  <label className={LABEL_CLASS}>Nama Saksi II</label>
                  <input
                    disabled={isArchived}
                    type="text"
                    value={form.sptjm.saksi2Nama}
                    onChange={(e) => {
                      markDirty();
                      setForm((prev) => ({
                        ...prev,
                        sptjm: { ...prev.sptjm, saksi2Nama: e.target.value },
                      }));
                    }}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>NIK Saksi II</label>
                  <input
                    disabled={isArchived}
                    type="text"
                    maxLength={20}
                    value={form.sptjm.saksi2Nik}
                    onChange={(e) => {
                      markDirty();
                      setForm((prev) => ({
                        ...prev,
                        sptjm: { ...prev.sptjm, saksi2Nik: e.target.value },
                      }));
                    }}
                    className={`${INPUT_CLASS} font-mono-tabular`}
                  />
                </div>
              </div>
            </div>

            {/* Surat Kuasa Section */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="pb-2 border-b border-slate-200">
                <h4 className="text-sm font-bold text-slate-900">
                  B. Surat Kuasa kepada Orang yang Dikuasakan
                </h4>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Pemberi Kuasa</label>
                  <select
                    disabled={isArchived}
                    value={form.suratKuasa.pemberiKuasa}
                    onChange={(e) => {
                      markDirty();
                      setForm((prev) => ({
                        ...prev,
                        suratKuasa: {
                          ...prev.suratKuasa,
                          pemberiKuasa: e.target.value as 'Catin Pria' | 'Catin Wanita' | 'Keduanya',
                        },
                      }));
                    }}
                    className={INPUT_CLASS}
                  >
                    <option value="Catin Wanita">Calon Pengantin Wanita</option>
                    <option value="Catin Pria">Calon Pengantin Pria</option>
                    <option value="Keduanya">Kedua Calon Pengantin</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Nama Penerima Kuasa</label>
                  <input
                    disabled={isArchived}
                    type="text"
                    value={form.suratKuasa.penerimaNama}
                    onChange={(e) => {
                      markDirty();
                      setForm((prev) => ({
                        ...prev,
                        suratKuasa: { ...prev.suratKuasa, penerimaNama: e.target.value },
                      }));
                    }}
                    placeholder="Nama Modin / Keluarga / Perwakilan"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>NIK Penerima Kuasa</label>
                  <input
                    disabled={isArchived}
                    type="text"
                    maxLength={20}
                    value={form.suratKuasa.penerimaNik}
                    onChange={(e) => {
                      markDirty();
                      setForm((prev) => ({
                        ...prev,
                        suratKuasa: { ...prev.suratKuasa, penerimaNik: e.target.value },
                      }));
                    }}
                    className={`${INPUT_CLASS} font-mono-tabular`}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Tempat Lahir Penerima Kuasa</label>
                  <input
                    disabled={isArchived}
                    type="text"
                    value={form.suratKuasa.penerimaTempatLahir}
                    onChange={(e) => {
                      markDirty();
                      setForm((prev) => ({
                        ...prev,
                        suratKuasa: { ...prev.suratKuasa, penerimaTempatLahir: e.target.value },
                      }));
                    }}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Tanggal Lahir Penerima Kuasa</label>
                  <input
                    disabled={isArchived}
                    type="date"
                    value={form.suratKuasa.penerimaTanggalLahir}
                    onChange={(e) => {
                      markDirty();
                      setForm((prev) => ({
                        ...prev,
                        suratKuasa: { ...prev.suratKuasa, penerimaTanggalLahir: e.target.value },
                      }));
                    }}
                    className={`${INPUT_CLASS} font-mono-tabular`}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Pekerjaan Penerima Kuasa</label>
                  <input
                    disabled={isArchived}
                    type="text"
                    value={form.suratKuasa.penerimaPekerjaan}
                    onChange={(e) => {
                      markDirty();
                      setForm((prev) => ({
                        ...prev,
                        suratKuasa: { ...prev.suratKuasa, penerimaPekerjaan: e.target.value },
                      }));
                    }}
                    placeholder="Contoh: Modin / Perangkat Desa"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Hubungan dengan Pemberi Kuasa</label>
                  <input
                    disabled={isArchived}
                    type="text"
                    value={form.suratKuasa.penerimaHubungan}
                    onChange={(e) => {
                      markDirty();
                      setForm((prev) => ({
                        ...prev,
                        suratKuasa: { ...prev.suratKuasa, penerimaHubungan: e.target.value },
                      }));
                    }}
                    placeholder="Contoh: Modin / Paman / Kakak Kandung"
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL_CLASS}>Alamat Lengkap Penerima Kuasa</label>
                  <input
                    disabled={isArchived}
                    type="text"
                    value={form.suratKuasa.penerimaAlamat}
                    onChange={(e) => {
                      markDirty();
                      setForm((prev) => ({
                        ...prev,
                        suratKuasa: { ...prev.suratKuasa, penerimaAlamat: e.target.value },
                      }));
                    }}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className={LABEL_CLASS}>Uraian Keperluan Kuasa</label>
                  <textarea
                    disabled={isArchived}
                    rows={2}
                    value={form.suratKuasa.keperluanKuasa}
                    onChange={(e) => {
                      markDirty();
                      setForm((prev) => ({
                        ...prev,
                        suratKuasa: { ...prev.suratKuasa, keperluanKuasa: e.target.value },
                      }));
                    }}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>

            {/* Notes & Archive */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div>
                <label className={LABEL_CLASS}>Catatan Internal Berkas (Opsional — tidak dicetak di surat)</label>
                <textarea
                  disabled={isArchived}
                  rows={2}
                  value={form.catatan}
                  onChange={(e) => {
                    markDirty();
                    setForm((prev) => ({ ...prev, catatan: e.target.value }));
                  }}
                  placeholder="Contoh: Menunggu fotokopi akta kelahiran catin pria..."
                  className={INPUT_CLASS}
                />
              </div>

              {currentId && !isArchived && onArchive && (
                <div className="pt-2 flex items-center justify-between gap-4 text-xs text-slate-500">
                  <span>
                    Jika berkas sudah selesai diproses di KUA dan tidak perlu diubah lagi, Anda
                    dapat mengarsipkannya secara permanen.
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowArchiveConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Arsipkan Permanen
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step Navigation Footer */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={currentStepIdx === 0}
            onClick={() => setActiveStep(STEPS[currentStepIdx - 1].key)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Sebelumnya
          </button>

          <div className="text-xs text-slate-500 font-mono-tabular">
            Bagian {currentStepIdx + 1} dari {STEPS.length}
          </div>

          {currentStepIdx < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setActiveStep(STEPS[currentStepIdx + 1].key)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
            >
              Berikutnya
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSaveAndPreview()}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              Selesai &amp; Buka 8 Berkas A4
            </button>
          )}
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && currentId && onArchive && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Arsipkan Berkas Permanen?</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Berkas yang diarsipkan akan dikunci agar tidak berubah (hanya baca), namun tetap dapat
              dilihat dan diekspor ke Word / PDF A4 kapan saja.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onArchive(currentId);
                  setForm((prev) => ({ ...prev, status: 'diarsipkan' }));
                  setShowArchiveConfirm(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Ya, Arsipkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ParentFieldsGroup({
  title,
  binLabel,
  data,
  disabled,
  deceasedLabel,
  onChange,
}: {
  title: string;
  binLabel: string;
  data: ParentBiodata;
  disabled: boolean;
  deceasedLabel: 'Almarhum' | 'Almarhumah';
  onChange: <K extends keyof ParentBiodata>(field: K, value: ParentBiodata[K]) => void;
}) {
  return (
    <div className="space-y-3.5">
      <div className="text-xs font-semibold text-slate-700">{title}</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLASS}>Nama Lengkap</label>
          <input
            disabled={disabled}
            type="text"
            value={data.namaLengkap}
            onChange={(e) => onChange('namaLengkap', e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>{binLabel}</label>
          <input
            disabled={disabled}
            type="text"
            value={data.binBinti}
            onChange={(e) => onChange('binBinti', e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>NIK</label>
          <input
            disabled={disabled}
            type="text"
            maxLength={20}
            value={data.nik}
            onChange={(e) => onChange('nik', e.target.value)}
            className={`${INPUT_CLASS} font-mono-tabular`}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Status</label>
          <select
            disabled={disabled}
            value={data.statusHidup}
            onChange={(e) =>
              onChange('statusHidup', e.target.value as 'Hidup' | 'Almarhum' | 'Almarhumah')
            }
            className={INPUT_CLASS}
          >
            <option value="Hidup">Masih Hidup</option>
            <option value={deceasedLabel}>{deceasedLabel}</option>
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>Tempat Lahir</label>
          <input
            disabled={disabled}
            type="text"
            value={data.tempatLahir}
            onChange={(e) => onChange('tempatLahir', e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Tanggal Lahir</label>
          <input
            disabled={disabled}
            type="date"
            value={data.tanggalLahir}
            onChange={(e) => onChange('tanggalLahir', e.target.value)}
            className={`${INPUT_CLASS} font-mono-tabular`}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Agama</label>
          <input
            disabled={disabled}
            type="text"
            value={data.agama}
            onChange={(e) => onChange('agama', e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Pekerjaan</label>
          <input
            disabled={disabled}
            type="text"
            value={data.pekerjaan}
            onChange={(e) => onChange('pekerjaan', e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL_CLASS}>Alamat</label>
          <input
            disabled={disabled}
            type="text"
            value={data.alamat}
            onChange={(e) => onChange('alamat', e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      </div>
    </div>
  );
}
