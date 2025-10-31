// Import Firebase SDK yang dibutuhkan
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// Firebase config kamu
const firebaseConfig = {
  apiKey: "AIzaSyD8LA61JMhfJTr-xING6rPOTY6hUn2HCok",
  authDomain: "dompet-68e74.firebaseapp.com",
  projectId: "dompet-68e74",
  storageBucket: "dompet-68e74.firebasestorage.app",
  messagingSenderId: "431068025175",
  appId: "1:431068025175:web:ee84dcee7445c63970ee12",
  measurementId: "G-VYXX7F59RX"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi Firestore
export const db = getFirestore(app);