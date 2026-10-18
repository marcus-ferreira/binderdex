import { auth, db, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Binder } from '../types/binder';

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    if (err?.code === 'auth/cancelled-popup-request') {
      return null;
    }
    console.error('Login error:', err);
    throw err;
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Logout error:', err);
  }
}

export async function loadBindersFromFirestore(userId: string): Promise<Binder[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'binders'));
    const binders: Binder[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Binder;
      if (data) {
        binders.push(data);
      }
    });
    return binders;
  } catch (err) {
    console.error('Error loading binders from Firestore:', err);
    return [];
  }
}

export async function saveBinderToFirestore(userId: string, binder: Binder) {
  try {
    await setDoc(doc(db, 'users', userId, 'binders', binder.id), binder);
  } catch (err) {
    console.error('Error saving binder to Firestore:', err);
  }
}

export async function deleteBinderFromFirestore(userId: string, binderId: string) {
  try {
    await deleteDoc(doc(db, 'users', userId, 'binders', binderId));
  } catch (err) {
    console.error('Error deleting binder from Firestore:', err);
  }
}
