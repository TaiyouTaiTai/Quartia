# Plan de implementación — Frontend (React) integrado

Objetivo: una app en React para **demostrar el diseño** de Quartia: subir o crear
una tabla, calcular estadísticos y ver gráficas, con el **hover educativo**
(fórmula, símbolos, números sustituidos, pasos y celdas usadas).

No es un producto formal, así que se prioriza lo simple: un solo repo, un solo
despliegue y pocas dependencias.

---

## 1. Decisiones

| Tema | Decisión | Por qué |
|---|---|---|
| Ubicación | Carpeta `web/` dentro de este repo | Es una demo; un repo y un despliegue |
| Herramienta | React + Vite | `CORS_ORIGIN` ya apunta a `:5173`; build estático rápido |
| Lenguaje | JavaScript (no TypeScript) | Igual que el backend; menos fricción |
| Rutas | `react-router-dom` | Login, lista de datasets, detalle, análisis |
| Gráficas | `recharts` | El backend ya entrega `config.datos` listo para Recharts |
| Fórmulas | `katex` | `formula_latex` y `simbolo_latex` vienen del catálogo |
| Estilos | CSS plano con variables (o CSS Modules) | Sin librería de UI; fácil de adaptar al diseño |
| Datos/API | `fetch` con un pequeño cliente propio | Suficiente para una demo; sin TanStack Query por ahora |
| Sesión | Token JWT en `localStorage` + `Authorization: Bearer` | Es lo que espera `src/middlewares/auth.js` |

**Pendiente de decidir (antes de la fase 3):** ¿hay maqueta/diseño (Figma, capturas)
que seguir, o se arranca con un estilo base y luego se adapta?

---

## 2. Estructura

```
Quartia/
├── src/                     backend (ya existe)
├── web/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js       proxy /api → http://localhost:3000
│   └── src/
│       ├── main.jsx         router + proveedor de sesión
│       ├── api/cliente.js   fetch con token, manejo de errores { error, detalles }
│       ├── api/*.js         auth, datasets, calculos, graficas, analisis, catalogo
│       ├── sesion/          contexto de usuario, ruta protegida
│       ├── paginas/         Login, Registro, Datasets, Dataset, Analisis
│       ├── componentes/     TablaDatos, PanelCalculos, TarjetaResultado,
│       │                    HoverExplicacion, Formula (KaTeX), graficas/*
│       └── estilos/
├── docs/plan-frontend.md    este archivo
└── package.json             scripts que orquestan backend + web
```

---

## 3. Fases

### Fase 0 — Integración con el backend
- [x] Crear `web/` (React 19 + Vite 8, sin plantilla: `index.html`, `src/main.jsx`, `src/App.jsx`, `src/estilos/base.css` con los colores y fuentes aprobados).
- [x] `web/vite.config.js`: `server.proxy['/api'] = 'http://localhost:3000'`
      (en desarrollo todo es mismo origen, CORS no interviene).
- [x] `src/app.js`, **después** de las rutas `/api`:
  - `express.static(env.WEB_DIST)` (por defecto `web/dist`; sin build no encuentra nada y sigue de largo).
  - Fallback SPA: cualquier `GET` que **no** empiece con `/api` → `index.html`.
  - El 404 JSON queda al final: solo lo alcanzan `/api/*` inexistentes (o todo, si aún no hay build).
- [x] Scripts en el `package.json` raíz:
  - `dev:web` → `npm --prefix web run dev`
  - `build` → `npm --prefix web ci && npm --prefix web run build`
  - `start` sigue siendo `node src/server.js`.
- [x] `.gitignore`: `web/dist/` y `web/node_modules/` ya quedan cubiertos por `dist/` y `node_modules/` (verificado).
- [x] Prueba en `test/app.test.js`: `/api/ruta-inexistente` sigue dando 404 JSON
      y `/datasets/1` devuelve el `index.html` cuando existe el build.

**Listo cuando:** `npm run dev` + `npm run dev:web` abren la app en `:5173`
y una llamada a `/api/health` desde React responde `{ ok: true }`.

### Fase 1 — Sesión
- [x] `api/cliente.js`: agrega el token, convierte errores del backend
      (`error`, `detalles[]` de zod) en mensajes para formularios; en 401 cierra sesión.
- [x] Páginas **Registro** y **Login** (`POST /api/auth/registro`, `/api/auth/login`).
- [x] Contexto de sesión: al cargar, `GET /api/auth/me` para validar el token guardado.
- [x] Ruta protegida que redirige a `/login`; botón de cerrar sesión.
- [x] Mostrar el 429 del límite de intentos ("Espera unos minutos…").

### Fase 2 — Datasets
- [x] **Lista** (`GET /api/datasets`): título, origen, filas × columnas, fecha; borrar (`DELETE`).
- [x] **Subir archivo** `.xlsx`/`.csv` (`POST /api/datasets/archivo`, multipart,
      campo `archivo`, opcional `titulo`). Mostrar `avisos` que devuelve el backend.
- [x] **Crear tabla en la app** (`POST /api/datasets`): editor simple de
      columnas/filas o pegar desde Excel (texto separado por tabuladores).
