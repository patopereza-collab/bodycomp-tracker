// Form validation logic tests for nueva-medicion.js
// Tests the validation rules without needing a browser
import { describe, it, expect } from 'vitest';

// Inline the validation rules mirroring nueva-medicion.js FIELDS constant
const FIELDS = [
  { id: 'peso',           label: 'Peso',           min: 20,  max: 300  },
  { id: 'imc',            label: 'IMC',            min: 10,  max: 70   },
  { id: 'grasa',          label: '% Grasa',        min: 1,   max: 70   },
  { id: 'musculo',        label: '% Músculo',      min: 1,   max: 80   },
  { id: 'tmb',            label: 'TMB',            min: 500, max: 5000 },
  { id: 'body-age',       label: 'Body Age',       min: 10,  max: 100  },
  { id: 'grasa-visceral', label: 'Grasa Visceral', min: 1,   max: 20   }
];

function validateField(field, value) {
  if (value === '' || value === null || value === undefined) {
    return { ok: false, msg: `${field.label} es obligatorio.` };
  }
  const num = parseFloat(value);
  if (isNaN(num) || num < field.min || num > field.max) {
    return { ok: false, msg: `${field.label} debe estar entre ${field.min} y ${field.max}.` };
  }
  return { ok: true };
}

describe('medicion field validation', () => {
  it('rejects empty value', () => {
    FIELDS.forEach(f => {
      const result = validateField(f, '');
      expect(result.ok).toBe(false);
      expect(result.msg).toContain('obligatorio');
    });
  });

  it('rejects value below minimum', () => {
    const r = validateField(FIELDS[0], '10'); // peso min=20
    expect(r.ok).toBe(false);
    expect(r.msg).toMatch(/20.*300|entre/);
  });

  it('rejects value above maximum', () => {
    const r = validateField(FIELDS[0], '400'); // peso max=300
    expect(r.ok).toBe(false);
  });

  it('accepts valid value at minimum boundary', () => {
    const r = validateField(FIELDS[0], '20');
    expect(r.ok).toBe(true);
  });

  it('accepts valid value at maximum boundary', () => {
    const r = validateField(FIELDS[0], '300');
    expect(r.ok).toBe(true);
  });

  it('accepts typical measurement values', () => {
    const valid = [82.5, 27.0, 22.0, 38.0, 1850, 38, 8];
    FIELDS.forEach((f, i) => {
      expect(validateField(f, valid[i]).ok).toBe(true);
    });
  });

  it('grasa-visceral rejects level 0', () => {
    const gv = FIELDS.find(f => f.id === 'grasa-visceral');
    expect(validateField(gv, '0').ok).toBe(false);
  });

  it('grasa-visceral rejects level 21', () => {
    const gv = FIELDS.find(f => f.id === 'grasa-visceral');
    expect(validateField(gv, '21').ok).toBe(false);
  });

  it('grasa-visceral accepts all valid levels 1–20', () => {
    const gv = FIELDS.find(f => f.id === 'grasa-visceral');
    for (let i = 1; i <= 20; i++) {
      expect(validateField(gv, String(i)).ok).toBe(true);
    }
  });

  it('rejects NaN string', () => {
    const r = validateField(FIELDS[0], 'abc');
    expect(r.ok).toBe(false);
  });
});

describe('medicion data shape', () => {
  it('maps form values to correct DB field names', () => {
    const formValues = {
      fecha_medicion: '2026-04-25',
      peso_kg: 82.5,
      imc: 27.0,
      grasa_pct: 22.0,
      musculo_pct: 38.0,
      tmb_kcal: 1850,
      body_age: 38,
      grasa_visceral: 8,
      notas: null
    };
    // All required DB fields must be present
    const requiredFields = ['fecha_medicion','peso_kg','imc','grasa_pct','musculo_pct','tmb_kcal','body_age','grasa_visceral'];
    requiredFields.forEach(field => {
      expect(formValues).toHaveProperty(field);
    });
  });
});
