import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAiXQ3NI9d6KtMVes_xxP1QpMJtP49iXjM",
  authDomain: "game101-485a9.firebaseapp.com",
  projectId: "game101-485a9",
  storageBucket: "game101-485a9.firebasestorage.app",
  messagingSenderId: "563808860170",
  appId: "1:563808860170:web:426357b770f68035f687f3",
  measurementId: "G-3C14H6Z9N9"
};

const app = initializeApp(firebaseConfig);

// React Native için Auth state’i kalıcı yap
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

// Analytics (opsiyonel)
(async () => {
  if (await isSupported()) {
    const analytics = getAnalytics(app);
    console.log("Analytics initialized.");
  } else {
    console.warn("Analytics not supported in this environment.");
  }
})();

export { app, auth, db };
