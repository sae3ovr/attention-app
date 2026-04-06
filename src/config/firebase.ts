import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-XXXXXXXXXX',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const isFirebaseConfigured = firebaseConfig.apiKey !== 'YOUR_API_KEY';

export const COLLECTIONS = {
  USERS: 'users',
  INCIDENTS: 'incidents',
  CHAINS: 'chains',
  CHAIN_MEMBERS: 'chainMembers',
  CHAIN_MESSAGES: 'chainMessages',
  CHAIN_ALERTS: 'chainAlerts',
  FAMILIES: 'families',
  FAMILY_MEMBERS: 'familyMembers',
  ACTIVITY_LOGS: 'activityLogs',
  NOTIFICATIONS: 'notifications',
  FEED: 'feed',
} as const;

export default firebaseConfig;
