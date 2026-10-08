estadistica-backend/
├── package.json
├── .env
├── src/
│   ├── server.js                # Arranque de Express
│   ├── app.js                   # Configuración de middlewares y rutas
│   ├── config/
│   │   └── db.js                # Pool de conexión MySQL (mysql2)
│   ├── middlewares/
│   │   ├── auth.js              # Verificación de JWT
│   │   ├── errorHandler.js      # Manejo central de errores
│   │   └── validate.js          # Validación con zod
│   ├── routes/
│   │   ├── auth.routes.js       # register, login, me
│   │   ├── dataset.routes.js    # subir excel, pegar datos, listar, obtener
│   │   ├── calculo.routes.js    # calcular estadísticos
│   │   ├── grafica.routes.js    # generar puntos para gráficas
│   │   └── definicion.routes.js # catálogo didáctico (fórmulas, glosario)
│   ├── services/
│   │   ├── ingest.service.js    # parsear excel / JSON → dataset
│   │   ├── inferencia.service.js# detectar tipo_dato, escala, naturaleza
│   │   └── ...
│   ├── calculos/
│   │   ├── tendenciaCentral.js  # media, mediana, moda
│   │   ├── variabilidad.js      # varianza, desviación, rango, CV
│   │   ├── posicion.js          # cuartiles, percentiles, deciles
│   │   ├── agrupados.js         # media/mediana/moda en datos agrupados
│   │   └── pasos.js             # generador del paso a paso + fórmula
│   ├── graficas/
│   │   ├── histograma.js
│   │   ├── poligono.js
│   │   ├── ojiva.js
│   │   ├── caja.js
│   │   └── ...
│   └── utils/
│       ├── ordenar.js
│       └── redondear.js
