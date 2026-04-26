let allMediciones = [];
let chartPeso = null, chartGrasa = null, chartMusculo = null;

Chart.defaults.font.family = "'Nunito', sans-serif";
Chart.defaults.font.weight = '700';

(async () => {
  const session = await getSession();
  const { data } = await getMeasurements(session.user.id, { order: 'asc' });
  allMediciones = data || [];
  document.getElementById('loading').style.display = 'none';
  renderPeriod(3);
})();

function setPeriod(btn) {
  document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderPeriod(parseInt(btn.dataset.months, 10));
}

function renderPeriod(months) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const filtered = allMediciones.filter(m => new Date(m.fecha_medicion) >= cutoff);

  if (filtered.length < 1) {
    showEmpty(true);
    return;
  }
  showEmpty(false);

  const labels  = filtered.map(m => utils.formatFechaCorta(m.fecha_medicion).slice(0, 6));
  const pesos   = filtered.map(m => m.peso_kg);
  const grasas  = filtered.map(m => m.grasa_pct);
  const musculos = filtered.map(m => m.musculo_pct);

  const first   = filtered[0];
  const last    = filtered[filtered.length - 1];

  // Stats row
  document.getElementById('stats-row').style.display = 'flex';
  document.getElementById('stat-inicial').textContent = utils.fmt(first.peso_kg);
  document.getElementById('stat-actual').textContent  = utils.fmt(last.peso_kg);
  document.getElementById('stat-count').textContent   = filtered.length;

  // Total delta pill
  const totalDelta = utils.calcularDelta(last.peso_kg, first.peso_kg);
  const pill = document.getElementById('total-pill');
  pill.style.display = 'inline-block';
  if (totalDelta < 0) {
    pill.textContent = `↓ ${Math.abs(totalDelta)} kg total`;
    pill.style.background = 'var(--green-bg)';
    pill.style.color = 'var(--green)';
  } else if (totalDelta > 0) {
    pill.textContent = `↑ ${totalDelta} kg total`;
    pill.style.background = 'var(--red-bg)';
    pill.style.color = 'var(--red)';
  } else {
    pill.textContent = 'Sin cambio';
    pill.style.background = 'var(--cream2)';
    pill.style.color = 'var(--text2)';
  }

  // Current values
  document.getElementById('cur-peso').innerHTML =
    `${utils.fmt(last.peso_kg)} <span class="unit">kg</span>`;
  document.getElementById('cur-grasa').innerHTML =
    `${utils.fmt(last.grasa_pct)}<span class="unit">%</span>`;
  document.getElementById('cur-musculo').innerHTML =
    `${utils.fmt(last.musculo_pct)}<span class="unit">%</span>`;

  // Badges
  setBadge('badge-peso',    utils.calcularDelta(last.peso_kg, first.peso_kg),    'lower-is-better', 'kg');
  setBadge('badge-grasa',   utils.calcularDelta(last.grasa_pct, first.grasa_pct), 'lower-is-better', '%');
  setBadge('badge-musculo', utils.calcularDelta(last.musculo_pct, first.musculo_pct), 'higher-is-better', '%');

  // Charts
  document.getElementById('card-peso').style.display    = 'block';
  document.getElementById('card-grasa').style.display   = 'block';
  document.getElementById('card-musculo').style.display = 'block';

  buildChart('chart-peso',    chartPeso,    labels, pesos,    '#F07B3A', c => { chartPeso    = c; });
  buildChart('chart-grasa',   chartGrasa,   labels, grasas,   '#D94F4F', c => { chartGrasa   = c; });
  buildChart('chart-musculo', chartMusculo, labels, musculos, '#3A9E6A', c => { chartMusculo = c; });
}

function buildChart(canvasId, existing, labels, data, color, saveRef) {
  if (existing) existing.destroy();
  const ctx = document.getElementById(canvasId).getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 120);
  gradient.addColorStop(0, color + '30');
  gradient.addColorStop(1, color + '00');

  saveRef(new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: color,
        borderWidth: 2.5,
        backgroundColor: gradient,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: '#EDE8DE' },
          ticks: { font: { size: 9, weight: '700' }, color: '#6B6560' }
        },
        y: {
          grid: { color: '#EDE8DE' },
          ticks: { font: { size: 9, weight: '700' }, color: '#6B6560' }
        }
      }
    }
  }));
}

function setBadge(id, delta, direction, unit) {
  const el = document.getElementById(id);
  const { text, clase } = utils.formatDelta(delta, direction);
  const isGood = clase === 'delta-good';
  el.textContent = `${text} ${unit}`;
  el.style.background = isGood ? 'var(--green-bg)' : clase === 'delta-bad' ? 'var(--red-bg)' : 'var(--cream2)';
  el.style.color = isGood ? 'var(--green)' : clase === 'delta-bad' ? 'var(--red)' : 'var(--text2)';
}

function showEmpty(show) {
  document.getElementById('empty-state').style.display = show ? 'block' : 'none';
  document.getElementById('stats-row').style.display   = show ? 'none' : 'flex';
  document.getElementById('card-peso').style.display   = show ? 'none' : 'block';
  document.getElementById('card-grasa').style.display  = show ? 'none' : 'block';
  document.getElementById('card-musculo').style.display = show ? 'none' : 'block';
  document.getElementById('total-pill').style.display  = show ? 'none' : 'inline-block';
}
