import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGJUmD9rYtKNnUKGXasJRs57UyrHVq-6Q",
  authDomain: "bachelor-party-mk.firebaseapp.com",
  projectId: "bachelor-party-mk",
  storageBucket: "bachelor-party-mk.firebasestorage.app",
  messagingSenderId: "588727020923",
  appId: "1:588727020923:web:d742c916c707ee101d21de",
  measurementId: "G-1BH6QYVDKG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and export a reference
const db = getDatabase(app);

export { db };