// PDF report — portrait A4, InBody-inspired sober design.
// Charts: SVG for lines/dots + absolutely-positioned HTML divs for all text
// (html2canvas renders SVG shapes fine but drops SVG <text> nodes).

async function generarPDFBlob(medicion, perfil, historial = []) {
  const tpl = document.getElementById('pdf-template');
  tpl.innerHTML = buildPDFTemplate(medicion, perfil,
    utils.calcularMetricas(medicion, perfil), historial);

  const canvas = await html2canvas(tpl, {
    scale: 2, useCORS: true, backgroundColor: '#FFFFFF', logging: false
  });

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pw / canvas.width, ph / canvas.height);
  const fw = canvas.width * ratio;
  const fh = canvas.height * ratio;
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG',
    (pw - fw) / 2, (ph - fh) / 2, fw, fh);
  tpl.innerHTML = '';
  return pdf.output('blob');
}

// ── Template ───────────────────────────────────────────────────

function buildPDFTemplate(m, p, mt, historial) {
  const edad = mt.edad;
  const bodyAgeDiff  = m.body_age - edad;
  const bodyAgeLabel = bodyAgeDiff <= 0
    ? `${Math.abs(bodyAgeDiff)} años más joven` : `${bodyAgeDiff} años mayor`;
  const bodyAgeColor = bodyAgeDiff <= 0 ? '#2C6B44' : '#8A2C2C';

  const totalPct    = m.grasa_pct + m.musculo_pct;
  const musculoPct  = Math.min(100, (m.musculo_pct / totalPct) * 100);
  const grasaPct    = Math.min(100, (m.grasa_pct   / totalPct) * 100);
  const oseaPct     = Math.min(100, (mt.osea / m.peso_kg) * 100);
  const residualPct = Math.max(0, 100 - musculoPct - grasaPct - oseaPct);

  const last6  = historial.slice(-6);
  const CW     = 308; // chart width (fits inside column with border + padding)

  return `
<div style="font-family:'Nunito',sans-serif;background:#FFFFFF;width:794px;color:#1A1A1A;margin:0;padding:0">

<!-- HEADER -->
<div style="background:#1A3A4A;padding:18px 28px;display:flex;justify-content:space-between;align-items:center">
  <div>
    <div style="color:rgba(255,255,255,0.5);font-size:8px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:4px">Reporte de Composición Corporal</div>
    <div style="color:#FFFFFF;font-size:23px;font-weight:900;letter-spacing:-0.01em;line-height:1.1">${p.nombre}</div>
    <div style="color:rgba(255,255,255,0.6);font-size:11px;font-weight:600;margin-top:4px">${utils.formatFecha(m.fecha_medicion)}</div>
  </div>
  <div style="display:flex">
    ${hdrStat('Edad', edad, 'años')}
    ${hdrStat('Sexo', p.sexo === 'M' ? '♂' : '♀', p.sexo === 'M' ? 'Masc.' : 'Fem.')}
    ${hdrStat('Estatura', p.estatura_cm, 'cm')}
  </div>
</div>

<div style="padding:18px 28px 22px">

<!-- KPI ROW -->
<div style="display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #CCCCCC;margin-bottom:14px">
  ${kpiBox('Peso',      utils.fmt(m.peso_kg),    'kg',     '#1B5272', true)}
  ${kpiBox('IMC',       utils.fmt(m.imc),         'kg/m²',  '#3D3472', true)}
  ${kpiBox('% Grasa',   utils.fmt(m.grasa_pct),   '%',      '#8A2C2C', true)}
  ${kpiBox('% Músculo', utils.fmt(m.musculo_pct), '%',      '#2C6B44', false)}
</div>

<!-- COMPOSITION BAR -->
<div style="border:1px solid #CCCCCC;margin-bottom:14px">
  ${secHdr('Composición Corporal')}
  <div style="padding:10px 12px">
    <div style="display:flex;height:18px;border:1px solid #BBBBBB;overflow:hidden;margin-bottom:8px">
      <div style="width:${musculoPct.toFixed(1)}%;background:#2C6B44;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:white">${utils.fmt(m.musculo_pct)}%</div>
      <div style="width:${oseaPct.toFixed(1)}%;background:#4A6A8A;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:800;color:white">${utils.fmt(mt.osea / m.peso_kg * 100)}%</div>
      <div style="width:${grasaPct.toFixed(1)}%;background:#8A2C2C;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:white">${utils.fmt(m.grasa_pct)}%</div>
      ${residualPct > 0 ? `<div style="width:${residualPct.toFixed(1)}%;background:#D5D0C8"></div>` : ''}
    </div>
    <div style="display:flex;gap:18px">
      ${compLeg('#2C6B44', 'Músculo',           utils.fmt(m.musculo_pct) + '% · ' + utils.fmt(mt.musculo) + ' kg')}
      ${compLeg('#4A6A8A', 'Ósea est.',          utils.fmt(mt.osea) + ' kg')}
      ${compLeg('#8A2C2C', 'Grasa',             utils.fmt(m.grasa_pct) + '% · ' + utils.fmt(mt.grasa) + ' kg')}
      ${compLeg('#666666', 'Masa libre de grasa', utils.fmt(mt.mlg) + ' kg')}
    </div>
  </div>
</div>

<!-- TWO COLUMNS -->
<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">

  <!-- LEFT -->
  <div style="display:flex;flex-direction:column;gap:10px">

    <div style="border:1px solid #CCCCCC">
      ${secHdr('Masa Grasa')}
      <div style="padding:10px 12px">
        <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:6px">
          <span style="font-size:28px;font-weight:900;color:#8A2C2C;line-height:1">${utils.fmt(mt.grasa)}</span>
          <span style="font-size:11px;color:#666666">kg · ${utils.fmt(m.grasa_pct)}%</span>
          <span style="margin-left:auto">${clsBadge(mt.claseGrasa)}</span>
        </div>
        ${refBar(m.grasa_pct, p.sexo === 'M' ? 6 : 14, p.sexo === 'M' ? 25 : 32, '#8A2C2C')}
        <div style="font-size:8px;color:#999;margin-top:3px">Rango saludable: ${p.sexo === 'M' ? '14–18%' : '21–25%'}</div>
      </div>
    </div>

    <div style="border:1px solid #CCCCCC">
      ${secHdr('Masa Muscular')}
      <div style="padding:10px 12px">
        <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:4px">
          <span style="font-size:28px;font-weight:900;color:#2C6B44;line-height:1">${utils.fmt(mt.musculo)}</span>
          <span style="font-size:11px;color:#666666">kg · ${utils.fmt(m.musculo_pct)}%</span>
        </div>
        <div style="font-size:9.5px;color:#666666">Proteína estimada: <strong style="color:#1A1A1A">${utils.fmt(mt.prot)} kg</strong></div>
      </div>
    </div>

    <div style="border:1px solid #CCCCCC">
      ${secHdr('Grasa Visceral')}
      <div style="padding:10px 12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px">
          <span style="font-size:30px;font-weight:900;line-height:1;color:${m.grasa_visceral <= 9 ? '#2C6B44' : m.grasa_visceral <= 14 ? '#7A5E1A' : '#8A2C2C'}">${m.grasa_visceral}</span>
          <div>
            <div style="font-size:10px;font-weight:800;color:${m.grasa_visceral <= 9 ? '#2C6B44' : m.grasa_visceral <= 14 ? '#7A5E1A' : '#8A2C2C'}">${mt.claseGrasaV}</div>
            <div style="font-size:8px;color:#999">nivel 1–20</div>
          </div>
        </div>
        ${visBar(m.grasa_visceral)}
      </div>
    </div>

  </div>

  <!-- RIGHT -->
  <div style="display:flex;flex-direction:column;gap:10px">

    <div style="border:1px solid #CCCCCC">
      ${secHdr('Edad Corporal')}
      <div style="padding:10px 12px">
        <div style="display:flex;justify-content:space-around;align-items:center;padding:4px 0">
          <div style="text-align:center">
            <div style="font-size:8px;color:#999;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:3px">Edad real</div>
            <div style="font-size:28px;font-weight:900;color:#1A1A1A;line-height:1">${edad}</div>
          </div>
          <div style="color:#CCCCCC;font-size:16px">→</div>
          <div style="text-align:center">
            <div style="font-size:8px;color:#999;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:3px">Body Age</div>
            <div style="font-size:28px;font-weight:900;line-height:1;color:${bodyAgeColor}">${m.body_age}</div>
            <div style="font-size:8px;font-weight:700;margin-top:3px;color:${bodyAgeColor}">${bodyAgeLabel}</div>
          </div>
        </div>
      </div>
    </div>

    <div style="border:1px solid #CCCCCC">
      ${secHdr('Metabolismo')}
      <div style="padding:10px 12px">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
          ${metBox('TMB',         m.tmb_kcal.toString(), 'kcal')}
          ${metBox('GET Sed.',    mt.getSed.toString(),   'kcal')}
          ${metBox('GET Mod.',    mt.getMod.toString(),   'kcal')}
        </div>
      </div>
    </div>

    <div style="border:1px solid #CCCCCC">
      ${secHdr('Índices Adicionales')}
      <div style="padding:10px 12px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          ${metBox('Masa libre de grasa', utils.fmt(mt.mlg),  'kg')}
          ${metBox('Índice masa magra',   utils.fmt(mt.imm),  'kg/m²')}
        </div>
      </div>
    </div>

  </div>
</div>

<!-- CLASSIFICATIONS + TREND -->
<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">

  <div style="border:1px solid #CCCCCC">
    ${secHdr('Clasificaciones')}
    <table style="width:100%;border-collapse:collapse;font-family:Nunito,sans-serif">
      ${clsRow('IMC',              utils.fmt(m.imc) + ' kg/m²',   mt.claseIMC)}
      ${clsRow('% Grasa corporal', utils.fmt(m.grasa_pct) + '%',   mt.claseGrasa)}
      ${clsRow('Grasa visceral',   'Nivel ' + m.grasa_visceral,    mt.claseGrasaV)}
      ${clsRow('Edad corporal',    m.body_age + ' años',           mt.claseBodyAge)}
      ${clsRow('Índice masa magra',utils.fmt(mt.imm) + ' kg/m²',  '')}
    </table>
  </div>

  <div style="border:1px solid #CCCCCC">
    ${secHdr('Tendencia — últimas ' + last6.length + ' mediciones')}
    <div style="padding:10px 12px">
      ${last6.length >= 2
        ? buildTrendSection(last6, CW)
        : '<div style="color:#999;font-size:10px;padding:16px 0;text-align:center">Se necesitan al menos 2 mediciones.</div>'
      }
    </div>
  </div>

</div>

</div>

<!-- FOOTER -->
<div style="border-top:1px solid #D0D0D0;padding:7px 28px;background:#F5F5F5">
  <span style="font-size:8px;color:#AAAAAA;font-weight:600">BodyComp Tracker · Generado el ${utils.formatFecha(utils.hoy())} · Datos de balanza de bioimpedancia</span>
</div>

</div>`;
}

