// PDF report generator — portrait A4, InBody-inspired sober design.

async function generarPDFBlob(medicion, perfil, historial = []) {
  const m = medicion;
  const p = perfil;
  const metricas = utils.calcularMetricas(m, p);

  const tpl = document.getElementById('pdf-template');
  tpl.innerHTML = buildPDFTemplate(m, p, metricas, historial);

  const canvas = await html2canvas(tpl, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#FFFFFF',
    logging: false
  });

  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;

  // Portrait A4: 210 × 297 mm
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();   // 210
  const pageH = pdf.internal.pageSize.getHeight();  // 297

  const imgW = canvas.width;
  const imgH = canvas.height;
  const ratio = Math.min(pageW / imgW, pageH / imgH);

  const finalW = imgW * ratio;
  const finalH = imgH * ratio;
  const x = (pageW - finalW) / 2;
  const y = (pageH - finalH) / 2;

  pdf.addImage(imgData, 'PNG', x, y, finalW, finalH);

  tpl.innerHTML = '';
  return pdf.output('blob');
}

function buildPDFTemplate(m, p, mt, historial) {
  const edad = mt.edad;
  const bodyAgeDiff  = m.body_age - edad;
  const bodyAgeLabel = bodyAgeDiff <= 0
    ? `${Math.abs(bodyAgeDiff)} años más joven`
    : `${bodyAgeDiff} años mayor`;
  const bodyAgeColor = bodyAgeDiff <= 0 ? '#3A9E6A' : '#D94F4F';
  const bodyAgeBg    = bodyAgeDiff <= 0 ? '#E2F0E8' : '#FCE8E8';

  // Composition bar
  const totalPct    = m.grasa_pct + m.musculo_pct;
  const musculoPct  = Math.min(100, (m.musculo_pct / totalPct) * 100);
  const grasaPct    = Math.min(100, (m.grasa_pct   / totalPct) * 100);
  const oseaPct     = Math.min(100, (mt.osea / m.peso_kg) * 100);
  const residualPct = Math.max(0, 100 - musculoPct - grasaPct - oseaPct);

  const last6 = historial.slice(-6);

  return `
<div style="font-family:'Nunito',sans-serif;background:#FFFFFF;width:794px;color:#1A1714;margin:0;padding:0">

  <!-- HEADER -->
  <div style="background:#1E3A5F;padding:22px 32px;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="color:rgba(255,255,255,0.6);font-size:9px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:5px">Reporte de Composición Corporal</div>
      <div style="color:#FFFFFF;font-size:26px;font-weight:900;letter-spacing:-0.01em;line-height:1">${p.nombre}</div>
      <div style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:600;margin-top:4px">${utils.formatFecha(m.fecha_medicion)}</div>
    </div>
    <div style="display:flex;gap:28px">
      ${headerStat('Edad', edad, 'años')}
      ${headerStat('Sexo', p.sexo === 'M' ? '♂' : '♀', p.sexo === 'M' ? 'Masculino' : 'Femenino')}
      ${headerStat('Estatura', p.estatura_cm, 'cm')}
    </div>
  </div>

  <div style="padding:22px 32px 28px">

  <!-- KEY METRICS ROW -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px">
    ${keyMetric('Peso', utils.fmt(m.peso_kg), 'kg', '#F07B3A', '#FDE8D8')}
    ${keyMetric('IMC', utils.fmt(m.imc), 'kg/m²', '#7C5FC4', '#EDE8F8')}
    ${keyMetric('% Grasa', utils.fmt(m.grasa_pct), '%', '#D94F4F', '#FCE8E8')}
    ${keyMetric('% Músculo', utils.fmt(m.musculo_pct), '%', '#3A9E6A', '#E2F0E8')}
  </div>

  <!-- COMPOSITION BAR -->
  <div style="background:#F4F6F9;border-radius:10px;padding:14px 16px;margin-bottom:18px">
    <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#6B6560;margin-bottom:10px">Composición corporal</div>
    <div style="display:flex;border-radius:6px;overflow:hidden;height:22px;margin-bottom:10px">
      <div style="width:${musculoPct.toFixed(1)}%;background:#3A9E6A;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:white">${utils.fmt(m.musculo_pct)}%</div>
      <div style="width:${oseaPct.toFixed(1)}%;background:#3A72B0;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:white">${utils.fmt(mt.osea / m.peso_kg * 100)}%</div>
      <div style="width:${grasaPct.toFixed(1)}%;background:#D94F4F;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:white">${utils.fmt(m.grasa_pct)}%</div>
      ${residualPct > 0 ? `<div style="width:${residualPct.toFixed(1)}%;background:#DDD8CE"></div>` : ''}
    </div>
    <div style="display:flex;gap:8px">
      ${compBadge('#E2F0E8','#3A9E6A','Músculo', utils.fmt(m.musculo_pct) + '%')}
      ${compBadge('#E4EEF8','#3A72B0','Ósea est.', utils.fmt(mt.osea) + ' kg')}
      ${compBadge('#FCE8E8','#D94F4F','Grasa', utils.fmt(m.grasa_pct) + '%')}
      ${compBadge('#F4F6F9','#6B6560','Masa libre de grasa', utils.fmt(mt.mlg) + ' kg')}
    </div>
  </div>

  <!-- TWO COLUMNS -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">

    <!-- LEFT COLUMN -->
    <div style="display:flex;flex-direction:column;gap:10px">

      <!-- GRASA -->
      <div style="background:#F4F6F9;border-radius:10px;padding:14px 16px">
        <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#6B6560;margin-bottom:8px">Masa grasa</div>
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px">
          <span style="font-size:30px;font-weight:900;color:#D94F4F;line-height:1">${utils.fmt(mt.grasa)}</span>
          <span style="font-size:12px;font-weight:700;color:#6B6560">kg · ${utils.fmt(m.grasa_pct)}%</span>
          <span style="margin-left:auto;font-size:9px;font-weight:800;background:#FCE8E8;color:#D94F4F;padding:3px 8px;border-radius:6px;white-space:nowrap">${mt.claseGrasa}</span>
        </div>
        ${referenceBar(m.grasa_pct, p.sexo === 'M' ? 6 : 14, p.sexo === 'M' ? 25 : 32, '#D94F4F')}
        <div style="font-size:9px;color:#6B6560;margin-top:4px;font-weight:600">Rango saludable: ${p.sexo === 'M' ? '14–18%' : '21–25%'}</div>
      </div>

      <!-- MÚSCULO -->
      <div style="background:#F4F6F9;border-radius:10px;padding:14px 16px">
        <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#6B6560;margin-bottom:8px">Masa muscular</div>
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px">
          <span style="font-size:30px;font-weight:900;color:#3A9E6A;line-height:1">${utils.fmt(mt.musculo)}</span>
          <span style="font-size:12px;font-weight:700;color:#6B6560">kg · ${utils.fmt(m.musculo_pct)}%</span>
        </div>
        <div style="font-size:10px;color:#6B6560;font-weight:600">Proteína estimada: <strong style="color:#1A1714">${utils.fmt(mt.prot)} kg</strong></div>
      </div>

      <!-- GRASA VISCERAL -->
      <div style="background:#F4F6F9;border-radius:10px;padding:14px 16px">
        <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#6B6560;margin-bottom:8px">Grasa visceral</div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <span style="font-size:34px;font-weight:900;line-height:1;color:${m.grasa_visceral <= 9 ? '#3A9E6A' : m.grasa_visceral <= 14 ? '#F07B3A' : '#D94F4F'}">${m.grasa_visceral}</span>
          <div>
            <div style="font-size:11px;font-weight:800;color:${m.grasa_visceral <= 9 ? '#3A9E6A' : m.grasa_visceral <= 14 ? '#F07B3A' : '#D94F4F'}">${mt.claseGrasaV}</div>
            <div style="font-size:9px;color:#6B6560;font-weight:600">nivel 1–20</div>
          </div>
        </div>
        ${visceralBar(m.grasa_visceral)}
      </div>

    </div>

    <!-- RIGHT COLUMN -->
    <div style="display:flex;flex-direction:column;gap:10px">

      <!-- BODY AGE -->
      <div style="background:#F4F6F9;border-radius:10px;padding:14px 16px">
        <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#6B6560;margin-bottom:10px">Edad corporal vs. real</div>
        <div style="display:flex;justify-content:space-around;align-items:center">
          <div style="text-align:center">
            <div style="font-size:9px;font-weight:700;color:#6B6560;margin-bottom:3px">Edad real</div>
            <div style="font-size:32px;font-weight:900;color:#1A1714;line-height:1">${edad}</div>
          </div>
          <div style="font-size:20px;color:#DDD8CE">→</div>
          <div style="text-align:center">
            <div style="font-size:9px;font-weight:700;color:#6B6560;margin-bottom:3px">Body Age</div>
            <div style="font-size:32px;font-weight:900;line-height:1;color:${bodyAgeColor}">${m.body_age}</div>
            <div style="font-size:9px;font-weight:800;margin-top:3px;color:${bodyAgeColor};background:${bodyAgeBg};padding:2px 8px;border-radius:6px">${bodyAgeLabel}</div>
          </div>
        </div>
      </div>

      <!-- METABOLISMO -->
      <div style="background:#F4F6F9;border-radius:10px;padding:14px 16px">
        <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#6B6560;margin-bottom:10px">Metabolismo</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          ${metricBox('#FDE8D8','#D4622A','TMB', m.tmb_kcal.toString(), 'kcal')}
          ${metricBox('#E2F0E8','#3A9E6A','GET Sed.', mt.getSed.toString(), 'kcal')}
          ${metricBox('#E4EEF8','#3A72B0','GET Mod.', mt.getMod.toString(), 'kcal')}
        </div>
      </div>

      <!-- INDICES ADICIONALES -->
      <div style="background:#F4F6F9;border-radius:10px;padding:14px 16px">
        <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#6B6560;margin-bottom:10px">Índices adicionales</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${metricBox('#FDE8D8','#D4622A','Masa libre de grasa', utils.fmt(mt.mlg), 'kg')}
          ${metricBox('#E4EEF8','#3A72B0','Índice masa magra', utils.fmt(mt.imm), 'kg/m²')}
        </div>
      </div>

    </div>
  </div>

  <!-- CLASSIFICATIONS + TREND TABLE -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">

    <!-- CLASSIFICATIONS -->
    <div style="background:#F4F6F9;border-radius:10px;padding:14px 16px">
      <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#6B6560;margin-bottom:12px">Clasificaciones</div>
      <table style="width:100%;border-collapse:collapse">
        ${clasifRow('IMC', utils.fmt(m.imc) + ' kg/m²', mt.claseIMC)}
        ${clasifRow('% Grasa', utils.fmt(m.grasa_pct) + '%', mt.claseGrasa)}
        ${clasifRow('Grasa Visceral', 'Nivel ' + m.grasa_visceral, mt.claseGrasaV)}
        ${clasifRow('Edad Corporal', m.body_age + ' años', mt.claseBodyAge)}
        ${clasifRow('Índice Magro', utils.fmt(mt.imm) + ' kg/m²', '')}
      </table>
    </div>

    <!-- TREND TABLE (HTML, no SVG) -->
    <div style="background:#F4F6F9;border-radius:10px;padding:14px 16px">
      <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#6B6560;margin-bottom:12px">Tendencia — últimas mediciones</div>
      ${last6.length >= 2 ? buildTrendTable(last6) : '<div style="color:#6B6560;font-size:11px;padding:12px 0;text-align:center;font-weight:600">Se necesitan al menos 2 mediciones para mostrar la tendencia.</div>'}
    </div>

  </div>

  </div>

  <!-- FOOTER -->
  <div style="background:#F0EDE8;padding:10px 32px;text-align:center;border-top:1px solid #DDD8CE">
    <span style="font-size:9px;color:#6B6560;font-weight:600">BodyComp Tracker · Generado el ${utils.formatFecha(utils.hoy())} · Datos de balanza de bioimpedancia</span>
  </div>

</div>`;
}

