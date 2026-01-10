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
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyA1hFfXW4Equz-kGkFJ4pM1joyy7DYPet0",
  authDomain: "mywapblog-7de53.firebaseapp.com",
  projectId: "mywapblog-7de53",
};

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
const monthFilter = document.getElementById("monthFilter");

const saldoTotalEl = document.getElementById("saldoTotal");
const totalHarianEl = document.getElementById("totalHarian");
const totalBulananEl = document.getElementById("totalBulanan");
const rekapMasukEl = document.getElementById("rekapMasuk");
const rekapKeluarEl = document.getElementById("rekapKeluar");

/* ================= STATE ================= */
let allData = [];
let selectedMonth = "all";
let chart = null;

/* ================= UTIL ================= */
const rupiah = n => "Rp " + (n || 0).toLocaleString("id-ID");

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/* ================= AUTH ================= */
loginForm.onsubmit = e => {
  e.preventDefault();
  signInWithEmailAndPassword(auth, loginForm.email.value, loginForm.password.value);
};

registerForm.onsubmit = async e => {
  e.preventDefault();
  await createUserWithEmailAndPassword(auth, registerForm.email.value, registerForm.password.value);
  alert("Akun dibuat, silakan login");
};

logoutBtn.onclick = () => signOut(auth);

/* ================= AUTH STATE ================= */
onAuthStateChanged(auth, user => {
  if (!user) {
    authPage.classList.remove("hidden");
    dashboard.classList.add("hidden");
    return;
  }

  authPage.classList.add("hidden");
  dashboard.classList.remove("hidden");

  const q = query(
    collection(db, "users", user.uid, "records"),
    orderBy("tanggal", "desc")
  );

  onSnapshot(q, snap => {
    allData = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      tanggal: d.data().tanggal.toDate()
    }));

    buildMonthFilter();
    render();
  });
});

/* ================= ADD ================= */
addForm.onsubmit = async e => {
  e.preventDefault();
  const user = auth.currentUser;

  await addDoc(collection(db, "users", user.uid, "records"), {
    kategori: addForm.kategori.value,
    jumlah: Number(addForm.jumlah.value),
    tipe: addForm.tipe.value,
    tanggal: serverTimestamp()
  });

  addForm.reset();
};

/* ================= FILTER ================= */
function buildMonthFilter() {
  const months = [...new Set(allData.map(d => getMonthKey(d.tanggal)))];

  monthFilter.innerHTML = `<option value="all">Semua Bulan</option>`;
  months.forEach(m => {
    const [y, mo] = m.split("-");
    const label = new Date(y, mo - 1).toLocaleString("id-ID", {
      month: "long",
      year: "numeric"
    });
    monthFilter.innerHTML += `<option value="${m}">${label}</option>`;
  });

  monthFilter.value = selectedMonth;
}

monthFilter.onchange = e => {
  selectedMonth = e.target.value;
  render();
};

/* ================= RENDER ================= */
function render() {
  const data =
    selectedMonth === "all"
      ? allData
      : allData.filter(d => getMonthKey(d.tanggal) === selectedMonth);

  renderTable(data);
  renderSummary(data);
  renderChart(data);
}

/* ================= TABLE ================= */
function renderTable(data) {
  tableBody.innerHTML = "";

  if (!data.length) {
    tableBody.innerHTML = `<tr><td colspan="4" align="center">Tidak ada data</td></tr>`;
    return;
  }

  data.forEach(d => {
    tableBody.innerHTML += `
      <tr>
        <td>${d.kategori}</td>
        <td>${d.tipe === "masuk" ? "+" : "-"} ${rupiah(d.jumlah)}</td>
        <td>${d.tanggal.toLocaleDateString("id-ID")}</td>
        <td>
          <button class="btn" onclick="hapus('${d.id}')">Hapus</button>
        </td>
      </tr>
    `;
  });
}

window.hapus = async id => {
  const user = auth.currentUser;
  if (confirm("Hapus transaksi?")) {
    await deleteDoc(collection(db, "users", user.uid, "records", id));
  }
};

/* ================= SUMMARY ================= */
function renderSummary(data) {
  let masuk = 0, keluar = 0, saldo = 0, hariIni = 0;
  const today = new Date().toLocaleDateString("id-ID");

  data.forEach(d => {
    if (d.tipe === "masuk") masuk += d.jumlah;
    else keluar += d.jumlah;

    saldo += d.tipe === "masuk" ? d.jumlah : -d.jumlah;

    if (d.tanggal.toLocaleDateString("id-ID") === today) {
      hariIni += d.tipe === "masuk" ? d.jumlah : -d.jumlah;
    }
  });

  rekapMasukEl.textContent = rupiah(masuk);
  rekapKeluarEl.textContent = rupiah(keluar);
  totalBulananEl.textContent = rupiah(saldo);
  saldoTotalEl.textContent = rupiah(saldo);
  totalHarianEl.textContent = rupiah(hariIni);
}

/* ================= CHART ================= */
function renderChart(data) {
  const map = {};

  data.forEach(d => {
    const key = d.tanggal.toLocaleDateString("id-ID");
    map[key] ??= 0;
    map[key] += d.tipe === "masuk" ? d.jumlah : -d.jumlah;
  });

  const labels = Object.keys(map);
  const values = Object.values(map);

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("myChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: "#4B8DE0"
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });
}