// ── Section helpers ────────────────────────────────────────────

function secHdr(title) {
  return `<div style="background:#1A3A4A;padding:5px 12px">
    <span style="color:white;font-size:7.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.13em">${title}</span>
  </div>`;
}

function hdrStat(label, value, sub) {
  return `<div style="text-align:center;padding:6px 18px;border-left:1px solid rgba(255,255,255,0.18)">
    <div style="color:rgba(255,255,255,0.5);font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px">${label}</div>
    <div style="color:#FFFFFF;font-size:22px;font-weight:900;line-height:1">${value}</div>
    <div style="color:rgba(255,255,255,0.55);font-size:8.5px;font-weight:600;margin-top:2px">${sub}</div>
  </div>`;
}

function kpiBox(label, value, unit, color, borderRight) {
  return `<div style="padding:11px 12px;text-align:center${borderRight ? ';border-right:1px solid #CCCCCC' : ''}">
    <div style="font-size:7.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#999999;margin-bottom:4px">${label}</div>
    <div style="font-size:24px;font-weight:900;color:${color};letter-spacing:-0.02em;line-height:1">${value}</div>
    <div style="font-size:8px;font-weight:700;color:#BBBBBB;margin-top:2px">${unit}</div>
  </div>`;
}

function compLeg(color, label, val) {
  return `<div style="display:flex;align-items:center;gap:5px">
    <div style="width:9px;height:9px;background:${color};flex-shrink:0"></div>
    <div>
      <div style="font-size:7px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.06em">${label}</div>
      <div style="font-size:9.5px;font-weight:800;color:#1A1A1A">${val}</div>
    </div>
  </div>`;
}