// ── Helper builders ────────────────────────────────────────────

function headerStat(label, value, sub) {
  return `<div style="text-align:center">
    <div style="color:rgba(255,255,255,0.6);font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px">${label}</div>
    <div style="color:#FFFFFF;font-size:26px;font-weight:900;line-height:1">${value}</div>
    <div style="color:rgba(255,255,255,0.65);font-size:9px;font-weight:600;margin-top:2px">${sub}</div>
  </div>`;
}

function keyMetric(label, value, unit, color, bg) {
  return `<div style="background:${bg};border-radius:10px;padding:12px 14px;text-align:center">
    <div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:${color};opacity:0.8;margin-bottom:4px">${label}</div>
    <div style="font-size:28px;font-weight:900;color:${color};letter-spacing:-0.02em;line-height:1">${value}</div>
    <div style="font-size:9px;font-weight:700;color:${color};opacity:0.7;margin-top:2px">${unit}</div>
  </div>`;
}

function compBadge(bg, color, label, val) {
  return `<div style="background:${bg};border-radius:8px;padding:5px 10px">
    <div style="font-size:8px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:0.07em">${label}</div>
    <div style="font-size:13px;font-weight:900;color:${color}">${val}</div>
  </div>`;
}

function metricBox(bg, color, label, val, unit) {
  return `<div style="background:${bg};border-radius:8px;padding:8px 10px">
    <div style="font-size:8px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:0.07em;opacity:0.85;margin-bottom:2px">${label}</div>
    <div style="font-size:18px;font-weight:900;color:${color};letter-spacing:-0.02em;line-height:1">${val}</div>
    <div style="font-size:8px;font-weight:700;color:${color};opacity:0.7;margin-top:1px">${unit}</div>
  </div>`;
}

