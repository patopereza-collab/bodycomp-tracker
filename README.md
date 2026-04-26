# BodyComp Tracker

Aplicación web personal para registrar y visualizar la evolución de composición corporal medida con balanza de bioimpedancia.

**Stack:** HTML + CSS + JS vanilla · Supabase (Auth + DB + Storage) · Netlify

---

## Setup local

### 1. Clonar el repositorio

```bash
git clone https://github.com/<tu-usuario>/bodycomp-tracker.git
cd bodycomp-tracker
npm install
```

### 2. Configurar Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com) → región **South America (São Paulo)**
2. Ir a **Project Settings → API** y copiar:
   - `Project URL`
   - `anon public key`
3. Crear el archivo `.env` en la raíz:

```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
```

4. Editar `js/supabase.js` y reemplazar los valores:
```js
const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co';
const SUPABASE_KEY = 'eyJhbGci...';
```

### 3. Ejecutar el SQL en Supabase

Ir a **SQL Editor** en el dashboard de Supabase y ejecutar el contenido del archivo `sql/schema.sql` (o el SQL del SDD §3.4).

### 4. Crear el bucket de Storage

En Supabase → **Storage → New Bucket**:
- Nombre: `pdf-reports`
- Público: **SÍ**

### 5. Correr localmente

```bash
npx serve . -p 3000
# Abrir http://localhost:3000
```

### 6. Tests

```bash
npm test           # Unit tests (Vitest)
npm run test:ui    # E2E tests (Playwright) — requiere servidor corriendo
npm run test:all   # Ambos
```

---

## Deploy en Netlify

1. Ir a [app.netlify.com](https://app.netlify.com) → **Add new site → Import from GitHub**
2. Seleccionar el repo `bodycomp-tracker`
3. Build settings:
   - **Build command:** (vacío)
   - **Publish directory:** `.`
4. **Site Settings → Environment Variables:**
   - `SUPABASE_URL` = tu project URL
   - `SUPABASE_ANON_KEY` = tu anon key

> Nota: las variables de entorno de Netlify **no se inyectan automáticamente** en HTML estático. Luego de configurarlas en Netlify, editar `js/supabase.js` con los valores reales antes del deploy.

5. Click **Deploy site**

Cada `git push` a `main` dispara un nuevo deploy automático en ~30 segundos.

---

## Estructura del proyecto

```
bodycomp-tracker/
├── index.html              # Login / Registro
├── historial.html          # Historial de mediciones
├── nueva-medicion.html     # Formulario nueva medición
├── progreso.html           # Gráficos de progreso
├── perfil.html             # Perfil del usuario
├── css/styles.css          # Design tokens + estilos globales
├── js/
│   ├── supabase.js         # Cliente Supabase + helpers
│   ├── auth.js             # Guard de sesión
│   ├── utils.js            # Cálculos de composición corporal
│   ├── historial.js
│   ├── nueva-medicion.js
│   ├── progreso.js
│   ├── perfil.js
│   └── pdf-report.js       # Generación PDF (jsPDF + html2canvas)
├── tests/
│   ├── utils.test.js       # Unit tests (Vitest)
│   ├── medicion.test.js    # Form validation tests
│   └── ui.spec.js          # E2E tests (Playwright)
└── netlify.toml
```
