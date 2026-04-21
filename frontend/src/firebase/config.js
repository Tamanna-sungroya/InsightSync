import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDhECXZZi67f3D_zciN86Xxk6AUdKwH4_k",
  authDomain: "matrabhumiweb.firebaseapp.com",
  databaseURL: "https://matrabhumiweb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "matrabhumiweb",
  storageBucket: "matrabhumiweb.firebasestorage.app",
  messagingSenderId: "733223433679",
  appId: "1:733223433679:web:cb6fd31bb61094a83b8eba",
  measurementId: "G-R943KVB43Z"
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
