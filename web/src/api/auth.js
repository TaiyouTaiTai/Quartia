import { pedir } from './cliente.js';

export const registrar = ({ correo, nombre, clave }) =>
  pedir('/auth/registro', { metodo: 'POST', body: { correo, nombre, clave } });

export const iniciarSesion = ({ correo, clave }) =>
  pedir('/auth/login', { metodo: 'POST', body: { correo, clave } });

export const usuarioActual = () => pedir('/auth/me');
