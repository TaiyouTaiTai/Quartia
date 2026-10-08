import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import datasetRoutes from './routes/dataset.routes.js';
import calculoRoutes from './routes/calculo.routes.js';
import graficaRoutes from './routes/grafica.routes.js';
import definicionRoutes from './routes/definicion.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/calculos', calculoRoutes);
app.use('/api/graficas', graficaRoutes);
app.use('/api/definiciones', definicionRoutes);

app.use(errorHandler);

export default app;