function referenceBar(value, min, max, color) {
  const pct    = Math.min(100, Math.max(0, (value / (max + 8)) * 100));
  const minPct = ((min / (max + 8)) * 100).toFixed(1);
  const maxPct = ((max / (max + 8)) * 100).toFixed(1);
  return `<div style="background:#DDD8CE;border-radius:4px;height:8px;position:relative;overflow:hidden">
    <div style="background:${color};width:${pct.toFixed(1)}%;height:100%;border-radius:4px;opacity:0.75"></div>
    <div style="position:absolute;left:${minPct}%;top:0;bottom:0;width:2px;background:white;opacity:0.8"></div>
    <div style="position:absolute;left:${maxPct}%;top:0;bottom:0;width:2px;background:white;opacity:0.8"></div>
  </div>`;
}

function visceralBar(nivel) {
  const segments = [
    { color: '#3A9E6A', pct: 20 },
    { color: '#8BC34A', pct: 25 },
    { color: '#F07B3A', pct: 25 },
    { color: '#D94F4F', pct: 30 }
  ];
  const markerPct = ((nivel - 1) / 19) * 100;
  const bars = segments.map(s =>
    `<div style="flex:${s.pct};background:${s.color};height:8px"></div>`
  ).join('');
  return `<div style="position:relative">
    <div style="display:flex;border-radius:4px;overflow:hidden">${bars}</div>
    <div style="position:absolute;left:${markerPct.toFixed(1)}%;top:-4px;transform:translateX(-50%);width:3px;height:16px;background:#1A1714;border-radius:2px"></div>
  </div>`;
}

