import { describe, it, expect } from 'vitest';
const u = require('../js/utils.js');

// ── calcularEdad ───────────────────────────────────────────────
describe('calcularEdad', () => {
  it('returns correct age when birthday already passed this year', () => {
    const now = new Date(2026, 3, 26); // 26 Apr 2026
    expect(u.calcularEdad('1990-01-15', now)).toBe(36);
  });

  it('returns correct age when birthday is today', () => {
    const now = new Date(2026, 3, 26);
    expect(u.calcularEdad('1990-04-26', now)).toBe(36);
  });

  it('subtracts 1 year if birthday not reached yet this year', () => {
    const now = new Date(2026, 3, 26); // 26 Apr 2026
    expect(u.calcularEdad('1990-12-01', now)).toBe(35);
  });

  it('handles same-month, future day correctly', () => {
    const now = new Date(2026, 3, 10); // 10 Apr 2026
    expect(u.calcularEdad('1990-04-26', now)).toBe(35);
  });
});

// ── formatFecha ────────────────────────────────────────────────
describe('formatFecha', () => {
  it('returns Spanish long date format', () => {
    expect(u.formatFecha('2026-04-25')).toMatch(/25/);
    expect(u.formatFecha('2026-04-25')).toMatch(/abril/i);
    expect(u.formatFecha('2026-04-25')).toMatch(/2026/);
  });
});

// ── formatFechaCorta ───────────────────────────────────────────
describe('formatFechaCorta', () => {
  it('returns uppercase date string', () => {
    const result = u.formatFechaCorta('2026-04-25');
    expect(result).toBe(result.toUpperCase());
    expect(result).toMatch(/2026/);
  });
});

