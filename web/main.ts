const pricesDiv = document.getElementById("prices")!;
const ctx = (document.getElementById("priceChart") as HTMLCanvasElement).getContext("2d")!;
let chart: any = null;

async function loadPrices() {
  const res = await fetch("/api/prices");
  const data: {time_start: string, NOK_per_kWh: number}[] = await res.json();

  const last12Hours = data.slice(-12);

  pricesDiv.innerHTML = "";
  last12Hours.forEach(p => {
    const div = document.createElement("div");
    div.textContent = `${new Date(p.time_start).getHours()}:00 - ${p.NOK_per_kWh.toFixed(2)} NOK`;
    pricesDiv.appendChild(div);
  });

  const labels = last12Hours.map(p => `${new Date(p.time_start).getHours()}:00`);
  const prices = last12Hours.map(p => p.NOK_per_kWh);

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = prices;
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{label:"NOK/kWh", data: prices, borderColor:"blue", backgroundColor:"rgba(0,0,255,0.2)", fill:true}]
      },
      options: {responsive:true}
    });
  }
}

loadPrices();
setInterval(loadPrices, 60*1000);