function clasifRow(label, value, clase) {
  const isGood = ['Normal','Muy bueno','Excelente','Atlético','Atlética','Fitness'].includes(clase);
  const isMid  = ['Promedio','Sobrepeso','Elevado'].includes(clase);
  const claseColor = isGood ? '#3A9E6A' : isMid ? '#F07B3A' : '#D94F4F';
  const claseBg    = isGood ? '#E2F0E8' : isMid ? '#FDE8D8' : '#FCE8E8';
  return `<tr>
    <td style="font-size:10px;font-weight:700;color:#6B6560;padding:5px 0;border-bottom:1px solid #DDD8CE;vertical-align:middle">${label}</td>
    <td style="font-size:10px;font-weight:800;color:#1A1714;padding:5px 6px;border-bottom:1px solid #DDD8CE;text-align:right;vertical-align:middle">${value}</td>
    <td style="padding:5px 0;border-bottom:1px solid #DDD8CE;text-align:right;vertical-align:middle">
      ${clase ? `<span style="display:inline-block;font-size:9px;font-weight:800;background:${claseBg};color:${claseColor};padding:2px 7px;border-radius:5px">${clase}</span>` : ''}
    </td>
  </tr>`;
}

function buildTrendTable(records) {
  const thStyle = 'background:#1E3A5F;color:white;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;padding:5px 8px;text-align:right';
  const thFirst = thStyle + ';text-align:left';
  const tdStyle = 'font-size:10px;font-weight:700;color:#1A1714;padding:5px 8px;border-bottom:1px solid #E5E0D8;text-align:right';
  const tdFirst = 'font-size:10px;font-weight:600;color:#6B6560;padding:5px 8px;border-bottom:1px solid #E5E0D8;text-align:left';

  const rows = records.map(r => `<tr>
    <td style="${tdFirst}">${utils.formatFechaCorta(r.fecha_medicion)}</td>
    <td style="${tdStyle}">${utils.fmt(r.peso_kg)} kg</td>
    <td style="${tdStyle}">${utils.fmt(r.grasa_pct)}%</td>
    <td style="${tdStyle}">${utils.fmt(r.musculo_pct)}%</td>
  </tr>`).join('');

  return `<table style="width:100%;border-collapse:collapse">
    <thead>
      <tr>
        <th style="${thFirst}">Fecha</th>
        <th style="${thStyle}">Peso</th>
        <th style="${thStyle}">Grasa</th>
        <th style="${thStyle}">Músculo</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}
