// Cliente de la API: agrega el token, convierte las respuestas de error del
// backend ({ error, detalles: [{ campo, mensaje }] }) en un ErrorApi fácil de
// mostrar en un formulario, y avisa cuando la sesión ya no es válida.

const CLAVE_TOKEN = 'quartia.token';

// localStorage puede fallar (modo privado, almacenamiento bloqueado): sin él
// la sesión simplemente dura lo que dure la pestaña.
let tokenEnMemoria = null;

export function leerToken() {
  try {
    return localStorage.getItem(CLAVE_TOKEN) ?? tokenEnMemoria;
  } catch {
    return tokenEnMemoria;
  }
}

export function guardarToken(token) {
  tokenEnMemoria = token;
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  } catch { /* se queda solo en memoria */ }
}

export class ErrorApi extends Error {
  constructor(status, mensaje, campos = {}, datos = null) {
    super(mensaje);
    this.status = status;
    this.campos = campos; // { correo: 'Escribe un correo válido', … }
    this.datos = datos;   // la respuesta completa, por si trae más detalle (ej. errores de /calculos)
  }
}

// La sesión la registra aquí para enterarse de un 401 (token vencido o inválido)
let alNoAutorizado = () => {};
export function cuandoNoAutorizado(fn) {
  alNoAutorizado = fn;
}

export async function pedir(ruta, { metodo = 'GET', body } = {}) {
  const token = leerToken();
  const esArchivo = body instanceof FormData;
  let r;
  try {
    r = await fetch(`/api${ruta}`, {
      method: metodo,
      headers: {
        ...(body && !esArchivo && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: body && !esArchivo ? JSON.stringify(body) : body
    });
  } catch {
    throw new ErrorApi(0, 'No se pudo contactar al servidor. Revisa tu conexión e intenta de nuevo.');
  }

  if (r.status === 204) return null;
  const datos = await r.json().catch(() => null);
  if (r.ok) return datos;

  // Solo es "sesión vencida" si mandamos un token; un 401 en el login es
  // simplemente una contraseña equivocada.
  if (r.status === 401 && token) alNoAutorizado();

  const campos = Object.fromEntries((datos?.detalles ?? []).map(d => [d.campo, d.mensaje]));
  throw new ErrorApi(r.status, datos?.error ?? 'Algo salió mal. Intenta de nuevo.', campos, datos);
}
