
// ===== UTILS =====
function fmt(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1e12) return '$' + (n/1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '$' + (n/1e9).toFixed(2)  + 'B';
  if (n >= 1e6)  return '$' + (n/1e6).toFixed(2)  + 'M';
  if (n >= 1000) return '$' + n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  if (n >= 1)    return '$' + n.toFixed(2);
  return '$' + n.toFixed(6);
}
function pct(n) {
  if (!n && n !== 0) return '—';
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}
function shortNum(n) {
  if (!n) return '—';
  if (n >= 1e12) return '$' + (n/1e12).toFixed(1) + 'T';
  if (n >= 1e9)  return '$' + (n/1e9).toFixed(1)  + 'B';
  if (n >= 1e6)  return '$' + (n/1e6).toFixed(1)  + 'M';
  return '$' + n.toLocaleString();
}
function showToast(msg, type='success') {
  const w = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  w.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

let allCoins = [];
let btcChartInst = null;
let modalChartInst = null;

// ===== GLOBAL DATA =====
async function fetchGlobal() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/global');
    const d = await r.json();
    const g = d.data;
    const mc  = g.total_market_cap.usd;
    const vol = g.total_volume.usd;
    const dom = g.market_cap_percentage.btc;
    document.getElementById('hero-mcap').textContent  = shortNum(mc);
    document.getElementById('hero-vol').textContent   = shortNum(vol);
    document.getElementById('hero-dom').textContent   = dom.toFixed(1) + '%';
    document.getElementById('hero-coins').textContent = g.active_cryptocurrencies.toLocaleString();
  } catch(e) {}
}

async function fetchCoins() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=24&page=1&sparkline=true&price_change_percentage=24h');
    allCoins = await r.json();
    renderCoins();
    buildTicker();
    document.getElementById('liveBadge').textContent = '● Live — updated just now';
    document.getElementById('liveBadge').style.color = 'var(--green)';
  } catch(e) {
    document.getElementById('liveBadge').textContent = '⚠ API rate-limited — try again shortly';
    document.getElementById('liveBadge').style.color = 'var(--gold)';
    document.getElementById('coinsGrid').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text2);font-size:.8rem;font-family:\'DM Mono\',monospace;">Unable to load prices. CoinGecko free tier may be rate-limited.</div>';
  }
}