- [x] **Detalle** (`GET /api/datasets/:id`): tabla de datos + encabezado de cada
      columna con tipo, escala y naturaleza.
- [x] Corregir columna (`PATCH /api/datasets/:id/columnas/:columnaId`): nombre,
      escala, unidad, decimales. Recargar permisos después de cambiar la escala.

### Fase 3 — Cálculos y hover educativo (el corazón de la demo)
- [x] **Panel de cálculos** por columna: checkboxes con `estadisticos_permitidos`
      de esa columna; parámetro para `cuartil` (1–3), `decil` (1–9), `percentil` (1–99);
      opciones `agrupado`, `metodo_clases` (sturges | raiz | scott), `poblacional`.
- [x] Enviar `POST /api/calculos`; mostrar `errores` (motivo del catálogo, p. ej.
      "la media no aplica a una columna nominal") y `avisos`.
- [x] Cargar el catálogo una vez (`GET /api/definiciones`) y guardarlo en memoria.
- [x] **TarjetaResultado**: nombre + valor (`valor_num`, `valor_txt` o `valor_json`).
- [x] **HoverExplicacion** (al pasar el mouse o tocar la tarjeta), según el contrato
      de `estadistica-visual/docs/plan-db-mvp.md` §6:
  - Fórmula con KaTeX (`sustitucion.formula_latex`).
  - Qué significa cada símbolo (`simbolos` del catálogo).
  - Números sustituidos (`sustitucion.variables`, `sustitucion.resultado`).
  - Paso a paso (`pasos[]`: `texto`, `expresion`, `resultado`).
  - "Cuándo usar" y "error común" (`cuando_usar`, `malinterpretacion`).
- [x] **Resaltar en la tabla** las celdas usadas (`datos_usados.filas`) y marcar las
      excluidas con su motivo (`datos_usados.excluidos`).
- [x] `resumen_caja` (`valor_json`): mostrarlo como mini tabla min/Q1/mediana/Q3/max/RIQ/atípicos.

### Fase 4 — Gráficas
Se piden con `POST /api/graficas`; cada respuesta trae `config` con `titulo`,
`ejes`, `datos` y `como_leer` (mostrar `como_leer` siempre debajo de la gráfica).

- [ ] Selector con `graficas_permitidas` de la columna.
- [ ] `histograma` → `BarChart` sin espacio entre barras (`barCategoryGap={0}`),
      eje X con `lim_inf–lim_sup`.
- [ ] `poligono` y `ojiva` → `LineChart` con `datos: [{ x, y }]`.
- [ ] `barras` → `BarChart`; `pastel` → `PieChart`.
- [ ] `dispersion` → `ScatterChart` (pedir segunda columna: `columna_b_id`).
- [ ] `caja` → **componente propio** (Recharts no trae diagrama de caja): SVG simple
      con caja Q1–Q3, línea de mediana, bigotes y puntos atípicos.
- [ ] Opción `metodo_clases` para histograma/polígono/ojiva.

### Fase 5 — Historial de análisis
- [ ] En el detalle del dataset: `GET /api/datasets/:id/analisis` (nombre, fecha,
      cuántos resultados y gráficas).
- [ ] Página de análisis (`GET /api/analisis/:id`): resultados con hover + gráficas guardadas.
- [ ] Agregar más cálculos/gráficas al mismo análisis (`analisis_id` en los POST).
- [ ] Borrar análisis (`DELETE /api/analisis/:id`).
- [ ] Aviso al reemplazar datos (`PUT /api/datasets/:id`): borra los análisis anteriores.

### Fase 6 — Pulido y despliegue
- [ ] Estados de carga, vacío y error en cada página; diseño usable en celular.
- [ ] Aplicar el diseño del equipo (colores, tipografía, logo).
- [ ] Desplegar en **Railway**: servicio Node + MySQL en el mismo proyecto.
  - Build: `npm ci && npm run build` · Start: `npm start`.
  - Variables según `.env.production.example`, con un **`JWT_SECRET` nuevo**.
  - `CORS_ORIGIN` = dominio de Railway (obligatorio con `NODE_ENV=production`,
    aunque al ser mismo origen el navegador no lo use).
  - Cargar `schema.sql` y correr `npm run seed` contra la base de producción.
- [ ] Actualizar el README con cómo correr y desplegar el frontend.

---

## 4. Orden sugerido para mañana

1. Fase 0 completa (integración y scripts): es la base de todo.
2. Fase 1 (sesión) para poder llamar a los endpoints protegidos.
3. Empezar Fase 2 con la lista y la subida de archivo.

Las fases 3 y 4 son las que más lucen en la demo; si el tiempo apremia,
hacer la 3 antes que la 2 completa (basta con subir un archivo).

## 5. Riesgos

- **Tablas grandes** (hasta 50 000 filas): renderizar solo las primeras ~200 filas
  o paginar; si no, el navegador se congela.
- **Plan gratis de hosting**: el servidor puede "dormirse" y la primera petición
  tarda unos segundos; avisarlo al presentar la demo o abrir la app antes.
- **KaTeX**: si una fórmula del catálogo tiene LaTeX inválido, mostrar el texto
  (`formula_texto`) en vez de romper la tarjeta (`throwOnError: false`).
