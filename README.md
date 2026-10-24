# Quartia

Estadística **visual y didáctica**: subes un Excel o CSV (o creas la tabla en la
app), calculas y graficas, y cada resultado explica cómo salió — la fórmula, los
números sustituidos, el paso a paso y las celdas usadas, siguiendo el *contrato
del hover* de `estadistica-visual/docs/plan-db-mvp.md`.

Una sola app: API en Node.js/Express (`src/`) y frontend en React (`web/`), que
en producción se sirven juntos desde el mismo servidor.

## Requisitos

- Node.js 20 o superior
- MySQL 8.0+ con el esquema de `estadistica-visual/db/schema.sql` (repo hermano, por defecto en `../../estadistica-visual`)

## Puesta en marcha

```bash
npm install
cp .env.example .env        # rellena tus datos (JWT_SECRET de al menos 32 caracteres)
npm run db:check            # comprueba la conexión a MySQL
npm run seed                # carga el catálogo didáctico (definiciones, símbolos, escalas, glosario)
npm run dev                 # servidor con recarga automática
npm test                    # pruebas (no necesitan MySQL)
```

### Frontend (React, carpeta `web/`)

```bash
npm --prefix web install    # la primera vez
npm run dev                 # terminal 1: API en :3000
npm run dev:web             # terminal 2: app en http://localhost:5173 (pasa /api a :3000)
```

En producción, `npm run build` compila el frontend en `web/dist` y `npm start`
sirve la app y la API juntas en el mismo puerto. El plan está en
`docs/plan-frontend.md` y el diseño aprobado en `docs/diseno/`.

`npm run seed` lee el catálogo desde `CATALOGO_PATH` (ver `.env.example`) o desde
una ruta: `npm run seed -- ../../estadistica-visual/db/seed/catalogo.json`. Se puede
correr las veces que quieras: actualiza en vez de duplicar.

## Estructura

```
src/                       ── API ──
├── server.js              arranque (listen + apagado ordenado)
├── app.js                 middlewares y rutas
├── config/                env (validado con zod) y pool de MySQL
├── middlewares/           auth JWT, validación, errores, límite de intentos
├── routes/                endpoints HTTP (solo orquestan)
├── services/
│   ├── lectura.js         Excel/CSV/tabla → datos_json + detección de tipo/escala (puro)
│   ├── dataset.service.js guardar/leer datasets
│   ├── catalogo.service.js catálogo didáctico en memoria
│   ├── permisos.js        qué cálculos tienen sentido según tipo y escala (puro)
│   ├── calculo.service.js ejecuta los estadísticos pedidos (puro)
│   └── analisis.service.js guardar/leer análisis, resultados y gráficas
├── calculos/              fórmulas + paso a paso (funciones puras)
└── graficas/              datos para Recharts/Chart.js
scripts/seed.js            carga catalogo.json en la base
test/                      pruebas con node --test

web/src/                   ── Frontend (React + Vite) ──
├── App.jsx                rutas (las páginas pesadas se cargan bajo demanda)
├── api/                   cliente de la API (token, errores por campo) y hooks
├── sesion/                login, registro y rutas protegidas
├── paginas/               Mis tablas, Crear/Editar tabla, Detalle (calcular, graficar, historial)
├── componentes/           tabla de datos, panel de cálculo, explicación, gráficas…
├── estilos/               sistema visual "papel, grafito y tinta azul"
└── textos.js              nombres para mostrar y formato de números
docs/                      plan del frontend y diseño aprobado
```

## Endpoints

Todos bajo `/api`. Los marcados con 🔒 necesitan `Authorization: Bearer <token>`.

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/auth/registro` | `{ correo, nombre, clave }` → `{ token, usuario }` |
| POST | `/auth/login` | `{ correo, clave }` → `{ token, usuario }` |
| GET 🔒 | `/auth/me` | usuario actual |
| POST 🔒 | `/datasets/archivo` | subir `.xlsx` o `.csv` (multipart, campo `archivo`, opcional `titulo`) |
| POST 🔒 | `/datasets` | crear tabla en la app: `{ titulo, columnas: [...], filas: [[...]] }` |
| GET 🔒 | `/datasets` | listar mis datasets |
| GET 🔒 | `/datasets/:id` | datos + columnas con `estadisticos_permitidos` y `graficas_permitidas` |
| PUT 🔒 | `/datasets/:id` | reemplazar los datos (borra los análisis anteriores) |
| DELETE 🔒 | `/datasets/:id` | borrar |
| PATCH 🔒 | `/datasets/:id/columnas/:columnaId` | corregir `nombre`, `escala`, `unidad` o `decimales` |
| GET 🔒 | `/datasets/:id/analisis` | historial de análisis |
| POST 🔒 | `/calculos` | calcular y guardar (ver abajo) |
| POST 🔒 | `/graficas` | generar y guardar una gráfica (ver abajo) |
| GET 🔒 | `/analisis/:id` | resultados (con hover) y gráficas de un análisis |
| DELETE 🔒 | `/analisis/:id` | borrar un análisis |
| GET | `/definiciones`, `/definiciones/:clave`, `/glosario` | catálogo didáctico |
| GET | `/health` | estado del servidor y la base |

### Calcular

```jsonc
POST /api/calculos
{
  "dataset_id": 1,
  "columna_id": 3,
  "estadisticos": ["media", "mediana", { "clave": "cuartil", "parametro": 3 }],
  "agrupado": false,          // true → media/mediana/moda con tabla de frecuencias
  "metodo_clases": "sturges", // sturges | raiz | scott
  "poblacional": false,       // varianza/desviación: n en vez de n-1
  "analisis_id": 7            // opcional: agrega a un análisis existente
}
```

Respuesta: `{ analisis, errores, avisos }`. Cada resultado de `analisis.resultados`
trae `sustitucion`, `pasos` y `datos_usados`. Si un estadístico no aplica (ej. media
de una columna nominal) va a `errores` con el motivo del catálogo; los demás se
calculan igual.

Estadísticos: `media`, `mediana`, `moda`, `rango`, `varianza`, `desviacion_estandar`,
`coeficiente_variacion`, `cuartil` (1–3), `decil` (1–9), `percentil` (1–99),
`resumen_caja`. Cada uno debe existir en el catálogo (`definicion_estadistico.clave`).

### Gráficas

```jsonc
POST /api/graficas
{ "dataset_id": 1, "tipo": "histograma", "columna_id": 3 }
```

Tipos: `histograma`, `poligono`, `ojiva`, `caja`, `barras`, `pastel`, `dispersion`
(esta última necesita `columna_b_id`). Cada una incluye un texto `como_leer`.
