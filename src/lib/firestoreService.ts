import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  type BerkasNikahData,
  type BerkasNikahRecord,
  type UserProfile,
  sanitizeBerkasData,
  sanitizeUserProfile,
} from '../types/berkas';

const BERKAS_COLLECTION = 'berkas_nikah';
const USERS_COLLECTION = 'users';

function generateSafeDocId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${ts}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export async function getOrCreateUserProfile(user: User): Promise<UserProfile> {
  const path = `${USERS_COLLECTION}/${user.uid}`;
  const ref = doc(db, USERS_COLLECTION, user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const sanitized = sanitizeUserProfile(
    {
      uid: user.uid,
      displayName: user.displayName || 'Petugas Pemberkasan',
      email: user.email || '',
      defaultDesa: '',
      defaultKecamatan: '',
      defaultKabupaten: '',
      defaultProvinsi: '',
      defaultKua: '',
      defaultKepalaDesa: '',
      defaultNipKepalaDesa: '',
      defaultJabatanDesa: 'Kepala Desa',
      defaultAlamatKantorDesa: '',
    },
    user.uid
  );

  try {
    await setDoc(ref, {
      ...sanitized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return sanitized;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateUserProfile(
  uid: string,
  profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const path = `${USERS_COLLECTION}/${uid}`;
  const ref = doc(db, USERS_COLLECTION, uid);
  const sanitized = sanitizeUserProfile(profile, uid);
  const { uid: _ignoredUid, ...mutableFields } = sanitized;

  try {
    await updateDoc(ref, {
      ...mutableFields,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeUserBerkas(
  uid: string,
  onData: (items: BerkasNikahRecord[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, BERKAS_COLLECTION),
    where('ownerId', '==', uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const records: BerkasNikahRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as BerkasNikahData),
        createdAt: d.data().createdAt,
        updatedAt: d.data().updatedAt,
      }));
      // Sort client-side by updatedAt descending (avoids composite index requirement)
      records.sort((a, b) => {
        const ta = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
        const tb = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      onData(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, BERKAS_COLLECTION);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        } else {
          throw wrapped;
        }
      }
    }
  );
}

export async function createBerkas(
  uid: string,
  data: BerkasNikahData
): Promise<string> {
  const id = generateSafeDocId('bk');
  const path = `${BERKAS_COLLECTION}/${id}`;
  const ref = doc(db, BERKAS_COLLECTION, id);
  const sanitized = sanitizeBerkasData(data, uid);
  if (sanitized.status === 'diarsipkan') {
    sanitized.status = 'lengkap';
  }

  try {
    await setDoc(ref, {
      ...sanitized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateBerkas(
  uid: string,
  berkasId: string,
  data: BerkasNikahData
): Promise<void> {
  const path = `${BERKAS_COLLECTION}/${berkasId}`;
  const ref = doc(db, BERKAS_COLLECTION, berkasId);
  const sanitized = sanitizeBerkasData(data, uid);
  const { ownerId: _immutableOwner, ...mutableFields } = sanitized;
  if (mutableFields.status === 'diarsipkan') {
    mutableFields.status = 'lengkap';
  }

  try {
    await updateDoc(ref, {
      ...mutableFields,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function archiveBerkas(berkasId: string): Promise<void> {
  const path = `${BERKAS_COLLECTION}/${berkasId}`;
  const ref = doc(db, BERKAS_COLLECTION, berkasId);
  try {
    await updateDoc(ref, {
      status: 'diarsipkan',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteBerkas(berkasId: string): Promise<void> {
  const path = `${BERKAS_COLLECTION}/${berkasId}`;
  const ref = doc(db, BERKAS_COLLECTION, berkasId);
  try {
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