function renderCoins() {
  const grid = document.getElementById('coinsGrid');
  grid.innerHTML = allCoins.map((c, i) => {
    const ch = c.price_change_percentage_24h;
    const cls = ch >= 0 ? 'up' : 'down';
    return `
    <div class="coin-card" onclick="openModal('${c.id}')">
      <div class="cc-top">
        <img class="cc-icon" src="${c.image}" alt="" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2234%22 height=%2234%22/>'"/>
        <span class="cc-change ${cls}">${ch ? pct(ch) : '—'}</span>
      </div>
      <div class="cc-sym">${c.symbol.toUpperCase()}</div>
      <div class="cc-name">${c.name}</div>
      <div class="cc-price">${fmt(c.current_price)}</div>
      <div class="cc-mcap">MCap ${shortNum(c.market_cap)}</div>
      <canvas class="cc-spark" id="spark-${i}" width="200" height="34"></canvas>
    </div>`;
  }).join('');

  allCoins.forEach((c, i) => {
    const canvas = document.getElementById('spark-' + i);
    if (!canvas) return;
    const spark = c.sparkline_in_7d?.price || [];
    if (spark.length < 2) return;
    const ch = c.price_change_percentage_24h;
    const color = ch >= 0 ? '#56d89b' : '#e05c7a';
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const min = Math.min(...spark), max = Math.max(...spark);
    const range = max - min || 1;
    ctx.clearRect(0,0,w,h);
    ctx.beginPath();
    spark.forEach((v,j) => {
      const x = (j/(spark.length-1))*w;
      const y = h - ((v-min)/range)*(h-4) - 2;
      j===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

function buildTicker() {
  const items = allCoins.slice(0,16).map(c => {
    const ch = c.price_change_percentage_24h;
    const cls = ch >= 0 ? 'up' : 'down';
    return `<span class="ticker-item"><span class="t-sym">${c.symbol.toUpperCase()}</span><span class="t-price">${fmt(c.current_price)}</span><span class="t-change ${cls}">${ch ? pct(ch) : ''}</span></span>`;
  }).join('');
  document.getElementById('tickerTrack').innerHTML = items + items;
}

// ===== BTC CHART =====
async function loadChart(days, btn) {
  if (btn) {
    document.querySelectorAll('.ctab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  try {
    const r = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`);
    const d = await r.json();
    const prices = d.prices;
    const labels = prices.map(p => {
      const date = new Date(p[0]);
      return days <= 1 ? date.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : date.toLocaleDateString([],{month:'short',day:'numeric'});
    });
    const vals = prices.map(p => p[1]);
    const ctx = document.getElementById('btcChart').getContext('2d');
    if (btcChartInst) btcChartInst.destroy();
    const isUp = vals[vals.length-1] >= vals[0];
    const color = isUp ? '#56d89b' : '#e05c7a';
    const grad = ctx.createLinearGradient(0,0,0,260);
    grad.addColorStop(0, isUp ? 'rgba(86,216,155,0.15)' : 'rgba(224,92,122,0.15)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    btcChartInst = new Chart(ctx, {
      type:'line',
      data:{
        labels,
        datasets:[{
          data:vals,borderColor:color,borderWidth:1.6,
          backgroundColor:grad,fill:true,pointRadius:0,tension:.3
        }]
      },
      options:{
        responsive:true,maintainAspectRatio:false,
        animation:{duration:600},
        plugins:{legend:{display:false},tooltip:{
          backgroundColor:'rgba(27,29,39,0.95)',
          borderColor:'#333543',borderWidth:1,
          titleColor:'#5b5f73',bodyColor:'#e8e6f5',
          callbacks:{label:c=>'$'+c.raw.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
        }},
        scales:{
          x:{ticks:{color:'#3a3c50',font:{size:10,family:'DM Mono'},maxTicksLimit:8},grid:{color:'rgba(51,53,67,.4)'},border:{display:false}},
          y:{ticks:{color:'#3a3c50',font:{size:10,family:'DM Mono'},callback:v=>'$'+v.toLocaleString()},grid:{color:'rgba(51,53,67,.4)'},border:{display:false}}
        }
      }
    });
  } catch(e) {}
}

// ===== COIN MODAL =====
async function openModal(id) {
  const coin = allCoins.find(c => c.id === id);
  if (!coin) return;
  document.getElementById('m-icon').src = coin.image;
  document.getElementById('m-name').textContent = coin.name;
  document.getElementById('m-sym').textContent = coin.symbol.toUpperCase() + ' · Rank #' + coin.market_cap_rank;
  document.getElementById('m-price').textContent = fmt(coin.current_price);
  const ch = coin.price_change_percentage_24h;
  document.getElementById('m-stats').innerHTML = `
    <div class="ms"><div class="ms-label">24h Change</div><div class="ms-val ${ch>=0?'up':'down'}">${pct(ch)}</div></div>
    <div class="ms"><div class="ms-label">Market Cap</div><div class="ms-val">${shortNum(coin.market_cap)}</div></div>
    <div class="ms"><div class="ms-label">24h Volume</div><div class="ms-val">${shortNum(coin.total_volume)}</div></div>
    <div class="ms"><div class="ms-label">24h High</div><div class="ms-val">${fmt(coin.high_24h)}</div></div>
    <div class="ms"><div class="ms-label">24h Low</div><div class="ms-val">${fmt(coin.low_24h)}</div></div>
    <div class="ms"><div class="ms-label">Supply</div><div class="ms-val">${coin.circulating_supply ? coin.circulating_supply.toLocaleString(undefined,{maximumFractionDigits:0})+' '+coin.symbol.toUpperCase() : '—'}</div></div>
  `;
  document.getElementById('modal').classList.add('open');
  const spark = coin.sparkline_in_7d?.price || [];
  if (spark.length > 1) {
    const ctx = document.getElementById('modalChart').getContext('2d');
    if (modalChartInst) modalChartInst.destroy();
    const isUp = spark[spark.length-1] >= spark[0];
    const color = isUp ? '#56d89b' : '#e05c7a';
    modalChartInst = new Chart(ctx, {
      type:'line',
      data:{labels:spark.map((_,i)=>i),datasets:[{data:spark,borderColor:color,borderWidth:1.5,pointRadius:0,tension:.3,fill:false}]},
      options:{responsive:true,maintainAspectRatio:false,animation:{duration:400},plugins:{legend:{display:false},tooltip:{enabled:false}},scales:{x:{display:false},y:{display:false}}}
    });
  }
}
function closeModal() { document.getElementById('modal').classList.remove('open'); }
document.getElementById('modal').addEventListener('click', e => { if (e.target===document.getElementById('modal')) closeModal(); });

// ===== EMAIL CTA =====
function handleEmail() {
  const val = document.getElementById('emailInput').value.trim();
  if (!val || !val.includes('@')) { showToast('Please enter a valid email', 'error'); return; }
  showToast('Thanks! You\'re on the list 🚀', 'success');
  document.getElementById('emailInput').value = '';
}

// ===== AUTO REFRESH =====
setInterval(async () => {
  if (!allCoins.length) return;
  try {
    const ids = allCoins.slice(0,24).map(c=>c.id).join(',');
    const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
    const data = await r.json();
    allCoins.forEach(c => {
      if (data[c.id]) {
        c.current_price = data[c.id].usd;
        c.price_change_percentage_24h = data[c.id].usd_24h_change;
      }
    });
    renderCoins();
    buildTicker();
  } catch(e) {}
}, 60000);

// ===== INIT =====
fetchGlobal();
fetchCoins();
loadChart(1);