// ── hoy ────────────────────────────────────────────────────────
describe('hoy', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(u.hoy()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ── masaGrasaKg ────────────────────────────────────────────────
describe('masaGrasaKg', () => {
  it('calculates correctly', () => {
    expect(u.masaGrasaKg(82.5, 22.0)).toBe(18.2); // 82.5 * 0.22 = 18.15 → 18.2
  });

  it('rounds to 1 decimal', () => {
    expect(u.masaGrasaKg(80, 25)).toBe(20.0);
  });

  it('handles zero grasa', () => {
    expect(u.masaGrasaKg(80, 0)).toBe(0);
  });
});

// ── masaMuscularKg ─────────────────────────────────────────────
describe('masaMuscularKg', () => {
  it('calculates correctly', () => {
    expect(u.masaMuscularKg(82.5, 38.0)).toBe(31.4); // 82.5 * 0.38 = 31.35 → 31.4
  });

  it('rounds to 1 decimal', () => {
    expect(u.masaMuscularKg(100, 40)).toBe(40.0);
  });
});

// ── masaLibreDeGrasa ───────────────────────────────────────────
describe('masaLibreDeGrasa', () => {
  it('equals peso minus masa grasa', () => {
    const peso = 82.5;
    const grasaPct = 22.0;
    const grasa = u.masaGrasaKg(peso, grasaPct);
    const expected = Math.round((peso - grasa) * 10) / 10;
    expect(u.masaLibreDeGrasa(peso, grasaPct)).toBe(expected);
  });

  it('is greater than zero for normal values', () => {
    expect(u.masaLibreDeGrasa(80, 30)).toBeGreaterThan(0);
  });
});

// ── masaOseaKg ────────────────────────────────────────────────
describe('masaOseaKg', () => {
  it('uses factor 0.191 for male', () => {
    expect(u.masaOseaKg(64.4, 'M')).toBe(Math.round(64.4 * 0.191 * 10) / 10);
  });

  it('uses factor 0.161 for female', () => {
    expect(u.masaOseaKg(50, 'F')).toBe(Math.round(50 * 0.161 * 10) / 10);
  });
});

// ── indiceMasaMagra ────────────────────────────────────────────
describe('indiceMasaMagra', () => {
  it('calculates IMM = MLG / (estatura_m)^2', () => {
    const mlg = 64.3;
    const estCm = 175;
    const estM = 175 / 100;
    const expected = Math.round(mlg / (estM * estM) * 10) / 10;
    expect(u.indiceMasaMagra(mlg, estCm)).toBe(expected);
  });
});

// ── proteinaKg ────────────────────────────────────────────────
describe('proteinaKg', () => {
  it('equals musculo * 0.20', () => {
    expect(u.proteinaKg(31.4)).toBe(Math.round(31.4 * 0.20 * 10) / 10);
  });

  it('rounds to 1 decimal', () => {
    expect(u.proteinaKg(30)).toBe(6.0);
  });
});

// ── getSedentario ─────────────────────────────────────────────
describe('getSedentario', () => {
  it('returns tmb * 1.2 rounded to integer', () => {
    expect(u.getSedentario(1850)).toBe(Math.round(1850 * 1.2));
  });

  it('is an integer', () => {
    expect(Number.isInteger(u.getSedentario(1850))).toBe(true);
  });
});

// ── getModerado ───────────────────────────────────────────────
describe('getModerado', () => {
  it('returns tmb * 1.55 rounded to integer', () => {
    expect(u.getModerado(1850)).toBe(Math.round(1850 * 1.55));
  });

  it('is an integer', () => {
    expect(Number.isInteger(u.getModerado(1850))).toBe(true);
  });
});

// ── calcularDelta ─────────────────────────────────────────────
describe('calcularDelta', () => {
  it('calculates negative delta (decrease)', () => {
    expect(u.calcularDelta(82.5, 83.7)).toBe(-1.2);
  });

  it('calculates positive delta (increase)', () => {
    expect(u.calcularDelta(83.7, 82.5)).toBe(1.2);
  });

  it('returns 0 when equal', () => {
    expect(u.calcularDelta(82.5, 82.5)).toBe(0);
  });

  it('rounds to 1 decimal', () => {
    expect(u.calcularDelta(22.0, 22.4)).toBe(-0.4);
  });
});

// ── formatDelta ───────────────────────────────────────────────
describe('formatDelta', () => {
  it('returns sin cambio for zero delta', () => {
    const r = u.formatDelta(0);
    expect(r.text).toBe('— sin cambio');
    expect(r.clase).toBe('delta-neu');
  });

  it('lower-is-better: negative delta is good', () => {
    const r = u.formatDelta(-1.2, 'lower-is-better');
    expect(r.clase).toBe('delta-good');
    expect(r.text).toMatch(/↓/);
    expect(r.text).toMatch(/1\.2/);
  });

  it('lower-is-better: positive delta is bad', () => {
    const r = u.formatDelta(0.5, 'lower-is-better');
    expect(r.clase).toBe('delta-bad');
    expect(r.text).toMatch(/↑/);
  });

  it('higher-is-better: positive delta is good', () => {
    const r = u.formatDelta(0.3, 'higher-is-better');
    expect(r.clase).toBe('delta-good');
    expect(r.text).toMatch(/↑/);
  });

  it('higher-is-better: negative delta is bad', () => {
    const r = u.formatDelta(-0.5, 'higher-is-better');
    expect(r.clase).toBe('delta-bad');
    expect(r.text).toMatch(/↓/);
  });

  it('defaults to lower-is-better when no direction given', () => {
    const r = u.formatDelta(-1);
    expect(r.clase).toBe('delta-good');
  });
});

// ── clasificarIMC ─────────────────────────────────────────────
describe('clasificarIMC', () => {
  it('classifies correctly', () => {
    expect(u.clasificarIMC(17)).toBe('Bajo peso');
    expect(u.clasificarIMC(22)).toBe('Normal');
    expect(u.clasificarIMC(27)).toBe('Sobrepeso');
    expect(u.clasificarIMC(32)).toBe('Obesidad I');
    expect(u.clasificarIMC(37)).toBe('Obesidad II');
    expect(u.clasificarIMC(42)).toBe('Obesidad III');
  });

  it('boundary 18.5 is Normal', () => {
    expect(u.clasificarIMC(18.5)).toBe('Normal');
  });

  it('boundary 25 is Sobrepeso', () => {
    expect(u.clasificarIMC(25)).toBe('Sobrepeso');
  });
});

// ── clasificarGrasa ───────────────────────────────────────────
describe('clasificarGrasa', () => {
  it('classifies male body fat correctly', () => {
    expect(u.clasificarGrasa(5, 'M')).toBe('Esencial');
    expect(u.clasificarGrasa(10, 'M')).toBe('Atlético');
    expect(u.clasificarGrasa(16, 'M')).toBe('Fitness');
    expect(u.clasificarGrasa(20, 'M')).toBe('Promedio');
    expect(u.clasificarGrasa(30, 'M')).toBe('Obeso');
  });

  it('classifies female body fat correctly', () => {
    expect(u.clasificarGrasa(13, 'F')).toBe('Esencial');
    expect(u.clasificarGrasa(18, 'F')).toBe('Atlética');
    expect(u.clasificarGrasa(23, 'F')).toBe('Fitness');
    expect(u.clasificarGrasa(28, 'F')).toBe('Promedio');
    expect(u.clasificarGrasa(35, 'F')).toBe('Obesa');
  });
});

// ── clasificarGrasaVisceral ───────────────────────────────────
describe('clasificarGrasaVisceral', () => {
  it('classifies visceral fat level', () => {
    expect(u.clasificarGrasaVisceral(1)).toBe('Normal');
    expect(u.clasificarGrasaVisceral(9)).toBe('Normal');
    expect(u.clasificarGrasaVisceral(10)).toBe('Elevado');
    expect(u.clasificarGrasaVisceral(14)).toBe('Elevado');
    expect(u.clasificarGrasaVisceral(15)).toBe('Muy elevado');
    expect(u.clasificarGrasaVisceral(20)).toBe('Muy elevado');
  });
});

// ── clasificarBodyAge ─────────────────────────────────────────
describe('clasificarBodyAge', () => {
  it('classifies body age vs real age', () => {
    expect(u.clasificarBodyAge(30, 40)).toBe('Excelente');  // diff = -10
    expect(u.clasificarBodyAge(38, 40)).toBe('Muy bueno');  // diff = -2
    expect(u.clasificarBodyAge(40, 40)).toBe('Muy bueno');  // diff = 0
    expect(u.clasificarBodyAge(43, 40)).toBe('Normal');     // diff = 3
    expect(u.clasificarBodyAge(47, 40)).toBe('Por mejorar'); // diff = 7
  });
});

// ── calcularMetricas ──────────────────────────────────────────
describe('calcularMetricas', () => {
  const m = {
    peso_kg: 82.5,
    grasa_pct: 22.0,
    musculo_pct: 38.0,
    tmb_kcal: 1850,
    body_age: 38,
    grasa_visceral: 8,
    imc: 27.0
  };
  const p = {
    sexo: 'M',
    estatura_cm: 175,
    fecha_nacimiento: '1990-04-26'
  };

  let result;
  it('returns all derived metrics', () => {
    result = u.calcularMetricas(m, p);
    expect(result).toHaveProperty('mlg');
    expect(result).toHaveProperty('grasa');
    expect(result).toHaveProperty('musculo');
    expect(result).toHaveProperty('osea');
    expect(result).toHaveProperty('imm');
    expect(result).toHaveProperty('prot');
    expect(result).toHaveProperty('getSed');
    expect(result).toHaveProperty('getMod');
    expect(result).toHaveProperty('edad');
    expect(result).toHaveProperty('claseIMC');
    expect(result).toHaveProperty('claseGrasa');
    expect(result).toHaveProperty('claseGrasaV');
    expect(result).toHaveProperty('claseBodyAge');
  });

  it('grasa equals masaGrasaKg(82.5, 22.0)', () => {
    const r = u.calcularMetricas(m, p);
    expect(r.grasa).toBe(u.masaGrasaKg(82.5, 22.0));
  });

  it('getSed equals getSedentario(1850)', () => {
    const r = u.calcularMetricas(m, p);
    expect(r.getSed).toBe(u.getSedentario(1850));
  });

  it('claseGrasaV is Normal for nivel 8', () => {
    const r = u.calcularMetricas(m, p);
    expect(r.claseGrasaV).toBe('Normal');
  });
});

// ── fmt ───────────────────────────────────────────────────────
describe('fmt', () => {
  it('formats with 1 decimal by default', () => {
    // JS floating-point: 18.15.toFixed(1) → '18.1' (not '18.2')
    expect(u.fmt(18.15)).toBe('18.1');
    expect(u.fmt(18.25)).toBe('18.3');
  });

  it('removes trailing zero when result is integer', () => {
    expect(u.fmt(20.0, 1)).toBe('20');
  });

  it('formats with 0 decimals', () => {
    expect(u.fmt(2220, 0)).toBe('2220');
  });
});
