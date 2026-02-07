let prevBTC = null;
let prevGold = null;

function setChange(el, changeEl, current, previous) {
  if (previous === null) {
    el.className = "neutral";
    changeEl.innerText = "";
    return;
  }

  const diff = current - previous;
  const percent = (diff / previous) * 100;

  if (diff > 0) {
    el.className = "up";
    changeEl.innerText = `▲ ${percent.toFixed(2)}%`;
  } else if (diff < 0) {
    el.className = "down";
    changeEl.innerText = `▼ ${percent.toFixed(2)}%`;
  } else {
    el.className = "neutral";
    changeEl.innerText = "0%";
  }
}

async function loadMarket() {
  try {
    // BITCOIN
    const btcRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=idr"
    );
    const btcData = await btcRes.json();
    const btcPrice = btcData.bitcoin.idr;

    const btcEl = document.getElementById("btc");
    const btcChange = document.getElementById("btcChange");

    btcEl.innerText = "Rp " + btcPrice.toLocaleString("id-ID");
    setChange(btcEl, btcChange, btcPrice, prevBTC);
    prevBTC = btcPrice;

    // GOLD
    const goldRes = await fetch("https://api.metals.live/v1/spot/gold");
    const goldData = await goldRes.json();
    const goldPrice = goldData[0][1];

    const goldEl = document.getElementById("gold");
    const goldChange = document.getElementById("goldChange");

    goldEl.innerText = "$ " + goldPrice.toLocaleString("en-US") + " / oz";
    setChange(goldEl, goldChange, goldPrice, prevGold);
    prevGold = goldPrice;

    // USD IDR
    const usdRes = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    const usdData = await usdRes.json();

    document.getElementById("usd").innerText =
      "Rp " + usdData.rates.IDR.toLocaleString("id-ID");

    document.getElementById("updateTime").innerText =
      "Update terakhir: " + new Date().toLocaleString("id-ID");

  } catch (err) {
    console.error("Market error:", err);
  }
}

// CHART (dummy, bisa disambung ke data lu)
const ctx = document.getElementById("financeChart");
new Chart(ctx, {
  type: "line",
  data: {
    labels: ["Jan", "Feb", "Mar", "Apr"],
    datasets: [{
      label: "Saldo",
      data: [0, 0, 0, 0],
      borderWidth: 2,
      tension: 0.4
    }]
  }
});

loadMarket();
setInterval(loadMarket, 60000);