function metBox(label, value, unit) {
  return `<div style="background:#F4F4F4;padding:7px 9px;border:1px solid #E0E0E0">
    <div style="font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#999;margin-bottom:2px">${label}</div>
    <div style="font-size:17px;font-weight:900;color:#1A3A4A;letter-spacing:-0.02em;line-height:1">${value}</div>
    <div style="font-size:7.5px;color:#BBBBBB;font-weight:700;margin-top:1px">${unit}</div>
  </div>`;
}

function refBar(value, min, max, color) {
  const pct    = Math.min(100, Math.max(0, (value / (max + 8)) * 100));
  const minPct = ((min / (max + 8)) * 100).toFixed(1);
  const maxPct = ((max / (max + 8)) * 100).toFixed(1);
  return `<div style="background:#E5E5E5;height:8px;position:relative;overflow:hidden">
    <div style="background:${color};width:${pct.toFixed(1)}%;height:100%;opacity:0.6"></div>
    <div style="position:absolute;left:${minPct}%;top:0;bottom:0;width:2px;background:white;opacity:0.85"></div>
    <div style="position:absolute;left:${maxPct}%;top:0;bottom:0;width:2px;background:white;opacity:0.85"></div>
  </div>`;
}

function visBar(nivel) {
  const pct = ((nivel - 1) / 19 * 100).toFixed(1);
  return `<div style="position:relative">
    <div style="display:flex;height:8px;overflow:hidden">
      <div style="flex:20;background:#2C6B44"></div>
      <div style="flex:25;background:#7A7A2A"></div>
      <div style="flex:25;background:#7A5E1A"></div>
      <div style="flex:30;background:#8A2C2C"></div>
    </div>
    <div style="position:absolute;left:${pct}%;top:-3px;transform:translateX(-50%);width:2px;height:14px;background:#1A1A1A"></div>
  </div>`;
}

