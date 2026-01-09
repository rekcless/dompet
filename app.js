// ===============================
// app.js FINAL
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyA1hFfXW4Equz-kGkFJ4pM1joyy7DYPet0",
  authDomain: "mywapblog-7de53.firebaseapp.com",
  projectId: "mywapblog-7de53",
  storageBucket: "mywapblog-7de53.firebasestorage.app",
  messagingSenderId: "1795132528",
  appId: "1:1795132528:web:920742ad86518d3ff438b5"
};

// ================= INIT =================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ================= DOM =================
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

// ================= STATE =================
let unsubscribe = null;
let allData = [];
let selectedMonthKey = "";

// ================= HELPER =================
function formatRp(num) {
  return "Rp " + (Number(num) || 0).toLocaleString("id-ID");
}

function parseDate(ts) {
  if (!ts) return new Date();
  if (typeof ts.toDate === "function") return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// ================= AUTH =================
loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  await signInWithEmailAndPassword(
    auth,
    loginForm.email.value,
    loginForm.password.value
  );
  loginForm.reset();
});

registerForm.addEventListener("submit", async e => {
  e.preventDefault();
  await createUserWithEmailAndPassword(
    auth,
    registerForm.email.value,
    registerForm.password.value
  );
  registerForm.reset();
  alert("Akun berhasil dibuat. Silakan login.");
});

logoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, user => {
  if (user) {
    authPage.classList.add("hidden");
    dashboard.classList.remove("hidden");
    startRealtime(user.uid);
  } else {
    authPage.classList.remove("hidden");
    dashboard.classList.add("hidden");
    if (unsubscribe) unsubscribe();
    tableBody.innerHTML = "";
  }
});

// ================= FIRESTORE REALTIME =================
function startRealtime(uid) {
  const q = query(
    collection(db, "users", uid, "records"),
    orderBy("tanggalUpload", "desc")
  );

  if (unsubscribe) unsubscribe();

  unsubscribe = onSnapshot(q, snap => {
    allData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    buildMonthFilter();
    render();
  });
}

// ================= ADD TRANSACTION =================
addForm.addEventListener("submit", async e => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  await addDoc(collection(db, "users", user.uid, "records"), {
    kategori: addForm.kategori.value.trim(),
    jumlah: Number(addForm.jumlah.value),
    tipe: addForm.tipe.value,
    tanggalUpload: serverTimestamp()
  });

  addForm.reset();
});

// ================= MONTH FILTER =================
function buildMonthFilter() {
  const set = new Set();

  allData.forEach(d => {
    const dt = parseDate(d.tanggalUpload);
    set.add(getMonthKey(dt));
  });

  const months = Array.from(set).sort().reverse();
  monthFilter.innerHTML = "";

  months.forEach(key => {
    const [y, m] = key.split("-");
    const d = new Date(y, m - 1, 1);
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = d.toLocaleString("id-ID", {
      month: "long",
      year: "numeric"
    });
    monthFilter.appendChild(opt);
  });

  if (!selectedMonthKey) selectedMonthKey = months[0];
  monthFilter.value = selectedMonthKey;
}

monthFilter.addEventListener("change", e => {
  selectedMonthKey = e.target.value;
  render();
});

// ================= RENDER =================
function render() {
  const filtered = allData.filter(d => {
    const dt = parseDate(d.tanggalUpload);
    return getMonthKey(dt) === selectedMonthKey;
  });

  renderTable(filtered);
  renderTotal(filtered);
}

// ================= TABLE (NO EDIT) =================
function renderTable(data) {
  tableBody.innerHTML = "";

  if (data.length === 0) {
    tableBody.innerHTML =
      `<tr><td colspan="4" style="text-align:center">Tidak ada transaksi</td></tr>`;
    return;
  }

  data.forEach(item => {
    const tr = document.createElement("tr");

    const tdKat = document.createElement("td");
    tdKat.textContent = item.kategori;

    const tdJumlah = document.createElement("td");
    tdJumlah.textContent =
      (item.tipe === "masuk" ? "+ " : "- ") + formatRp(item.jumlah);

    const tdTgl = document.createElement("td");
    tdTgl.textContent = parseDate(item.tanggalUpload)
      .toLocaleDateString("id-ID");

    const tdAksi = document.createElement("td");

    const btnHapus = document.createElement("button");
    btnHapus.className = "btn";
    btnHapus.textContent = "Hapus";
    btnHapus.addEventListener("click", () => hapusData(item.id));

    tdAksi.appendChild(btnHapus);

    tr.appendChild(tdKat);
    tr.appendChild(tdJumlah);
    tr.appendChild(tdTgl);
    tr.appendChild(tdAksi);

    tableBody.appendChild(tr);
  });
}

// ================= TOTAL =================
function renderTotal(data) {
  const todayKey = new Date().toLocaleDateString("id-ID");
  let totalHarian = 0;
  let totalBulanan = 0;

  data.forEach(d => {
    const val = d.tipe === "masuk" ? d.jumlah : -d.jumlah;
    totalBulanan += val;

    if (parseDate(d.tanggalUpload).toLocaleDateString("id-ID") === todayKey) {
      totalHarian += val;
    }
  });

  totalHarianEl.textContent = formatRp(totalHarian);
  totalBulananEl.textContent = formatRp(totalBulanan);
}

// ================= DELETE =================
async function hapusData(id) {
  const user = auth.currentUser;
  if (!user) return;
  if (!confirm("Hapus transaksi ini?")) return;

  await deleteDoc(
    doc(db, "users", user.uid, "records", id)
  );
}
