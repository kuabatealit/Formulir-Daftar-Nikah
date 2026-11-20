import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Edit3,
  FileDown,
  FileText,
  Layers,
  Printer,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  type BerkasNikahData,
  type DocumentTypeId,
  DOCUMENT_CATALOG,
} from '../types/berkas';
import {
  type PartyTarget,
  buildAllDocumentSpecs,
  buildDocumentSpec,
} from '../lib/documentModel';
import { exportSpecsToDocx } from '../lib/exportDocx';
import { exportSpecsToPdf } from '../lib/exportPdf';
import { DocumentSheetA4 } from './DocumentSheetA4';

interface Props {
  data: BerkasNikahData;
  onEdit: () => void;
  onBack: () => void;
}

export function DocumentPreviewView({ data, onEdit, onBack }: Props) {
  const [selectedDoc, setSelectedDoc] = useState<DocumentTypeId>('n1');
  const [party, setParty] = useState<PartyTarget>(
    data.desa.pihakPengaju === 'pria' ? 'pria' : 'wanita'
  );
  const [zoom, setZoom] = useState<number>(0.85);
  const [exportBusy, setExportBusy] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState<'single' | 'all'>('single');

  const activeCatalog = useMemo(
    () => DOCUMENT_CATALOG.find((d) => d.id === selectedDoc) || DOCUMENT_CATALOG[0],
    [selectedDoc]
  );

  const activeSpec = useMemo(
    () => buildDocumentSpec(data, selectedDoc, party),
    [data, selectedDoc, party]
  );

  const allSpecs = useMemo(() => buildAllDocumentSpecs(data, party), [data, party]);

  const safeCoupleSlug = useMemo(() => {
    const raw = `${data.catinPria.namaLengkap || 'Pria'}_${data.catinWanita.namaLengkap || 'Wanita'}`;
    return raw.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 48);
  }, [data.catinPria.namaLengkap, data.catinWanita.namaLengkap]);

  const handleExportSingleDocx = async () => {
    setExportBusy('single-docx');
    try {
      await exportSpecsToDocx([activeSpec], `${activeSpec.fileSlug}_${safeCoupleSlug}.docx`);
    } finally {
      setExportBusy(null);
    }
  };

  const handleExportSinglePdf = () => {
    setExportBusy('single-pdf');
    try {
      exportSpecsToPdf([activeSpec], `${activeSpec.fileSlug}_${safeCoupleSlug}.pdf`);
    } finally {
      setExportBusy(null);
    }
  };

  const handleExportAllDocx = async () => {
    setExportBusy('all-docx');
    try {
      await exportSpecsToDocx(
        allSpecs,
        `Paket_Lengkap_Berkas_Nikah_${data.kodeBerkas}_${safeCoupleSlug}.docx`
      );
    } finally {
      setExportBusy(null);
    }
  };

  const handleExportAllPdf = () => {
    setExportBusy('all-pdf');
    try {
      exportSpecsToPdf(
        allSpecs,
        `Paket_Lengkap_Berkas_Nikah_${data.kodeBerkas}_${safeCoupleSlug}.pdf`
      );
    } finally {
      setExportBusy(null);
    }
  };

  const handlePrint = (mode: 'single' | 'all') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 80);
  };

  return (
    <>
      <div className="space-y-5 no-print">
        {/* Top Export Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
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
              <div className="text-xs text-slate-500 font-mono-tabular">
                {data.kodeBerkas} · Paket {allSpecs.length} Dokumen A4 (210 × 297 mm)
              </div>
              <h2 className="text-base font-bold text-slate-900 truncate">
                {data.catinPria.namaLengkap || 'Calon Suami'} &amp;{' '}
                {data.catinWanita.namaLengkap || 'Calon Istri'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {data.status !== 'diarsipkan' && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Data
              </button>
            )}

            <button
              type="button"
              onClick={() => void handleExportAllDocx()}
              disabled={exportBusy === 'all-docx'}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              <Layers className="w-3.5 h-3.5" />
              {exportBusy === 'all-docx' ? 'Menyusun Word...' : 'Unduh Semua Berkas (Word A4)'}
            </button>

            <button
              type="button"
              onClick={handleExportAllPdf}
              disabled={exportBusy === 'all-pdf'}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              <FileDown className="w-3.5 h-3.5" />
              {exportBusy === 'all-pdf' ? 'Menyusun PDF...' : 'Unduh Semua Berkas (PDF A4)'}
            </button>

            <button
              type="button"
              onClick={() => handlePrint('all')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Semua
            </button>
          </div>
        </div>

        {/* Main 2-Column Document Studio */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left: 8 Documents Selector */}
          <aside className="lg:col-span-4 xl:col-span-3 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70">
              <div className="text-xs font-semibold text-slate-800">
                Daftar 8 Berkas Pemberkasan
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Pilih surat untuk pratinjau atau unduh satuan
              </div>
            </div>

            <nav className="divide-y divide-slate-100">
              {DOCUMENT_CATALOG.map((item, idx) => {
                const isActive = selectedDoc === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedDoc(item.id)}
                    className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50/90 text-emerald-950'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold">
                        {String(idx + 1).padStart(2, '0')}. {item.shortTitle}
                      </span>
                      <span className="text-[11px] font-mono-tabular text-slate-500 shrink-0">
                        {item.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {item.regulation}
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Right: Active A4 Preview & Per-Document Actions */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FileText className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>{activeSpec.displayTitle}</span>
                </div>

                {activeCatalog.supportsPartySwitch && (
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md">
                    <button
                      type="button"
                      onClick={() => setParty('wanita')}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                        party === 'wanita'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Catin Wanita
                    </button>
                    <button
                      type="button"
                      onClick={() => setParty('pria')}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                        party === 'pria'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Catin Pria
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center border border-slate-200 rounded-md bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.55, +(z - 0.1).toFixed(2)))}
                    aria-label="Perkecil pratinjau"
                    className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-xs font-mono-tabular text-slate-700">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(1.15, +(z + 0.1).toFixed(2)))}
                    aria-label="Perbesar pratinjau"
                    className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => void handleExportSingleDocx()}
                  disabled={exportBusy === 'single-docx'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Word (.docx)
                </button>
                <button
                  type="button"
                  onClick={handleExportSinglePdf}
                  disabled={exportBusy === 'single-pdf'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  PDF (A4)
                </button>
                <button
                  type="button"
                  onClick={() => handlePrint('single')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak
                </button>
              </div>
            </div>

            {/* A4 Viewport Canvas */}
            <div className="bg-slate-200/70 border border-slate-200 rounded-lg p-6 overflow-x-auto flex justify-center">
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  marginBottom: `${Math.round((zoom - 1) * 1122)}px`,
                }}
              >
                <DocumentSheetA4 spec={activeSpec} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Hidden-On-Screen Print Container for Clean A4 Paper Printing */}
      <div className="hidden print-only-container">
        {printMode === 'single' ? (
          <DocumentSheetA4 spec={activeSpec} />
        ) : (
          allSpecs.map((spec, idx) => <DocumentSheetA4 key={`${spec.id}-${idx}`} spec={spec} />)
        )}
      </div>
    </>
  );
}
