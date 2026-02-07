// ===== FIREBASE =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore, collection, addDoc,
  getDocs, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAmfGFR-wl3Uf2Zja7Q_ee-NSFXtO66AQI",
  authDomain: "wallet-7f76f.firebaseapp.com",
  projectId: "wallet-7f76f",
  storageBucket: "wallet-7f76f.firebasestorage.app",
  messagingSenderId: "409930272697",
  appId: "1:409930272697:web:b4d4b4675b0fb197953068"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== ELEMENT =====
const form = document.getElementById("form");
const list = document.getElementById("list");
const saldoEl = document.getElementById("saldo");
const monthFilter = document.getElementById("monthFilter");

// ===== UTIL =====
function rupiah(num) {
  return "Rp " + Number(num).toLocaleString("id-ID");
}

// ===== AUTO BULAN SEKARANG =====
const today = new Date();
const currentMonthValue = today.toISOString().slice(0, 7);
monthFilter.value = currentMonthValue;

// ===== LOAD TRANSAKSI =====
async function loadTransactions() {
  list.innerHTML = "";
  let saldo = 0;

  const snapshot = await getDocs(collection(db, "transactions"));

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (!data.date.startsWith(monthFilter.value)) return;

    const tr = document.createElement("tr");

    const valueClass = data.type === "out" ? "minus" : "plus";
    const sign = data.type === "out" ? "-" : "+";

    saldo += data.type === "out"
      ? -Number(data.amount)
      : Number(data.amount);

    tr.innerHTML = `
      <td>${data.date}</td>
      <td>${data.note}</td>
      <td class="${valueClass}">
        ${sign} ${rupiah(data.amount)}
      </td>
      <td>
        <button class="action-btn" data-id="${docSnap.id}">✕</button>
      </td>
    `;

    tr.querySelector("button").onclick = async () => {
      await deleteDoc(doc(db, "transactions", docSnap.id));
      loadTransactions();
    };

    list.appendChild(tr);
  });

  saldoEl.innerHTML = saldo >= 0
    ? `<span class="positive">${rupiah(saldo)}</span>`
    : `<span class="negative">${rupiah(saldo)}</span>`;
}

// ===== SUBMIT =====
form.onsubmit = async e => {
  e.preventDefault();

  const data = {
    date: form.date.value,
    note: form.note.value,
    amount: Number(form.amount.value),
    type: form.type.value
  };

  await addDoc(collection(db, "transactions"), data);
  form.reset();
  loadTransactions();
};

// ===== FILTER BULAN =====
monthFilter.onchange = loadTransactions;

// ===== MARKET =====
async function loadMarket() {
  try {
    // USD → IDR
    const usdRes = await fetch("https://api.frankfurter.app/latest?from=USD&to=IDR");
    const usdData = await usdRes.json();
    const usdRate = usdData.rates.IDR;

    document.getElementById("usd").innerHTML =
      `USD → IDR: <span class="positive">${rupiah(usdRate)}</span>`;

    // EMAS PER GRAM
    const goldUSDoz = 2050;
    const goldIDRgram = (goldUSDoz * usdRate) / 31.1035;

    document.getElementById("gold").innerHTML =
      `Emas / gram:
       <span class="positive">${rupiah(goldIDRgram)}</span>`;

    // BITCOIN
    const btcRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=idr&include_24hr_change=true"
    );
    const btc = await btcRes.json();

    const btcPrice = btc.bitcoin.idr;
    const btcChange = btc.bitcoin.idr_24h_change;

    document.getElementById("btc").innerHTML =
      `Bitcoin:
       ${rupiah(btcPrice)}
       <span class="${btcChange >= 0 ? "positive" : "negative"}">
         (${btcChange.toFixed(2)}%)
       </span>`;

  } catch {
    document.getElementById("btc").textContent = "Bitcoin: error";
    document.getElementById("usd").textContent = "USD → IDR: error";
    document.getElementById("gold").textContent = "Emas / gram: error";
  }
}

// ===== INIT =====
loadTransactions();
loadMarket();
setInterval(loadMarket, 300000);
