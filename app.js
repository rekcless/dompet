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

// ===== SIMPAN TRANSAKSI =====
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

// ===== FILTER BULAN =====
monthFilter.onchange = () => {
  currentMonth = monthFilter.value;
  renderUI(allData);
};

let allData = [];

// ===== SATU-SATUNYA LISTENER =====
db.collection("transactions")
  .orderBy("createdAt", "desc")
  .onSnapshot(snapshot => {
    allData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderUI(allData);
  });

// ===== RENDER UI =====
function renderUI(data) {
  historyEl.innerHTML = "";
  let income = 0;
  let expense = 0;

  data
    .filter(d => d.month === currentMonth)
    .forEach(d => {
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
        db.collection("transactions").doc(d.id).delete();
      };

      historyEl.appendChild(li);
    });

  const saldo = income - expense;
  saldoEl.textContent = rupiah(saldo);
  saldoEl.className = saldo < 0 ? "negative" : "positive";

  renderChart(income, expense);
}

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
