// PDF report generator using jsPDF + html2canvas
// Replicates an InBody-style report with all derived metrics.

async function generarPDFBlob(medicion, perfil, historial = []) {
  const m = medicion;
  const p = perfil;
  const metricas = utils.calcularMetricas(m, p);

  // Build the hidden HTML template
  const tpl = document.getElementById('pdf-template');
  tpl.innerHTML = buildPDFTemplate(m, p, metricas, historial);

  // Capture with html2canvas
  const canvas = await html2canvas(tpl, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#F5F0E8',
    logging: false
  });

  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;

  // A4 landscape: 297 × 210 mm
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const imgW = canvas.width;
  const imgH = canvas.height;
  const ratio = Math.min(pageW / imgW, pageH / imgH);

  const finalW = imgW * ratio;
  const finalH = imgH * ratio;
  const x = (pageW - finalW) / 2;
  const y = (pageH - finalH) / 2;

  pdf.addImage(imgData, 'PNG', x, y, finalW, finalH);

  tpl.innerHTML = ''; // cleanup
  return pdf.output('blob');
}

function buildPDFTemplate(m, p, mt, historial) {
  const edad = mt.edad;
  const bodyAgeDiff = m.body_age - edad;
  const bodyAgeLabel = bodyAgeDiff <= 0 ? `${Math.abs(bodyAgeDiff)} años más joven` : `${bodyAgeDiff} años mayor`;
  const bodyAgeColor = bodyAgeDiff <= 0 ? '#3A9E6A' : '#D94F4F';

  // Composition bar percentages
  const totalPct = m.grasa_pct + m.musculo_pct;
  const musculoPct = Math.min(100, (m.musculo_pct / totalPct) * 100);
  const grasaPct   = Math.min(100, (m.grasa_pct   / totalPct) * 100);
  const oseaPct    = Math.min(100, ((mt.osea / m.peso_kg) * 100));
  const residualPct = Math.max(0, 100 - musculoPct - grasaPct - oseaPct);

  // History sparkline (last 6 measurements)
  const last6 = historial.slice(-6);
  const sparkPoints = buildSparkPoints(last6.map(r => r.peso_kg), 300, 60);
  const sparkFat    = buildSparkPoints(last6.map(r => r.grasa_pct), 300, 60);
  const sparkMuscle = buildSparkPoints(last6.map(r => r.musculo_pct), 300, 60);

  return `
<div style="font-family:'Nunito',sans-serif;background:#F5F0E8;padding:32px;width:794px;color:#1A1714">

  <!-- HEADER -->
  <div style="background:#F07B3A;border-radius:20px;padding:20px 24px;margin-bottom:20px;color:white;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="font-size:11px;font-weight:800;letter-spacing:0.1em;opacity:0.8;text-transform:uppercase">Reporte de Composición Corporal</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.02em">${p.nombre}</div>
      <div style="font-size:13px;opacity:0.85;font-weight:600">${utils.formatFecha(m.fecha_medicion)}</div>
    </div>
    <div style="display:flex;gap:20px">
      <div style="text-align:center">
        <div style="font-size:10px;font-weight:800;opacity:0.8;text-transform:uppercase">Edad</div>
        <div style="font-size:32px;font-weight:900">${edad}</div>
        <div style="font-size:11px;opacity:0.75">años</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:10px;font-weight:800;opacity:0.8;text-transform:uppercase">Sexo</div>
        <div style="font-size:22px;font-weight:900">${p.sexo === 'M' ? '♂' : '♀'}</div>
        <div style="font-size:11px;opacity:0.75">${p.sexo === 'M' ? 'Masculino' : 'Femenino'}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:10px;font-weight:800;opacity:0.8;text-transform:uppercase">Estatura</div>
        <div style="font-size:32px;font-weight:900">${p.estatura_cm}</div>
        <div style="font-size:11px;opacity:0.75">cm</div>
      </div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">

    <!-- LEFT COLUMN -->
    <div style="display:flex;flex-direction:column;gap:12px">

      <!-- BODY AGE -->
      <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
        <div style="font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#6B6560;margin-bottom:10px">Edad corporal vs real</div>
        <div style="display:flex;justify-content:space-around;align-items:center">
          <div style="text-align:center">
            <div style="font-size:10px;font-weight:700;color:#6B6560">Edad real</div>
            <div style="font-size:36px;font-weight:900;color:#1A1714">${edad}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:10px;font-weight:700;color:#6B6560">Body Age</div>
            <div style="font-size:36px;font-weight:900;color:${bodyAgeColor}">${m.body_age}</div>
            <div style="font-size:11px;font-weight:700;color:${bodyAgeColor}">${bodyAgeLabel}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:10px;font-weight:700;color:#6B6560">Estado</div>
            <div style="font-size:13px;font-weight:800;color:${bodyAgeColor};background:${bodyAgeDiff <= 0 ? '#E2F0E8' : '#FCE8E8'};padding:6px 10px;border-radius:10px">${mt.claseBodyAge}</div>
          </div>
        </div>
      </div>

      <!-- COMPOSITION BAR -->
      <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
        <div style="font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#6B6560;margin-bottom:12px">Composición corporal</div>
        <div style="display:flex;border-radius:10px;overflow:hidden;height:28px;margin-bottom:12px">
          <div style="width:${musculoPct.toFixed(1)}%;background:#3A9E6A;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:white">${utils.fmt(m.musculo_pct)}%</div>
          <div style="width:${oseaPct.toFixed(1)}%;background:#3A72B0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:white">${utils.fmt(mt.osea / m.peso_kg * 100)}%</div>
          <div style="width:${grasaPct.toFixed(1)}%;background:#D94F4F;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:white">${utils.fmt(m.grasa_pct)}%</div>
          ${residualPct > 0 ? `<div style="width:${residualPct.toFixed(1)}%;background:#EDE8DE"></div>` : ''}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${badge('#E2F0E8','#3A9E6A','Músculo',utils.fmt(m.musculo_pct)+'%')}
          ${badge('#E4EEF8','#3A72B0','Ósea est.',utils.fmt(mt.osea)+' kg')}
          ${badge('#FCE8E8','#D94F4F','Grasa',utils.fmt(m.grasa_pct)+'%')}
        </div>
      </div>

      <!-- MAIN METRICS -->
      <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
        <div style="font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#6B6560;margin-bottom:12px">Métricas principales</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${metricBox('#FDE8D8','#D4622A','Peso',utils.fmt(m.peso_kg),'kg')}
          ${metricBox('#FDE8D8','#D4622A','IMC',utils.fmt(m.imc),'kg/m²')}
          ${metricBox('#E2F0E8','#3A9E6A','Masa libre de grasa',utils.fmt(mt.mlg),'kg')}
          ${metricBox('#E4EEF8','#3A72B0','Índice masa magra',utils.fmt(mt.imm),'kg/m²')}
        </div>
      </div>

    </div>

    <!-- RIGHT COLUMN -->
    <div style="display:flex;flex-direction:column;gap:12px">

      <!-- GRASA -->
      <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
        <div style="font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#6B6560;margin-bottom:8px">Masa grasa</div>
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px">
          <span style="font-size:36px;font-weight:900;color:#D94F4F">${utils.fmt(mt.grasa)}</span>
          <span style="font-size:14px;font-weight:700;color:#6B6560">kg · ${utils.fmt(m.grasa_pct)}%</span>
          <span style="margin-left:auto;font-size:12px;font-weight:800;background:#FCE8E8;color:#D94F4F;padding:4px 10px;border-radius:8px">${mt.claseGrasa}</span>
        </div>
        ${referenceBar(m.grasa_pct, p.sexo === 'M' ? 6 : 14, p.sexo === 'M' ? 25 : 32, '#D94F4F')}
        <div style="font-size:10px;color:#6B6560;margin-top:4px">Rango saludable: ${p.sexo === 'M' ? '14–18%' : '21–25%'}</div>
      </div>

      <!-- MÚSCULO -->
      <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
        <div style="font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#6B6560;margin-bottom:8px">Masa muscular</div>
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px">
          <span style="font-size:36px;font-weight:900;color:#3A9E6A">${utils.fmt(mt.musculo)}</span>
          <span style="font-size:14px;font-weight:700;color:#6B6560">kg · ${utils.fmt(m.musculo_pct)}%</span>
        </div>
        <div style="font-size:12px;color:#6B6560;font-weight:600">Proteína estimada: <strong style="color:#1A1714">${utils.fmt(mt.prot)} kg</strong></div>
      </div>

      <!-- GRASA VISCERAL -->
      <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
        <div style="font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#6B6560;margin-bottom:8px">Grasa Visceral</div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <span style="font-size:40px;font-weight:900;color:${m.grasa_visceral <= 9 ? '#3A9E6A' : m.grasa_visceral <= 14 ? '#F07B3A' : '#D94F4F'}">${m.grasa_visceral}</span>
          <div>
            <div style="font-size:13px;font-weight:800;color:${m.grasa_visceral <= 9 ? '#3A9E6A' : m.grasa_visceral <= 14 ? '#F07B3A' : '#D94F4F'}">${mt.claseGrasaV}</div>
            <div style="font-size:11px;color:#6B6560">nivel 1–20</div>
          </div>
        </div>
        ${visceralBar(m.grasa_visceral)}
      </div>

      <!-- METABOLISMO -->
      <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
        <div style="font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#6B6560;margin-bottom:10px">Metabolismo</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          ${metricBox('#FDE8D8','#D4622A','TMB',m.tmb_kcal.toString(),'kcal')}
          ${metricBox('#E2F0E8','#3A9E6A','GET Sed.',mt.getSed.toString(),'kcal')}
          ${metricBox('#E4EEF8','#3A72B0','GET Mod.',mt.getMod.toString(),'kcal')}
        </div>
      </div>

    </div>
  </div>

  <!-- CLASSIFICATIONS TABLE + HISTORY TREND -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">

    <!-- CLASSIFICATION TABLE -->
    <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
      <div style="font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#6B6560;margin-bottom:10px">Clasificaciones</div>
      ${classificationRow('IMC', utils.fmt(m.imc) + ' kg/m²', mt.claseIMC)}
      ${classificationRow('% Grasa', utils.fmt(m.grasa_pct) + '%', mt.claseGrasa)}
      ${classificationRow('Grasa Visceral', 'Nivel ' + m.grasa_visceral, mt.claseGrasaV)}
      ${classificationRow('Edad Corporal', m.body_age + ' años', mt.claseBodyAge)}
      ${classificationRow('Índice Magro', utils.fmt(mt.imm) + ' kg/m²', '')}
    </div>

    <!-- TREND CHART -->
    <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
      <div style="font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#6B6560;margin-bottom:10px">Tendencia — últimas ${last6.length} mediciones</div>
      ${last6.length >= 2 ? `
      <div style="margin-bottom:8px">
        <div style="font-size:10px;font-weight:700;color:#D4622A;margin-bottom:2px">Peso (kg)</div>
        <svg width="300" height="50" style="overflow:visible">${sparkSVG(sparkPoints,'#F07B3A',300,50)}</svg>
      </div>
      <div style="margin-bottom:8px">
        <div style="font-size:10px;font-weight:700;color:#D94F4F;margin-bottom:2px">% Grasa</div>
        <svg width="300" height="40" style="overflow:visible">${sparkSVG(sparkFat,'#D94F4F',300,40)}</svg>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;color:#3A9E6A;margin-bottom:2px">% Músculo</div>
        <svg width="300" height="40" style="overflow:visible">${sparkSVG(sparkMuscle,'#3A9E6A',300,40)}</svg>
      </div>
      ` : '<div style="color:#6B6560;font-size:12px;padding:20px 0;text-align:center">Se necesitan al menos 2 mediciones para mostrar la tendencia.</div>'}
    </div>

  </div>

  <div style="text-align:center;margin-top:16px;font-size:10px;color:#6B6560;font-weight:600">
    BodyComp Tracker · Generado el ${utils.formatFecha(utils.hoy())} · Datos de balanza de bioimpedancia
  </div>
</div>`;
}

