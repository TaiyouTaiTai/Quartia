import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, ScatterChart, Scatter, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { numero } from '../textos.js';

// Colores de las gráficas (ver docs/diseno). Una sola serie → tinta azul.
// La paleta categórica (solo pastel) pasó el validador de color: separación
// para daltonismo, contraste ≥ 3:1 sobre la hoja y orden fijo, nunca rotado.
const TINTA = '#3E5C76';
const HOJA = '#FBF8F2';
const CATEGORICA = ['#2F5FA8', '#C2622D', '#008F8A', '#A9851A', '#94508F', '#5B8A2E'];
const OTRAS = '#9A9184';
const MAX_REBANADAS = 6;

const ejeX = { stroke: '#D6CBB8', tick: { fill: '#6B645A', fontSize: 12 }, tickLine: false };
const ejeY = { ...ejeX, axisLine: false, width: 48, allowDecimals: false };
const rejilla = <CartesianGrid stroke="#E6DCCB" vertical={false} />;
const etiquetaEje = (texto, eje) =>
  eje === 'x'
    ? { value: texto, position: 'insideBottom', offset: -4, fill: '#6B645A', fontSize: 13 }
    : { value: texto, angle: -90, position: 'insideLeft', offset: 10, fill: '#6B645A', fontSize: 13, style: { textAnchor: 'middle' } };

// Tooltip con el estilo de la app: texto en tinta de texto, nunca del color de la serie
function Globo({ active, payload, filas }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="globo">
      {filas(payload[0].payload).map(([k, v]) => (
        <p key={k}><span className="secundario">{k}</span> <strong>{v}</strong></p>
      ))}
    </div>
  );
}
const globo = (filas) => <Tooltip cursor={{ fill: 'rgba(62, 92, 118, 0.08)' }} content={<Globo filas={filas} />} />;

// Puntos de las líneas: ≥ 8px con anillo del color de la hoja
const punto = { r: 4, fill: TINTA, stroke: HOJA, strokeWidth: 2 };