function clsBadge(clase) {
  if (!clase) return '';
  const isGood = ['Normal','Muy bueno','Excelente','Atlético','Atlética','Fitness'].includes(clase);
  const isMid  = ['Promedio','Sobrepeso','Elevado'].includes(clase);
  const color = isGood ? '#2C6B44' : isMid ? '#7A5E1A' : '#8A2C2C';
  const bg    = isGood ? '#EBF3EE' : isMid ? '#F3EEE0' : '#F3E8E8';
  return `<span style="font-size:8.5px;font-weight:800;background:${bg};color:${color};padding:2px 7px;display:inline-block">${clase}</span>`;
}

function clsRow(label, value, clase) {
  const isGood = ['Normal','Muy bueno','Excelente','Atlético','Atlética','Fitness'].includes(clase);
  const isMid  = ['Promedio','Sobrepeso','Elevado'].includes(clase);
  const color = isGood ? '#2C6B44' : isMid ? '#7A5E1A' : '#8A2C2C';
  const bg    = isGood ? '#EBF3EE' : isMid ? '#F3EEE0' : '#F3E8E8';
  return `<tr>
    <td style="font-size:9.5px;font-weight:600;color:#555;padding:6px 12px;border-bottom:1px solid #EEEEEE;vertical-align:middle">${label}</td>
    <td style="font-size:9.5px;font-weight:800;color:#1A1A1A;padding:6px 8px;border-bottom:1px solid #EEEEEE;text-align:right;vertical-align:middle">${value}</td>
    <td style="padding:6px 12px;border-bottom:1px solid #EEEEEE;text-align:right;vertical-align:middle">
      ${clase ? `<span style="font-size:8px;font-weight:800;background:${bg};color:${color};padding:2px 7px;display:inline-block">${clase}</span>` : ''}
    </td>
  </tr>`;
}

// ── Trend charts ───────────────────────────────────────────────
// SVG renders lines/dots. HTML divs (absolutely positioned) render all text.

