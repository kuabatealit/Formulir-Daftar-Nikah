import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import {
  FileCheck2,
  FolderPlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
} from 'lucide-react';
import { auth } from './lib/firebase';
import {
  archiveBerkas,
  createBerkas,
  deleteBerkas,
  getOrCreateUserProfile,
  subscribeUserBerkas,
  updateBerkas,
  updateUserProfile,
} from './lib/firestoreService';
import {
  type BerkasNikahData,
  type BerkasNikahRecord,
  type UserProfile,
  createEmptyBerkas,
  createSampleBerkas,
} from './types/berkas';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { BerkasFormView } from './components/BerkasFormView';
import { DocumentPreviewView } from './components/DocumentPreviewView';
import { SettingsView } from './components/SettingsView';

type ActiveRoute = 'dashboard' | 'editor' | 'preview' | 'settings';

function WorkspaceApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [records, setRecords] = useState<BerkasNikahRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const [route, setRoute] = useState<ActiveRoute>('dashboard');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftData, setDraftData] = useState<BerkasNikahData | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (!currentUser) {
        setProfile(null);
        setRecords([]);
        setRoute('dashboard');
      }
    });
    return () => unsub();
  }, []);

  // Load profile and subscribe to user's marriage dossiers only when authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    let unsubBerkas: (() => void) | undefined;
    setLoadingRecords(true);
    setFirestoreError(null);

    void getOrCreateUserProfile(user)
      .then((prof) => setProfile(prof))
      .catch((err) => {
        console.error(err);
      });

    unsubBerkas = subscribeUserBerkas(
      user.uid,
      (items) => {
        setRecords(items);
        setLoadingRecords(false);
      },
      (err) => {
        setLoadingRecords(false);
        setFirestoreError(err.message);
      }
    );

    return () => {
      if (unsubBerkas) unsubBerkas();
    };
  }, [authReady, user]);

  const handleCreateNew = useCallback(() => {
    if (!user) return;
    setEditingId(null);
    setDraftData(createEmptyBerkas(user.uid, profile));
    setRoute('editor');
    setMobileMenuOpen(false);
  }, [user, profile]);

  const handleCreateSample = useCallback(async () => {
    if (!user) return;
    const sample = createSampleBerkas(user.uid);
    const savedId = await createBerkas(user.uid, sample);
    setEditingId(savedId);
    setDraftData(sample);
    setRoute('preview');
  }, [user]);

  const handleEditRecord = useCallback((rec: BerkasNikahRecord) => {
    setEditingId(rec.id);
    setDraftData(rec);
    setRoute('editor');
    setMobileMenuOpen(false);
  }, []);

  const handlePreviewRecord = useCallback((rec: BerkasNikahRecord) => {
    setEditingId(rec.id);
    setDraftData(rec);
    setRoute('preview');
    setMobileMenuOpen(false);
  }, []);

  const handleSaveBerkas = useCallback(
    async (data: BerkasNikahData, existingId: string | null): Promise<string> => {
      if (!user) throw new Error('Pengguna belum masuk.');
      if (existingId) {
        await updateBerkas(user.uid, existingId, data);
        setDraftData(data);
        return existingId;
      } else {
        const newId = await createBerkas(user.uid, data);
        setEditingId(newId);
        setDraftData(data);
        return newId;
      }
    },
    [user]
  );

  const handleArchiveBerkas = useCallback(async (id: string) => {
    await archiveBerkas(id);
  }, []);

  const handleDeleteBerkas = useCallback(async (id: string) => {
    await deleteBerkas(id);
    if (editingId === id) {
      setEditingId(null);
      setDraftData(null);
      setRoute('dashboard');
    }
  }, [editingId]);

  const handleSaveProfile = useCallback(
    async (updated: Omit<UserProfile, 'createdAt' | 'updatedAt'>) => {
      if (!user) return;
      await updateUserProfile(user.uid, updated);
      setProfile((prev) => ({ ...(prev || updated), ...updated }));
    },
    [user]
  );

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-sm text-slate-500">Memuat sesi akun...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const breadcrumbTitle =
    route === 'dashboard'
      ? 'Dasbor Berkas Nikah'
      : route === 'editor'
        ? editingId
          ? 'Edit Data Berkas Nikah'
          : 'Input Berkas Nikah Baru'
        : route === 'preview'
          ? 'Pratinjau & Ekspor 8 Berkas A4'
          : 'Pengaturan Default Desa & KUA';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-white border-r border-slate-200 no-print">
        <div className="h-16 px-5 border-b border-slate-200 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-900 text-white flex items-center justify-center shrink-0">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <span className="text-base font-bold font-display tracking-tight text-slate-900 whitespace-nowrap">
            Form Daftar Nikah
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <button
            type="button"
            onClick={() => setRoute('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              route === 'dashboard'
                ? 'bg-emerald-50 text-emerald-950'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dasbor Berkas</span>
          </button>

          <button
            type="button"
            onClick={handleCreateNew}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              route === 'editor' && !editingId
                ? 'bg-emerald-50 text-emerald-950'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FolderPlus className="w-4 h-4 shrink-0" />
            <span>Input Berkas Baru</span>
          </button>

          <button
            type="button"
            onClick={() => setRoute('settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              route === 'settings'
                ? 'bg-emerald-50 text-emerald-950'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Default Desa &amp; KUA</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-900 truncate">
              {profile?.displayName || user.displayName || 'Petugas'}
            </div>
            <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar Akun
          </button>
          <div className="text-[11px] font-mono-tabular text-slate-400 text-center">
            form-daftar-nikah.vercel.app
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-slate-950/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white h-full flex flex-col border-r border-slate-200 z-10">
            <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-sm font-bold font-display text-slate-900">
                Form Daftar Nikah
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setRoute('dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-50"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dasbor Berkas
              </button>
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-50"
              >
                <FolderPlus className="w-4 h-4" />
                Input Berkas Baru
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoute('settings');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-50"
              >
                <Settings className="w-4 h-4" />
                Default Desa &amp; KUA
              </button>
            </nav>
            <div className="p-4 border-t border-slate-200 space-y-2">
              <div className="text-xs text-slate-600 truncate">{user.email}</div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar Akun
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar (3-zone contract: Breadcrumb — Primary Action) */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-4 shrink-0 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <button
                type="button"
                onClick={() => setRoute('dashboard')}
                className="text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap hidden sm:inline cursor-pointer"
              >
                Form Daftar Nikah
              </button>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-semibold text-slate-900 truncate">{breadcrumbTitle}</h1>
            </div>
          </div>

          <div className="shrink-0">
            {route !== 'editor' && (
              <button
                type="button"
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                Buat Berkas Baru
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1440px] w-full mx-auto">
          {firestoreError && (
            <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800 no-print">
              Gagal memuat data dari basis data. Pastikan akun Google Anda terverifikasi dan
              koneksi internet stabil.
            </div>
          )}

          {route === 'dashboard' && (
            <DashboardView
              records={records}
              loading={loadingRecords}
              onCreateNew={handleCreateNew}
              onCreateSample={() => void handleCreateSample()}
              onEdit={handleEditRecord}
              onPreview={handlePreviewRecord}
              onDelete={handleDeleteBerkas}
            />
          )}

          {route === 'editor' && draftData && (
            <BerkasFormView
              ownerId={user.uid}
              initialData={draftData}
              recordId={editingId}
              onSave={handleSaveBerkas}
              onArchive={handleArchiveBerkas}
              onOpenPreview={(data, savedId) => {
                setDraftData(data);
                setEditingId(savedId);
                setRoute('preview');
              }}
              onBack={() => setRoute('dashboard')}
            />
          )}

          {route === 'preview' && draftData && (
            <DocumentPreviewView
              data={draftData}
              onEdit={() => setRoute('editor')}
              onBack={() => setRoute('dashboard')}
            />
          )}

          {route === 'settings' && profile && (
            <SettingsView profile={profile} onSaveProfile={handleSaveProfile} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <WorkspaceApp />
    </ErrorBoundary>
  );
}
