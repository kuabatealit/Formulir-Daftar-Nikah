import { useState } from 'react';
import { Check, Save } from 'lucide-react';
import type { UserProfile } from '../types/berkas';

interface Props {
  profile: UserProfile;
  onSaveProfile: (updated: Omit<UserProfile, 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 transition-colors';

const LABEL_CLASS = 'block text-xs font-medium text-slate-700 mb-1.5';

export function SettingsView({ profile, onSaveProfile }: Props) {
  const [form, setForm] = useState({
    uid: profile.uid,
    displayName: profile.displayName || '',
    email: profile.email || '',
    defaultProvinsi: profile.defaultProvinsi || '',
    defaultKabupaten: profile.defaultKabupaten || '',
    defaultKecamatan: profile.defaultKecamatan || '',
    defaultDesa: profile.defaultDesa || '',
    defaultKua: profile.defaultKua || '',
    defaultJabatanDesa: profile.defaultJabatanDesa || 'Kepala Desa',
    defaultKepalaDesa: profile.defaultKepalaDesa || '',
    defaultNipKepalaDesa: profile.defaultNipKepalaDesa || '',
    defaultAlamatKantorDesa: profile.defaultAlamatKantorDesa || '',
  });
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedOk(false);
    setErrorMsg(null);
    try {
      await onSaveProfile(form);
      setSavedOk(true);
    } catch {
      setErrorMsg('Gagal menyimpan pengaturan akun. Silakan coba kembali.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl bg-white border border-slate-200 rounded-lg p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Pengaturan Default Kantor Desa &amp; KUA
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Data wilayah dan penandatangan yang disimpan di sini akan otomatis terisi setiap kali Anda
          membuat berkas pemberkasan nikah baru.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 pt-2">
        <div>
          <label className={LABEL_CLASS}>Nama Akun / Petugas</label>
          <input
            type="text"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Email Akun Google</label>
          <input
            type="email"
            disabled
            value={form.email}
            className={`${INPUT_CLASS} bg-slate-50 text-slate-500`}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 grid md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Provinsi Default</label>
          <input
            type="text"
            value={form.defaultProvinsi}
            onChange={(e) => setForm({ ...form, defaultProvinsi: e.target.value })}
            placeholder="Contoh: Jawa Tengah"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Kabupaten / Kota Default</label>
          <input
            type="text"
            value={form.defaultKabupaten}
            onChange={(e) => setForm({ ...form, defaultKabupaten: e.target.value })}
            placeholder="Contoh: Jepara"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Kecamatan Default</label>
          <input
            type="text"
            value={form.defaultKecamatan}
            onChange={(e) => setForm({ ...form, defaultKecamatan: e.target.value })}
            placeholder="Contoh: Batealit"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Desa / Kelurahan Default</label>
          <input
            type="text"
            value={form.defaultDesa}
            onChange={(e) => setForm({ ...form, defaultDesa: e.target.value })}
            placeholder="Contoh: Mindahan"
            className={INPUT_CLASS}
          />
        </div>
        <div className="md:col-span-2">
          <label className={LABEL_CLASS}>KUA Kecamatan Tujuan Default</label>
          <input
            type="text"
            value={form.defaultKua}
            onChange={(e) => setForm({ ...form, defaultKua: e.target.value })}
            placeholder="Contoh: KUA Kecamatan Batealit"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Jabatan Penandatangan Default</label>
          <input
            type="text"
            value={form.defaultJabatanDesa}
            onChange={(e) => setForm({ ...form, defaultJabatanDesa: e.target.value })}
            placeholder="Kepala Desa / Lurah"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Nama Kepala Desa / Lurah Default</label>
          <input
            type="text"
            value={form.defaultKepalaDesa}
            onChange={(e) => setForm({ ...form, defaultKepalaDesa: e.target.value })}
            placeholder="Nama lengkap beserta gelar"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>NIP Pejabat Default (Opsional)</label>
          <input
            type="text"
            value={form.defaultNipKepalaDesa}
            onChange={(e) => setForm({ ...form, defaultNipKepalaDesa: e.target.value })}
            className={`${INPUT_CLASS} font-mono-tabular`}
          />
        </div>
        <div className="md:col-span-2">
          <label className={LABEL_CLASS}>Alamat Kantor Desa / Kelurahan Default</label>
          <input
            type="text"
            value={form.defaultAlamatKantorDesa}
            onChange={(e) => setForm({ ...form, defaultAlamatKantorDesa: e.target.value })}
            placeholder="Jl. Raya Desa ..., Kecamatan ..., Kabupaten ..."
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
        <div className="text-xs text-emerald-800 font-medium">
          {savedOk ? 'Pengaturan default berhasil disimpan ke akun Anda.' : ''}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
        >
          {savedOk ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </form>
  );
}
