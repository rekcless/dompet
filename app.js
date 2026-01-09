// app.js (FINAL – TANPA EDIT TRANSAKSI)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore, collection, addDoc, onSnapshot,
  deleteDoc, doc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyA1hFfXW4Equz-kGkFJ4pM1joyy7DYPet0",
  authDomain: "mywapblog-7de53.firebaseapp.com",
  projectId: "mywapblog-7de53",
  storageBucket: "mywapblog-7de53.firebasestorage.app",
  messagingSenderId: "1795132528",
  appId: "1:1795132528:web:920742ad86518d3ff438b5"
};

/* ================= INIT ================= */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= DOM ================= */
const authPage = document.getElementById("authPage");
const dashboard = document.getElementById("dashboard");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const logoutBtn = document.getElementById("logoutBtn");

const addForm = document.getElementById("addForm");
const tableBody = document.getElementById("tableBody");

const totalHarianEl = document.getElementById("totalHarian");
const totalBulananEl = document.getElementById("totalBulanan");
const monthFilter = document.getElementById("monthFilter");

/* ================= STATE ================= */
let unsubscribe = null;
let allData = [];
let selectedMonth = "";

/* ================= HELPER ================= */
function formatRp(num){
  return "Rp " + (Number(num) || 0).toLocaleString("id-ID");
}

function parseDate(ts){
  if (!ts) return new Date();
  if (ts.toDate) return ts.toDate();
  return new Date(ts.seconds * 1000);
}

/* ================= AUTH ================= */
loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  await signInWithEmailAndPassword(auth, loginForm.email.value, loginForm.password.value);
  loginForm.reset();
});

registerForm.addEventListener("submit", async e => {
  e.preventDefault();
  await createUserWithEmailAndPassword(auth, registerForm.email.value, registerForm.password.value);
  registerForm.reset();
  alert("Akun berhasil dibuat, silakan login");
});

logoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, user => {
  if (user) {
    authPage.classList.add("hidden");
    dashboard.classList.remove("hidden");
    startListener(user.uid);
  } else {
    authPage.classList.remove("hidden");
    dashboard.classList.add("hidden");
    if (unsubscribe) unsubscribe();
  }
});

/* ================= FIRESTORE LISTENER ================= */
function startListener(uid){
  const q = query(
    collection(db, "users", uid, "records"),
    orderBy("tanggalUpload", "desc")
  );

  unsubscribe = onSnapshot(q, snap => {
    allData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    buildMonthFilter();
    render();
  });
}

/* ================= ADD DATA ================= */
addForm.addEventListener("submit", async e => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  await addDoc(collection(db, "users", user.uid, "records"), {
    kategori: addForm.kategori.value,
    jumlah: Number(addForm.jumlah.value),
    tipe: addForm.tipe.value,
    tanggalUpload: serverTimestamp()
  });

  addForm.reset();
});

/* ================= MONTH FILTER ================= */
function buildMonthFilter(){
  const months = [...new Set(allData.map(d => {
    const dt = parseDate(d.tanggalUpload);
    return `${dt.getFullYear()}-${dt.getMonth()}`;
  }))].sort().reverse();

  monthFilter.innerHTML = "";

  months.forEach(m => {
    const [y, mo] = m.split("-");
    const d = new Date(y, mo);
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = d.toLocaleString("id-ID", { month:"long", year:"numeric" });
    monthFilter.appendChild(opt);
  });

  if (!selectedMonth) selectedMonth = months[0];
  monthFilter.value = selectedMonth;
}

monthFilter.addEventListener("change", e => {
  selectedMonth = e.target.value;
  render();
});

/* ================= RENDER ================= */
function render(){
  const filtered = allData.filter(d => {
    const dt = parseDate(d.tanggalUpload);
    return `${dt.getFullYear()}-${dt.getMonth()}` === selectedMonth;
  });

  renderTable(filtered);
  renderTotal(filtered);
}

/* ================= TABLE ================= */
function renderTable(data){
  tableBody.innerHTML = "";

  if (!data.length) {
    tableBody.innerHTML = `<tr><td colspan="4" align="center">Tidak ada data</td></tr>`;
    return;
  }

  data.forEach(d => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${d.kategori}</td>
      <td>${d.tipe === "masuk" ? "+" : "-"} ${formatRp(d.jumlah)}</td>
      <td>${parseDate(d.tanggalUpload).toLocaleDateString("id-ID")}</td>
      <td><button class="btn" data-id="${d.id}">Hapus</button></td>
    `;

    tr.querySelector("button").onclick = () => hapusData(d.id);
    tableBody.appendChild(tr);
  });
}

/* ================= TOTAL BULANAN & HARIAN ================= */
function renderTotal(data){
  const today = new Date().toLocaleDateString("id-ID");
  let harian = 0;
  let bulanan = 0;

  data.forEach(d => {
    const val = d.tipe === "masuk" ? d.jumlah : -d.jumlah;
    bulanan += val;
    if (parseDate(d.tanggalUpload).toLocaleDateString("id-ID") === today) {
      harian += val;
    }
  });

  totalHarianEl.textContent = formatRp(harian);
  totalBulananEl.textContent = formatRp(bulanan);
}

/* ================= DELETE ================= */
async function hapusData(id){
  if (!confirm("Hapus transaksi ini?")) return;
  const user = auth.currentUser;
  await deleteDoc(doc(db, "users", user.uid, "records", id));
}