// ── Helper builders ────────────────────────────────────────────

function badge(bg, color, label, val) {
  return `<div style="background:${bg};border-radius:10px;padding:6px 10px;display:flex;flex-direction:column">
    <span style="font-size:9px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:0.08em">${label}</span>
    <span style="font-size:15px;font-weight:900;color:${color}">${val}</span>
  </div>`;
}

function metricBox(bg, color, label, val, unit) {
  return `<div style="background:${bg};border-radius:12px;padding:10px 12px">
    <div style="font-size:9px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:0.08em;opacity:0.8">${label}</div>
    <div style="font-size:22px;font-weight:900;color:${color};letter-spacing:-0.02em">${val}</div>
    <div style="font-size:10px;font-weight:700;color:${color};opacity:0.7">${unit}</div>
  </div>`;
}

function referenceBar(value, min, max, color) {
  const pct = Math.min(100, Math.max(0, ((value - 0) / (max + 10)) * 100));
  return `<div style="background:#EDE8DE;border-radius:6px;height:10px;position:relative;overflow:hidden">
    <div style="background:${color};width:${pct}%;height:100%;border-radius:6px;opacity:0.8"></div>
    <div style="position:absolute;left:${((min / (max + 10)) * 100).toFixed(1)}%;top:0;bottom:0;width:2px;background:white;opacity:0.7"></div>
    <div style="position:absolute;left:${((max / (max + 10)) * 100).toFixed(1)}%;top:0;bottom:0;width:2px;background:white;opacity:0.7"></div>
  </div>`;
}