function buildTrendSection(records, cw) {
  const dates  = records.map(r => r.fecha_medicion);
  const pesoV  = records.map(r => r.peso_kg);
  const grasaV = records.map(r => r.grasa_pct);
  const muscV  = records.map(r => r.musculo_pct);
  return `
    ${miniChart(pesoV,  dates, '#1B5272', 'Peso (kg)', cw)}
    ${miniChart(grasaV, dates, '#8A2C2C', '% Grasa',   cw)}
    ${miniChart(muscV,  dates, '#2C6B44', '% Músculo', cw)}
    ${xDates(dates, cw)}`;
}

function miniChart(values, dates, color, label, cw) {
  const xPL = 30;   // left padding for Y labels
  const xPR = 6;
  const yPT = 15;   // top padding for point-value labels
  const pH  = 36;   // plot height
  const tot = yPT + pH;
  const pw  = cw - xPL - xPR;
  const n   = values.length;

  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const vR   = maxV - minV;
  const vPad = vR > 0 ? vR * 0.25 : 0.5;
  const vMin = minV - vPad;
  const vMax = maxV + vPad;
  const vSp  = vMax - vMin;

  const xOf = i => xPL + (n === 1 ? pw / 2 : (i / (n - 1)) * pw);
  const yOf = v => yPT + pH * (1 - (v - vMin) / vSp);

  const pts   = values.map((v, i) => ({ x: xOf(i), y: yOf(v), v }));
  const ticks = [minV, (minV + maxV) / 2, maxV];

  // SVG: gridlines + axis + line + dots (NO text elements)
  let svg = '';
  ticks.forEach(tv => {
    const ty = yOf(tv);
    svg += `<line x1="${xPL}" y1="${ty.toFixed(1)}" x2="${cw - xPR}" y2="${ty.toFixed(1)}" stroke="#EAEAEA" stroke-width="0.8"/>`;
  });
  svg += `<line x1="${xPL}" y1="${yPT}" x2="${xPL}" y2="${tot}" stroke="#CCCCCC" stroke-width="1"/>`;
  const lp = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  svg += `<path d="${lp}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  pts.forEach(p => {
    svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="${color}" stroke="white" stroke-width="1.5"/>`;
  });

  // HTML divs: Y-axis tick labels
  let yLbls = '';
  ticks.forEach(tv => {
    const ty = yOf(tv);
    yLbls += `<div style="position:absolute;left:0;top:${(ty - 5).toFixed(0)}px;width:${xPL - 3}px;text-align:right;font-size:6.5px;font-weight:700;color:#BBBBBB;font-family:Nunito,sans-serif;line-height:1">${utils.fmt(tv)}</div>`;
  });

  // HTML divs: value labels above each dot
  let ptLbls = '';
  pts.forEach(p => {
    ptLbls += `<div style="position:absolute;left:${(p.x - 13).toFixed(0)}px;top:${(p.y - 13).toFixed(0)}px;width:26px;text-align:center;font-size:7px;font-weight:800;color:${color};font-family:Nunito,sans-serif;line-height:1">${utils.fmt(p.v)}</div>`;
  });

  return `
    <div style="margin-bottom:7px">
      <div style="font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:${color};margin-bottom:2px;font-family:Nunito,sans-serif">${label}</div>
      <div style="position:relative;width:${cw}px;height:${tot}px">
        <svg style="position:absolute;top:0;left:0;width:${cw}px;height:${tot}px;overflow:visible">${svg}</svg>
        ${yLbls}${ptLbls}
      </div>
    </div>`;
}

function xDates(dates, cw) {
  const xPL = 30;
  const xPR = 6;
  const pw  = cw - xPL - xPR;
  const n   = dates.length;
  let lbls  = '';
  dates.forEach((d, i) => {
    const x = xPL + (n === 1 ? pw / 2 : (i / (n - 1)) * pw);
    lbls += `<div style="position:absolute;left:${(x - 15).toFixed(0)}px;top:2px;width:30px;text-align:center;font-size:6.5px;font-weight:600;color:#BBBBBB;font-family:Nunito,sans-serif;line-height:1.3">${utils.formatFechaCorta(d)}</div>`;
  });
  return `<div style="position:relative;width:${cw}px;height:18px">${lbls}</div>`;
}
