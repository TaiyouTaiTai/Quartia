// Prueba de humo de la API: rutas, autenticación y validación.
// No necesita MySQL: solo prueba lo que ocurre ANTES de llegar a la base de datos.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

let servidor, raiz, base, token, webDist;

before(async () => {
  // Un "build" falso del frontend para probar que Express lo sirve
  webDist = fs.mkdtempSync(path.join(os.tmpdir(), 'quartia-web-'));
  fs.writeFileSync(path.join(webDist, 'index.html'), '<!doctype html><div id="root"></div>');
  fs.mkdirSync(path.join(webDist, 'assets'));
  fs.writeFileSync(path.join(webDist, 'assets', 'app.js'), 'console.log(1)');

  // Configuración de prueba (dotenv no pisa variables que ya existen)
  Object.assign(process.env, {
    DB_HOST: '127.0.0.1', DB_PORT: '1', DB_USER: 'test', DB_PASSWORD: '', DB_NAME: 'test',
    JWT_SECRET: 'x'.repeat(40), JWT_EXPIRES: '1h', CORS_ORIGIN: '', WEB_DIST: webDist
  });
  const { default: app } = await import('../src/app.js');
  const { firmarToken } = await import('../src/middlewares/auth.js');
  token = firmarToken({ id: 1, correo: 'a@b.c' });
  servidor = app.listen(0);
  raiz = `http://127.0.0.1:${servidor.address().port}`;
  base = `${raiz}/api`;
});

after(async () => {
  servidor.close();
  fs.rmSync(webDist, { recursive: true, force: true });
  const { default: pool } = await import('../src/config/db.js');
  await pool.end();
});

const pedir = (ruta, { metodo = 'GET', body, conToken = true } = {}) => fetch(base + ruta, {
  method: metodo,
  headers: {
    ...(body && { 'Content-Type': 'application/json' }),
    ...(conToken && { Authorization: `Bearer ${token}` })
  },
  body: typeof body === 'string' ? body : body && JSON.stringify(body)
});

test('ruta inexistente → 404 en JSON', async () => {
  const r = await pedir('/no-existe');
  assert.equal(r.status, 404);
  assert.match((await r.json()).error, /no encontrada/);
});

test('sin token → 401', async () => {
  const r = await pedir('/datasets', { conToken: false });
  assert.equal(r.status, 401);
});

test('token falso → 401', async () => {
  const r = await fetch(`${base}/datasets`, { headers: { Authorization: 'Bearer abc' } });
  assert.equal(r.status, 401);
});

test('cálculo con datos inválidos → 400 con detalle por campo (antes: 500)', async () => {
  const r = await pedir('/calculos', { metodo: 'POST', body: { estadisticos: [] } });
  assert.equal(r.status, 400);
  const campos = (await r.json()).detalles.map(d => d.campo);
  assert.ok(campos.includes('dataset_id'));
  assert.ok(campos.includes('estadisticos'));
});

test('tipo de gráfica desconocido → 400', async () => {
  const r = await pedir('/graficas', { metodo: 'POST', body: { dataset_id: 1, columna_id: 1, tipo: 'radar' } });
  assert.equal(r.status, 400);
});

test('JSON mal formado → 400', async () => {
  const r = await pedir('/datasets', { metodo: 'POST', body: '{malo' });
  assert.equal(r.status, 400);
});

test('PATCH de columna rechaza campos fuera de la lista blanca', async () => {
  const r = await pedir('/datasets/1/columnas/1', { metodo: 'PATCH', body: { tipo_dato: 'texto' } });
  assert.equal(r.status, 400);
});

test('registro valida correo y contraseña', async () => {
  const r = await pedir('/auth/registro', { metodo: 'POST', conToken: false, body: { correo: 'no-es-correo', nombre: 'A', clave: '123' } });
  assert.equal(r.status, 400);
});

test('si la base de datos no responde, el health lo dice sin filtrar detalles', async () => {
  const r = await pedir('/health', { conToken: false });
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), { ok: false, db: false });
});

test('frontend: una ruta de React devuelve index.html (para poder recargar la página)', async () => {
  const r = await fetch(`${raiz}/datasets/3`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /text\/html/);
  assert.match(await r.text(), /id="root"/);
});

test('frontend: sirve los archivos estáticos del build', async () => {
  const r = await fetch(`${raiz}/assets/app.js`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /javascript/);
});

test('frontend: /api nunca devuelve el index.html', async () => {
  for (const ruta of ['/api', '/api/no-existe', '/api/datasets/x/y']) {
    const r = await fetch(raiz + ruta);
    assert.match(r.headers.get('content-type'), /json/, ruta);
  }
});
