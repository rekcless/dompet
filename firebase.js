const firebaseConfig = {
  apiKey: "AIzaSyAmfGFR-wl3Uf2Zja7Q_ee-NSFXtO66AQI",
  authDomain: "wallet-7f76f.firebaseapp.com",
  projectId: "wallet-7f76f",
  storageBucket: "wallet-7f76f.firebasestorage.app",
  messagingSenderId: "409930272697",
  appId: "1:409930272697:web:b4d4b4675b0fb197953068"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

auth.signInAnonymously()
  .then(() => console.log("Firebase connected ✅"))
  .catch(err => console.error(err));
