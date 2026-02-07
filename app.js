const saldoEl = document.getElementById("saldo");
const historyEl = document.getElementById("history");
const saveBtn = document.getElementById("saveBtn");

let chart;
const ctx = document.getElementById("chart");

function rupiah(num) {
  return "Rp " + num.toLocaleString("id-ID");
}

// SAVE TRANSAKSI
saveBtn.addEventListener("click", () => {
  const type = typeEl = document.getElementById("type").value;
  const amount = Number(document.getElementById("amount").value);
  const note = document.getElementById("note").value;

  if (!amount) return alert("Nominal kosong");

  db.collection("transactions").add({
    type,
    amount,
    note,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";
});

// LOAD DATA REALTIME
db.collection("transactions")
  .orderBy("createdAt", "desc")
  .onSnapshot(snapshot => {
    historyEl.innerHTML = "";

    let income = 0;
    let expense = 0;

    snapshot.forEach(doc => {
      const d = doc.data();
      const li = document.createElement("li");
      li.className = d.type;
      li.textContent =
        `${d.type === "income" ? "+" : "-"} ${rupiah(d.amount)} ${d.note || ""}`;
      historyEl.appendChild(li);

      d.type === "income" ? income += d.amount : expense += d.amount;
    });

    saldoEl.textContent = rupiah(income - expense);
    renderChart(income, expense);
  });

// CHART
function renderChart(income, expense) {
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Pemasukan", "Pengeluaran"],
      datasets: [{
        data: [income, expense]
      }]
    }
  });
}

// ===== MARKET =====
async function loadMarket() {
  try {
    // BITCOIN
    const btcRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=idr&include_24hr_change=true"
    );
    const btc = await btcRes.json();
    const btcPrice = btc.bitcoin.idr;
    const btcChange = btc.bitcoin.idr_24h_change;

    document.getElementById("btc").innerHTML =
      `Bitcoin: ${rupiah(btcPrice)} 
      <span class="${btcChange >= 0 ? "up" : "down"}">
        (${btcChange.toFixed(2)}%)
      </span>`;

    // USD IDR
    const usdRes = await fetch(
      "https://api.exchangerate.host/latest?base=USD&symbols=IDR"
    );
    const usd = await usdRes.json();
    document.getElementById("usd").innerHTML =
      `USD → IDR: ${rupiah(usd.rates.IDR)}`;

    // GOLD
    const goldRes = await fetch(
      "https://api.exchangerate.host/latest?base=XAU&symbols=IDR"
    );
    const gold = await goldRes.json();
    document.getElementById("gold").innerHTML =
      `Emas Dunia (1 oz): ${rupiah(gold.rates.IDR)}`;

  } catch (e) {
    console.error("Market error:", e);
  }
}

loadMarket();
setInterval(loadMarket, 300000);
