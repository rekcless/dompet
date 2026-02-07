/***********************
 * MARKET DATA SCRIPT *
 ***********************/

// simpan harga sebelumnya
let prevBTC = null;
let prevGold = null;

// fungsi hitung naik / turun
function setChange(priceEl, changeEl, current, previous) {
  if (previous === null) {
    priceEl.className = "neutral";
    changeEl.innerText = "";
    return;
  }

  const diff = current - previous;
  const percent = (diff / previous) * 100;

  if (diff > 0) {
    priceEl.className = "up";
    changeEl.innerText = `▲ ${percent.toFixed(2)}%`;
  } else if (diff < 0) {
    priceEl.className = "down";
    changeEl.innerText = `▼ ${percent.toFixed(2)}%`;
  } else {
    priceEl.className = "neutral";
    changeEl.innerText = "0%";
  }
}

async function loadMarket() {
  try {
    /* =====================
       BITCOIN (CoinGecko)
    ====================== */
    const btcRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=idr"
    );
    const btcData = await btcRes.json();
    const btcPrice = btcData.bitcoin.idr;

    const btcEl = document.getElementById("btc");
    const btcChangeEl = document.getElementById("btcChange");

    btcEl.innerText = "Rp " + btcPrice.toLocaleString("id-ID");
    setChange(btcEl, btcChangeEl, btcPrice, prevBTC);
    prevBTC = btcPrice;

    /* =====================
       EMAS DUNIA (XAU/USD)
       via Frankfurter ECB
    ====================== */
    const goldRes = await fetch(
      "https://api.frankfurter.app/latest?from=XAU&to=USD"
    );
    const goldData = await goldRes.json();
    const goldPrice = goldData.rates.USD;

    const goldEl = document.getElementById("gold");
    const goldChangeEl = document.getElementById("goldChange");

    goldEl.innerText = "$ " + goldPrice.toLocaleString("en-US") + " / oz";
    setChange(goldEl, goldChangeEl, goldPrice, prevGold);
    prevGold = goldPrice;

    /* =====================
       USD → IDR (ECB)
    ====================== */
    const usdRes = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=IDR"
    );
    const usdData = await usdRes.json();

    document.getElementById("usd").innerText =
      "Rp " + usdData.rates.IDR.toLocaleString("id-ID");

    /* =====================
       UPDATE TIME
    ====================== */
    document.getElementById("updateTime").innerText =
      "Update terakhir: " + new Date().toLocaleString("id-ID");

  } catch (err) {
    console.error("Gagal load market data:", err);
  }
}

/* =====================
   CHART (Dummy / Placeholder)
====================== */
const ctx = document.getElementById("financeChart");
if (ctx) {
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr"],
      datasets: [
        {
          label: "Saldo",
          data: [0, 0, 0, 0],
          borderWidth: 2,
          tension: 0.4
        }
      ]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: "#00ff9c"
          }
        }
      },
      scales: {
        x: { ticks: { color: "#aaa" } },
        y: { ticks: { color: "#aaa" } }
      }
    }
  });
}

/* =====================
   INIT
====================== */
loadMarket();
setInterval(loadMarket, 60000); // update tiap 1 menit