function visceralBar(nivel) {
  const segments = [
    { label: '1–4', color: '#3A9E6A', pct: 20 },
    { label: '5–9', color: '#8BC34A', pct: 25 },
    { label: '10–14', color: '#F07B3A', pct: 25 },
    { label: '15–20', color: '#D94F4F', pct: 30 }
  ];
  const markerPct = ((nivel - 1) / 19) * 100;
  const bars = segments.map(s =>
    `<div style="flex:${s.pct};background:${s.color};height:10px"></div>`
  ).join('');
  return `<div style="position:relative">
    <div style="display:flex;border-radius:6px;overflow:hidden">${bars}</div>
    <div style="position:absolute;left:${markerPct.toFixed(1)}%;top:-3px;transform:translateX(-50%);width:3px;height:16px;background:#1A1714;border-radius:2px"></div>
  </div>`;
}

function classificationRow(label, value, clase) {
  const claseColor = clase === 'Normal' || clase === 'Muy bueno' || clase === 'Excelente' || clase === 'Atlético' || clase === 'Atlética' || clase === 'Fitness'
    ? '#3A9E6A' : clase === 'Promedio' || clase === 'Sobrepeso' || clase === 'Elevado' || clase === 'Normal'
    ? '#F07B3A' : '#D94F4F';
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #EDE8DE">
    <span style="font-size:12px;font-weight:700;color:#6B6560">${label}</span>
    <span style="font-size:12px;font-weight:800;color:#1A1714">${value}</span>
    ${clase ? `<span style="font-size:10px;font-weight:800;background:${claseColor === '#3A9E6A' ? '#E2F0E8' : claseColor === '#F07B3A' ? '#FDE8D8' : '#FCE8E8'};color:${claseColor};padding:3px 8px;border-radius:8px">${clase}</span>` : '<span></span>'}
  </div>`;
}

function buildSparkPoints(values, width, height) {
  if (!values || values.length < 2) return [];
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const padding = 8;
  return values.map((v, i) => ({
    x: padding + (i / (values.length - 1)) * (width - padding * 2),
    y: height - padding - ((v - minV) / range) * (height - padding * 2)
  }));
}

function sparkSVG(points, color, width, height) {
  if (!points || points.length < 2) return '';
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = line + ` L${points[points.length - 1].x.toFixed(1)},${height} L${points[0].x.toFixed(1)},${height} Z`;
  const dots = points.map(p =>
    `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${color}" stroke="white" stroke-width="2"/>`
  ).join('');
  return `
    <path d="${area}" fill="${color}" opacity="0.15"/>
    <path d="${line}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}
  `;
}
