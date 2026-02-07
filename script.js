/************************
 * MARKET DATA - FINAL *
 ************************/

let prevBTC = null;
let prevGold = null;

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
       COINGECKO (BTC + GOLD)
    ====================== */
    const marketRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,gold&vs_currencies=idr,usd"
    );
    const market = await marketRes.json();

    // ===== BITCOIN =====
    const btcPrice = market.bitcoin.idr;
    const btcEl = document.getElementById("btc");
    const btcChange = document.getElementById("btcChange");

    btcEl.innerText = "Rp " + btcPrice.toLocaleString("id-ID");
    setChange(btcEl, btcChange, btcPrice, prevBTC);
    prevBTC = btcPrice;

    // ===== GOLD WORLD =====
    const goldPrice = market.gold.usd;
    const goldEl = document.getElementById("gold");
    const goldChange = document.getElementById("goldChange");

    goldEl.innerText = "$ " + goldPrice.toLocaleString("en-US") + " / oz";
    setChange(goldEl, goldChange, goldPrice, prevGold);
    prevGold = goldPrice;

    /* =====================
       USD → IDR
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
    console.error("Market error:", err);
  }
}

/* =====================
   INIT
====================== */
loadMarket();
setInterval(loadMarket, 60000);
