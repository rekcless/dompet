// ==========================
// CONFIG & INIT
// ==========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  // 🔥 PAKAI CONFIG LO SENDIRI
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// ==========================
// DOM
// ==========================
const dashboard = document.getElementById("dashboard");
const authPage = document.getElementById("authPage");
const monthSelect = document.getElementById("monthFilter");
const tableBody = document.getElementById("tableBody");

const totalMasukEl = document.getElementById("totalMasuk");
const totalKeluarEl = document.getElementById("totalKeluar");
const totalBulananEl = document.getElementById("totalBulanan");

const addForm = document.getElementById("addForm");
const logoutBtn = document.getElementById("logoutBtn");

let transaksi = [];
let selectedMonth = "";
let chartInstance = null;

// ==========================
// UTIL
// ==========================
function formatRp(num) {
  return "Rp " + num.toLocaleString("id-ID");
}

function getMonthKey(date) {
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

// ==========================
// AUTH STATE
// ==========================
onAuthStateChanged(auth, user => {
  if (!user) {
    authPage.classList.remove("hidden");
    dashboard.classList.add("hidden");
    return;
  }

  authPage.classList.add("hidden");
  dashboard.classList.remove("hidden");

  loadData(user.uid);
});

// ==========================
// LOAD DATA
// ==========================
function loadData(uid) {
  const q = query(
    collection(db, "transaksi"),
    where("uid", "==", uid),
    orderBy("tanggal", "desc")
  );

  onSnapshot(q, snap => {
    transaksi = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    initMonthFilter();
    renderAll();
  });
}

// ==========================
// MONTH FILTER
// ==========================
function initMonthFilter() {
  const months = [...new Set(
    transaksi.map(t => getMonthKey(t.tanggal.toDate()))
  )];

  if (!selectedMonth) selectedMonth = months[0] || "";

  monthSelect.innerHTML = months
    .map(m => `<option value="${m}" ${m === selectedMonth ? "selected" : ""}>${m}</option>`)
    .join("");
}

monthSelect.addEventListener("change", e => {
  selectedMonth = e.target.value;
  renderAll();
});

// ==========================
// FILTER DATA
// ==========================
function getFilteredData() {
  return transaksi.filter(t =>
    getMonthKey(t.tanggal.toDate()) === selectedMonth
  );
}

// ==========================
// RENDER TOTAL
// ==========================
function renderTotal(data) {
  let masuk = 0;
  let keluar = 0;

  data.forEach(t => {
    if (t.tipe === "masuk") masuk += t.jumlah;
    else keluar += t.jumlah;
  });

  totalMasukEl.textContent = formatRp(masuk);
  totalKeluarEl.textContent = formatRp(keluar);
  totalBulananEl.textContent = formatRp(masuk - keluar);
}

// ==========================
// RENDER TABLE
// ==========================
function renderTable(data) {
  tableBody.innerHTML = "";

  if (!data.length) {
    tableBody.innerHTML = `<tr><td colspan="4"><small class="muted">Tidak ada data</small></td></tr>`;
    return;
  }

  data.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.kategori}</td>
      <td>${formatRp(t.jumlah)}</td>
      <td>${t.tanggal.toDate().toLocaleDateString("id-ID")}</td>
      <td>
        <button class="btn outline" data-id="${t.id}">Hapus</button>
      </td>
    `;

    tr.querySelector("button").onclick = async () => {
      await deleteDoc(doc(db, "transaksi", t.id));
    };

    tableBody.appendChild(tr);
  });
}

// ==========================
// RENDER CHART
// ==========================
function renderChart(data) {
  let masuk = 0;
  let keluar = 0;

  data.forEach(t => {
    t.tipe === "masuk" ? masuk += t.jumlah : keluar += t.jumlah;
  });

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(
    document.getElementById("myChart"),
    {
      type: "bar",
      data: {
        labels: ["Pemasukan", "Pengeluaran"],
        datasets: [{
          data: [masuk, keluar]
        }]
      }
    }
  );
}

// ==========================
// RENDER ALL
// ==========================
function renderAll() {
  if (!selectedMonth) return;

  const data = getFilteredData();
  renderTotal(data);
  renderTable(data);
  renderChart(data);
}

// ==========================
// ADD TRANSACTION
// ==========================
addForm.addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;

  await addDoc(collection(db, "transaksi"), {
    uid: auth.currentUser.uid,
    kategori: form.kategori.value,
    jumlah: Number(form.jumlah.value),
    tipe: form.tipe.value,
    tanggal: Timestamp.now()
  });

  form.reset();
});

// ==========================
// LOGOUT
// ==========================
logoutBtn.onclick = () => signOut(auth);
