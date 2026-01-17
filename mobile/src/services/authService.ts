import {
  signInAnonymously,
  signInWithCredential,
  GoogleAuthProvider,
  linkWithCredential,
  User,
  UserCredential,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_PREF_KEY = '@game101_guest_upgraded';

export const authService = {
  signInAsGuest: async (): Promise<User> => {
    const result = await signInAnonymously(auth);
    return result.user;
  },

  signInWithGoogle: async (idToken: string, accessToken: string): Promise<UserCredential> => {
    const credential = GoogleAuthProvider.credential(idToken, accessToken);

    if (auth.currentUser?.isAnonymous) {
      // Link Google to existing anonymous account
      const result = await linkWithCredential(auth.currentUser, credential);
      await AsyncStorage.setItem(GUEST_PREF_KEY, 'true');
      return result;
    } else {
      // Sign in new Google account
      return signInWithCredential(auth, credential);
    }
  },

  signOut: async (): Promise<void> => {
    await signOut(auth);
    await AsyncStorage.removeItem(GUEST_PREF_KEY);
  },

  isGuestUpgraded: async (): Promise<boolean> => {
    const value = await AsyncStorage.getItem(GUEST_PREF_KEY);
    return value === 'true';
  },

  onAuthChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },
};
