import { pedir } from './cliente.js';

// Historial de un dataset: [{ id, nombre, creado_en, n_resultados, n_graficas }]
export const listar = (datasetId) => pedir(`/datasets/${datasetId}/analisis`);

// Un análisis completo: { id, dataset_id, creado_en, resultados: [...], graficas: [...] }
export const obtener = (id) => pedir(`/analisis/${id}`);

export const borrar = (id) => pedir(`/analisis/${id}`, { metodo: 'DELETE' });
