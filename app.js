const saldoEl = document.getElementById("saldo");
const historyEl = document.getElementById("history");
const saveBtn = document.getElementById("saveBtn");
const monthFilter = document.getElementById("monthFilter");
const ctx = document.getElementById("chart");

let chart;
let currentMonth = "";

// ===== UTIL =====
function rupiah(n) {
  return "Rp " + n.toLocaleString("id-ID");
}

// ===== AUTO BULAN SEKARANG =====
const now = new Date();
currentMonth = now.toISOString().slice(0,7);
monthFilter.value = currentMonth;

// ===== SIMPAN =====
saveBtn.onclick = () => {
  const type = document.getElementById("type").value;
  const amount = Number(document.getElementById("amount").value);
  const note = document.getElementById("note").value;

  if (!amount) return alert("Nominal kosong");

  const date = new Date();

  db.collection("transactions").add({
    type,
    amount,
    note,
    createdAt: firebase.firestore.Timestamp.fromDate(date),
    month: date.toISOString().slice(0,7)
  });

  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";
};

// ===== FILTER =====
monthFilter.onchange = () => {
  currentMonth = monthFilter.value;
  loadTransactions();
};

// ===== LOAD DATA =====
function loadTransactions() {
  let ref = db.collection("transactions")
    .orderBy("createdAt", "desc");

  if (currentMonth) {
    ref = ref.where("month", "==", currentMonth);
  }

  ref.onSnapshot(snapshot => {
    historyEl.innerHTML = "";
    let income = 0, expense = 0;

    snapshot.forEach(doc => {
      const d = doc.data();
      const li = document.createElement("li");

      const date = d.createdAt.toDate().toLocaleDateString("id-ID");
      const isIncome = d.type === "income";
      const amountClass = isIncome ? "positive" : "negative";

      isIncome ? income += d.amount : expense += d.amount;

      li.innerHTML = `
        <div>
          <div class="date">${date}</div>
          <div>${d.note || "-"}</div>
        </div>
        <div class="amount ${amountClass}">
          ${isIncome ? "+" : "-"}${rupiah(d.amount)}
          <button class="delete">✕</button>
        </div>
      `;

      li.querySelector(".delete").onclick = () => {
        db.collection("transactions").doc(doc.id).delete();
      };

      historyEl.appendChild(li);
    });

    const saldo = income - expense;
    saldoEl.textContent = rupiah(saldo);
    saldoEl.className = saldo < 0 ? "negative" : "positive";

    renderChart(income, expense);
  });
}

loadTransactions();

// ===== CHART =====
function renderChart(income, expense) {
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Pemasukan", "Pengeluaran"],
      datasets: [{ data: [income, expense] }]
    }
  });
}

// ===== MARKET =====
async function loadMarket() {
  try {
    // USD → IDR
    const usdRes = await fetch("https://open.er-api.com/v6/latest/USD");
    const usd = await usdRes.json();
    const usdRate = usd.rates.IDR;

    document.getElementById("usd").innerHTML =
      `USD → IDR: <span class="positive">${rupiah(usdRate)}</span>`;

    // Emas Dunia (XAU)
    const xauRes = await fetch("https://open.er-api.com/v6/latest/XAU");
    const xau = await xauRes.json();
    const goldIDR = xau.rates.USD * usdRate;

    document.getElementById("gold").innerHTML =
      `Emas Dunia (1 oz): <span class="positive">${rupiah(goldIDR)}</span>`;

    // Bitcoin
    const btcRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=idr&include_24hr_change=true"
    );
    const btc = await btcRes.json();
    const chg = btc.bitcoin.idr_24h_change;

    document.getElementById("btc").innerHTML =
      `Bitcoin: ${rupiah(btc.bitcoin.idr)}
      <span class="${chg >= 0 ? "positive" : "negative"}">
        (${chg.toFixed(2)}%)
      </span>`;

  } catch (e) {
    console.error("Market error", e);
  }
}

loadMarket();
setInterval(loadMarket, 300000);
