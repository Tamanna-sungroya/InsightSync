import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

let app;
let auth;
let googleProvider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
  console.log('✅ Firebase initialized');
} catch (error) {
  console.error('❌ Firebase init failed', error);
  auth = null;
  googleProvider = null;
}

export { auth, googleProvider };
export default app;
