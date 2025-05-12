import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDbWKR7pRsrK-K-NQACxCwxig0JZR8rLb4",
    authDomain: "healthfoodapp-40671.firebaseapp.com",
    projectId: "healthfoodapp-40671",
    storageBucket: "healthfoodapp-40671.firebasestorage.app",
    messagingSenderId: "326799818384",
    appId: "1:326799818384:web:c2d6b79cb098d0e6b3a215"
  };

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