function Histograma({ config, d }) {
  const datos = config.datos.map(c => ({ ...c, clase: `${numero(c.lim_inf, d)}–${numero(c.lim_sup, d)}` }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={datos} barCategoryGap={2} margin={{ top: 8, right: 8, bottom: 24, left: 8 }}>
        {rejilla}
        <XAxis dataKey="clase" {...ejeX} label={etiquetaEje(config.ejes.x, 'x')} />
        <YAxis {...ejeY} label={etiquetaEje(config.ejes.y, 'y')} />
        {globo(c => [['Clase', c.clase], ['Frecuencia', c.fi], ['Porcentaje', `${numero(c.porcentaje, 1)} %`]])}
        <Bar dataKey="fi" fill={TINTA} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Linea({ config, d, ojiva }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={config.datos} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
        {rejilla}
        <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} {...ejeX} label={etiquetaEje(config.ejes.x, 'x')} />
        <YAxis {...ejeY} label={etiquetaEje(config.ejes.y, 'y')} />
        {globo(p => [
          [ojiva ? 'Hasta' : 'Marca de clase', numero(p.x, d)],
          [ojiva ? 'Acumulado' : 'Frecuencia', p.y],
          ...(ojiva ? [['Porcentaje acumulado', `${numero(p.Hi * 100, 1)} %`]] : [])
        ])}
        <Line dataKey="y" stroke={TINTA} strokeWidth={2} dot={punto} activeDot={{ ...punto, r: 6 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function Barras({ config }) {
  const datos = config.datos.map(c => ({ ...c, categoria: String(c.categoria) }));
  // Muchas categorías o nombres largos no caben bajo barras verticales: van horizontales
  const muchas = datos.length > 6 || datos.some(c => c.categoria.length > 10);
  const filas = c => [['Categoría', c.categoria], ['Frecuencia', c.frecuencia], ['Porcentaje', `${numero(c.porcentaje, 1)} %`]];
  if (muchas) {
    return (
      <ResponsiveContainer width="100%" height={Math.max(240, datos.length * 30)}>
        <BarChart data={datos} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="#E6DCCB" horizontal={false} />
          <XAxis type="number" {...ejeX} allowDecimals={false} />
          <YAxis type="category" dataKey="categoria" {...ejeX} width={120} />
          {globo(filas)}
          <Bar dataKey="frecuencia" fill={TINTA} radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={datos} margin={{ top: 8, right: 8, bottom: 24, left: 8 }}>
        {rejilla}
        <XAxis dataKey="categoria" {...ejeX} label={etiquetaEje(config.ejes.x, 'x')} />
        <YAxis {...ejeY} label={etiquetaEje(config.ejes.y, 'y')} />
        {globo(filas)}
        <Bar dataKey="frecuencia" fill={TINTA} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Más de 6 rebanadas ya no se leen: las más chicas se juntan en "Otras"
function rebanadas(datos) {
  const orden = [...datos].sort((a, b) => b.frecuencia - a.frecuencia);
  if (orden.length <= MAX_REBANADAS) return orden.map((c, i) => ({ ...c, color: CATEGORICA[i] }));
  const grandes = orden.slice(0, MAX_REBANADAS - 1).map((c, i) => ({ ...c, color: CATEGORICA[i] }));
  const resto = orden.slice(MAX_REBANADAS - 1);
  return [...grandes, {
    categoria: `Otras (${resto.length})`,
    frecuencia: resto.reduce((s, c) => s + c.frecuencia, 0),
    porcentaje: resto.reduce((s, c) => s + c.porcentaje, 0),
    color: OTRAS
  }];
}

function Pastel({ config }) {
  const datos = rebanadas(config.datos);
  return (
    <div className="pastel">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={datos} dataKey="frecuencia" nameKey="categoria" innerRadius="0%" outerRadius="90%" stroke={HOJA} strokeWidth={2} isAnimationActive={false}>
            {datos.map(c => <Cell key={c.categoria} fill={c.color} />)}
          </Pie>
          {globo(c => [['Categoría', String(c.categoria)], ['Frecuencia', c.frecuencia], ['Porcentaje', `${numero(c.porcentaje, 1)} %`]])}
        </PieChart>
      </ResponsiveContainer>
      <ul className="leyenda">
        {datos.map(c => (
          <li key={c.categoria}>
            <span className="muestra" style={{ background: c.color }} aria-hidden="true" />
            {String(c.categoria)} <span className="secundario">{numero(c.porcentaje, 1)} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Dispersion({ config, d }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
        <CartesianGrid stroke="#E6DCCB" />
        <XAxis dataKey="x" type="number" domain={['auto', 'auto']} {...ejeX} label={etiquetaEje(config.ejes.x, 'x')} />
        <YAxis dataKey="y" type="number" domain={['auto', 'auto']} {...ejeY} allowDecimals label={etiquetaEje(config.ejes.y, 'y')} />
        {globo(p => [['Fila', p.fila + 1], [config.ejes.x, numero(p.x, d)], [config.ejes.y, numero(p.y, d)]])}
        <Scatter data={config.datos} fill={TINTA} stroke={HOJA} strokeWidth={2} isAnimationActive={false} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// Recharts no trae diagrama de caja: SVG propio, horizontal, con escala abajo
function Caja({ config, d }) {
  const c = config.datos;
  const ancho = 640, alto = 150, margen = 24, yCaja = 30, altoCaja = 50;
  const minimo = Math.min(c.min, ...c.atipicos), maximo = Math.max(c.max, ...c.atipicos);
  const rango = maximo - minimo || 1;
  const x = v => margen + ((v - minimo) / rango) * (ancho - 2 * margen);
  const medio = yCaja + altoCaja / 2;
  const marcas = [c.bigote_inf, c.q1, c.mediana, c.q3, c.bigote_sup, ...c.atipicos];
  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="caja-svg" role="img"
      aria-label={`Diagrama de caja: Q1 ${numero(c.q1, d)}, mediana ${numero(c.mediana, d)}, Q3 ${numero(c.q3, d)}, bigotes de ${numero(c.bigote_inf, d)} a ${numero(c.bigote_sup, d)}, ${c.atipicos.length} atípicos`}>
      <line x1={x(c.bigote_inf)} x2={x(c.q1)} y1={medio} y2={medio} stroke={TINTA} strokeWidth="2" />
      <line x1={x(c.q3)} x2={x(c.bigote_sup)} y1={medio} y2={medio} stroke={TINTA} strokeWidth="2" />
      <line x1={x(c.bigote_inf)} x2={x(c.bigote_inf)} y1={medio - 12} y2={medio + 12} stroke={TINTA} strokeWidth="2" />
      <line x1={x(c.bigote_sup)} x2={x(c.bigote_sup)} y1={medio - 12} y2={medio + 12} stroke={TINTA} strokeWidth="2" />
      <rect x={x(c.q1)} y={yCaja} width={Math.max(x(c.q3) - x(c.q1), 1)} height={altoCaja} rx="4" fill="rgba(62, 92, 118, 0.12)" stroke={TINTA} strokeWidth="2" />
      <line x1={x(c.mediana)} x2={x(c.mediana)} y1={yCaja} y2={yCaja + altoCaja} stroke={TINTA} strokeWidth="3" />
      {c.atipicos.map((v, i) => <circle key={i} cx={x(v)} cy={medio} r="5" fill={HOJA} stroke="#8A3B2F" strokeWidth="2" />)}
      <line x1={margen} x2={ancho - margen} y1={alto - 40} y2={alto - 40} stroke="#D6CBB8" />
      {[...new Set(marcas)].map(v => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1={alto - 44} y2={alto - 36} stroke="#BFB29C" />
          <text x={x(v)} y={alto - 20} textAnchor="middle" fontSize="12" fill="#6B645A">{numero(v, d)}</text>
        </g>
      ))}
      <text x={x(c.q1)} y={yCaja - 8} textAnchor="middle" fontSize="12" fill="#6B645A">Q1</text>
      <text x={x(c.mediana)} y={yCaja - 8} textAnchor="middle" fontSize="12" fill="#3B3732">Mediana</text>
      <text x={x(c.q3)} y={yCaja - 8} textAnchor="middle" fontSize="12" fill="#6B645A">Q3</text>
    </svg>
  );
}

// Tabla con los mismos datos: para quien no puede (o no quiere) leer la gráfica
function TablaGrafica({ config, d }) {
  const t = config.tipo;
  let encabezados, filas;
  if (t === 'histograma') {
    encabezados = ['Clase', 'Frecuencia', '%'];
    filas = config.datos.map(c => [`${numero(c.lim_inf, d)} – ${numero(c.lim_sup, d)}`, c.fi, numero(c.porcentaje, 1)]);
  } else if (t === 'poligono' || t === 'ojiva') {
    encabezados = [t === 'ojiva' ? 'Hasta' : 'Marca de clase', t === 'ojiva' ? 'Acumulado' : 'Frecuencia'];
    filas = config.datos.map(p => [numero(p.x, d), p.y]);
  } else if (t === 'barras' || t === 'pastel') {
    encabezados = ['Categoría', 'Frecuencia', '%'];
    filas = config.datos.map(c => [String(c.categoria), c.frecuencia, numero(c.porcentaje, 1)]);
  } else if (t === 'dispersion') {
    encabezados = ['Fila', config.ejes.x, config.ejes.y];
    filas = config.datos.slice(0, 200).map(p => [p.fila + 1, numero(p.x, d), numero(p.y, d)]);
  } else {
    const c = config.datos;
    encabezados = ['Medida', 'Valor'];
    filas = [['Mínimo', c.min], ['Q1', c.q1], ['Mediana', c.mediana], ['Q3', c.q3], ['Máximo', c.max],
      ['Bigotes', `${numero(c.bigote_inf, d)} a ${numero(c.bigote_sup, d)}`],
      ['Atípicos', c.atipicos.length ? c.atipicos.map(v => numero(v, d)).join(', ') : 'ninguno']]
      .map(([k, v]) => [k, typeof v === 'number' ? numero(v, d) : v]);
  }
  return (
    <details className="ver-tabla">
      <summary>Ver los datos de la gráfica</summary>
      <div className="mini-tabla desplazable">
        <table>
          <thead><tr>{encabezados.map(e => <th scope="col" key={e}>{e}</th>)}</tr></thead>
          <tbody>{filas.map((f, i) => <tr key={i}>{f.map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </details>
  );
}

const DIBUJOS = {
  histograma: Histograma,
  poligono: Linea,
  ojiva: (p) => <Linea {...p} ojiva />,
  barras: Barras,
  pastel: Pastel,
  dispersion: Dispersion,
  caja: Caja
};

// Una gráfica con su título, cómo leerla y sus datos en tabla
export default function Grafica({ config, decimales = 2 }) {
  const Dibujo = DIBUJOS[config.tipo];
  return (
    <figure className="tarjeta grafica">
      <figcaption>
        <h3>{config.titulo}</h3>
        {config.distribucion && (
          <p className="secundario">
            {config.distribucion.k} clases de ancho {numero(config.distribucion.ancho, decimales)} · {config.distribucion.n} datos
          </p>
        )}
      </figcaption>
      <Dibujo config={config} d={decimales} />
      <p className="lapiz como-leer">{config.como_leer}</p>
      <TablaGrafica config={config} d={decimales} />
    </figure>
  );
}
