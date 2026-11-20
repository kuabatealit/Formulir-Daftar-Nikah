import { useMemo, useState } from 'react';
import {
  Edit3,
  FileDown,
  FileText,
  FolderPlus,
  Printer,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  type BerkasNikahRecord,
  type StatusBerkas,
  formatTanggalIndonesia,
} from '../types/berkas';
import { buildAllDocumentSpecs } from '../lib/documentModel';
import { exportSpecsToDocx } from '../lib/exportDocx';
import { exportSpecsToPdf } from '../lib/exportPdf';

interface Props {
  records: BerkasNikahRecord[];
  loading: boolean;
  onCreateNew: () => void;
  onCreateSample: () => void;
  onEdit: (record: BerkasNikahRecord) => void;
  onPreview: (record: BerkasNikahRecord) => void;
  onDelete: (id: string) => Promise<void>;
}

const STATUS_LABELS: Record<StatusBerkas, { label: string; colorClass: string }> = {
  draft: { label: 'Draft', colorClass: 'text-amber-700' },
  lengkap: { label: 'Lengkap · Siap Cetak', colorClass: 'text-emerald-800' },
  diarsipkan: { label: 'Diarsipkan', colorClass: 'text-slate-500' },
};

export function DashboardView({
  records,
  loading,
  onCreateNew,
  onCreateSample,
  onEdit,
  onPreview,
  onDelete,
}: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StatusBerkas>('all');
  const [deleteTarget, setDeleteTarget] = useState<BerkasNikahRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = records.length;
    const lengkap = records.filter((r) => r.status === 'lengkap').length;
    const draft = records.filter((r) => r.status === 'draft').length;
    const arsip = records.filter((r) => r.status === 'diarsipkan').length;
    return { total, lengkap, draft, arsip };
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((rec) => {
      if (statusFilter !== 'all' && rec.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        rec.kodeBerkas,
        rec.catinPria.namaLengkap,
        rec.catinPria.nik,
        rec.catinWanita.namaLengkap,
        rec.catinWanita.nik,
        rec.desa.desa,
        rec.desa.kecamatan,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [records, search, statusFilter]);

  const handleQuickExport = async (record: BerkasNikahRecord, format: 'docx' | 'pdf') => {
    setExportingId(`${record.id}-${format}`);
    try {
      const specs = buildAllDocumentSpecs(record);
      const pairName = `${record.catinPria.namaLengkap || 'Pria'}_${record.catinWanita.namaLengkap || 'Wanita'}`
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .slice(0, 50);
      const baseName = `Paket_Berkas_Nikah_${record.kodeBerkas}_${pairName}`;
      if (format === 'docx') {
        await exportSpecsToDocx(specs, `${baseName}.docx`);
      } else {
        exportSpecsToPdf(specs, `${baseName}.pdf`);
      }
    } finally {
      setExportingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">Total Berkas Tersimpan</div>
          <div className="mt-2 text-2xl font-bold font-mono-tabular text-slate-900">
            {stats.total}
          </div>
          <div className="mt-1 text-xs text-slate-500">Tersimpan otomatis di akun Anda</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">Lengkap & Siap Cetak</div>
          <div className="mt-2 text-2xl font-bold font-mono-tabular text-emerald-800">
            {stats.lengkap}
          </div>
          <div className="mt-1 text-xs text-slate-500">8 dokumen resmi format A4</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">Draft Dalam Pengisian</div>
          <div className="mt-2 text-2xl font-bold font-mono-tabular text-amber-700">
            {stats.draft}
          </div>
          <div className="mt-1 text-xs text-slate-500">Dapat dilanjutkan kapan saja</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">Diarsipkan</div>
          <div className="mt-2 text-2xl font-bold font-mono-tabular text-slate-700">
            {stats.arsip}
          </div>
          <div className="mt-1 text-xs text-slate-500">Riwayat berkas terkunci</div>
        </div>
      </div>

      {/* Main Table Panel */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama catin, NIK, kode berkas, atau desa..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-700 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {(
              [
                ['all', 'Semua'],
                ['draft', 'Draft'],
                ['lengkap', 'Lengkap'],
                ['diarsipkan', 'Arsip'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setStatusFilter(val)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === val
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-56 bg-slate-100 rounded" />
                  <div className="h-3 w-80 bg-slate-100 rounded" />
                </div>
                <div className="h-8 w-44 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900">
                {records.length === 0
                  ? 'Belum Ada Berkas Pemberkasan Nikah'
                  : 'Tidak Ada Berkas yang Sesuai Filter'}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {records.length === 0
                  ? 'Mulai input data calon pengantin, orang tua, dan wali nikah sekali saja — 8 surat resmi (N1, N2, N4, N5, SPTJM, Surat Kuasa, Belum Menikah, dan Wali Nikah) langsung siap diunduh.'
                  : 'Ubah kata kunci pencarian atau pilih tab status lainnya untuk melihat berkas tersimpan.'}
              </p>
            </div>
            {records.length === 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCreateNew}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  Buat Berkas Baru
                </button>
                <button
                  type="button"
                  onClick={onCreateSample}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Coba dengan Contoh Data
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Kode & Pasangan Catin</th>
                  <th className="py-3 px-4">Desa / KUA Tujuan</th>
                  <th className="py-3 px-4">Rencana Akad</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi & Ekspor A4</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((rec) => {
                  const statusMeta = STATUS_LABELS[rec.status] || STATUS_LABELS.draft;
                  const pria = rec.catinPria.namaLengkap || '(Catin Pria belum diisi)';
                  const wanita = rec.catinWanita.namaLengkap || '(Catin Wanita belum diisi)';

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 align-middle">
                        <button
                          type="button"
                          onClick={() => onPreview(rec)}
                          className="text-left group cursor-pointer"
                        >
                          <div className="font-semibold text-slate-900 group-hover:text-emerald-800 transition-colors">
                            {pria} &amp; {wanita}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-mono-tabular">
                            <span>{rec.kodeBerkas}</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              Wali: {rec.waliNikah.namaLengkap || 'Belum diisi'}
                            </span>
                          </div>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 align-middle">
                        <div className="text-slate-800">
                          {rec.desa.desa
                            ? `${rec.desa.jenisWilayah} ${rec.desa.desa}`
                            : 'Wilayah belum diisi'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {rec.desa.namaKua || rec.desa.kecamatan || '-'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="text-slate-800 font-mono-tabular text-xs">
                          {rec.rencanaNikah.tanggalNikah
                            ? formatTanggalIndonesia(rec.rencanaNikah.tanggalNikah)
                            : 'Belum dijadwalkan'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {rec.rencanaNikah.jamNikah || '-'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <span className={`text-xs font-semibold ${statusMeta.colorClass}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-middle text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPreview(rec)}
                            title="Pratinjau & Cetak 8 Berkas A4"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Berkas A4
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickExport(rec, 'docx')}
                            disabled={exportingId === `${rec.id}-docx`}
                            title="Unduh semua 8 berkas dalam 1 file Word (.docx A4)"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            Word
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickExport(rec, 'pdf')}
                            disabled={exportingId === `${rec.id}-pdf`}
                            title="Unduh semua 8 berkas dalam 1 file PDF (A4)"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            PDF
                          </button>
                          {rec.status !== 'diarsipkan' && (
                            <button
                              type="button"
                              onClick={() => onEdit(rec)}
                              title="Edit Data Berkas"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(rec)}
                            title="Hapus Berkas"
                            aria-label={`Hapus berkas ${rec.kodeBerkas}`}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Hapus Berkas Nikah?</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Berkas{' '}
              <span className="font-semibold text-slate-900">
                {deleteTarget.catinPria.namaLengkap || 'Catin Pria'} &amp;{' '}
                {deleteTarget.catinWanita.namaLengkap || 'Catin Wanita'}
              </span>{' '}
              ({deleteTarget.kodeBerkas}) akan dihapus permanen dari akun Anda. Tindakan ini tidak
              dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
              >
                {deleting ? 'Menghapus...' : 'Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
